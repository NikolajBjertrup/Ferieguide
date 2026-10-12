const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./loadAppModule.cjs');
const { createExpoFormData } = require('./expoFormData.cjs');

const expo = createExpoFormData();
const audioBytes = new Uint8Array([82, 73, 70, 70, 0, 255, 128, 1]);
function harness({ platform = 'ios', event = 'load', status = 0, empty = false, apiStatus = 200, transcript = 'Et dansk talesvar.' } = {}) {
  const reads = []; const uploads = []; const closed = [];
  const audio = new Blob(empty ? [] : [audioBytes], { type: 'application/octet-stream' });
  audio.close = () => closed.push('original');
  const slice = audio.slice.bind(audio);
  audio.slice = (...args) => { const blob = slice(...args); blob.close = () => closed.push('upload'); return blob; };
  class LocalRequest {
    open(method, uri) { this.method = method; this.uri = uri; }
    send() { reads.push(this); this.status = status; this.response = audio; if (event !== 'pending') this['on' + event]?.(); }
    abort() { this.aborted = true; this.onabort?.(); }
  }
  const api = createLoader({ '@env': { OPENAI_API_KEY: 'test-only' }, 'react-native': { Platform: { OS: platform } } }, {
    XMLHttpRequest: LocalRequest, FormData: expo.FormData,
    fetch: async (url, options) => {
      if (url.startsWith('blob:')) return { blob: async () => new Blob([audioBytes], { type: 'audio/webm;codecs=opus' }) };
      const encoded = await expo.convertFormDataAsync(options.body);
      uploads.push({ url, options, ...encoded });
      return { ok: apiStatus === 200, status: apiStatus, json: async () => ({ text: transcript }) };
    },
  })('services/Request');
  return { ...api, reads, uploads, closed };
}

test('Expo 57 afviser det gamle URI-objekt med præcis den rapporterede fejl', async () => {
  const form = new expo.FormData();
  form.append('file', { uri: 'file:///recording.m4a', name: 'svar.m4a', type: 'audio/mp4' });
  await assert.rejects(expo.convertFormDataAsync(form), /Unsupported FormDataPart implementation/);
});

test('native talesvar bliver til gyldig Expo multipart med lydbytes, filnavn og sprog', async () => {
  for (const platform of ['ios', 'android']) {
    for (const [extension, mime] of [['m4a', 'audio/mp4'], ['wav', 'audio/wav']]) {
      const h = harness({ platform });
      assert.equal(await h.TranscribeAudio(`file:///recording.${extension}`), 'Et dansk talesvar.');
      assert.equal(h.reads.length, 1);
      assert.equal(h.reads[0].responseType, 'blob');
      assert.equal(h.reads[0].method, 'GET');
      assert.equal(h.uploads.length, 1);
      const upload = h.uploads[0];
      const body = Buffer.from(upload.body);
      assert.ok(body.includes(Buffer.from(audioBytes)), 'Lydens binære indhold bevares');
      assert.ok(body.includes(`filename="svar.${extension}"`));
      assert.ok(body.includes(`content-type: ${mime}`));
      assert.ok(body.includes('name="language"\r\n\r\nda\r\n'));
      assert.ok(body.includes('name="model"\r\n\r\nwhisper-1\r\n'));
      assert.equal(upload.options.headers['Content-Type'], undefined);
      assert.equal(upload.url, 'https://api.openai.com/v1/audio/transcriptions');
      assert.deepEqual(h.closed.sort(), ['original', 'upload']);
    }
  }
});

test('web-optagelser forbliver Blob-upload uden native fillæsning', async () => {
  const h = harness({ platform: 'web' });
  assert.equal(await h.TranscribeAudio('blob:recording'), 'Et dansk talesvar.');
  assert.equal(h.reads.length, 0);
  assert.ok(Buffer.from(h.uploads[0].body).includes('filename="svar.webm"'));
});

test('tomme og ulæselige optagelser giver en forståelig fejl uden upload', async () => {
  for (const options of [{ empty: true }, { status: 404 }, { event: 'error' }, { event: 'timeout' }]) {
    const h = harness(options);
    await assert.rejects(h.TranscribeAudio('file:///recording.m4a'), /optagelsen|Optagelsen/);
    assert.equal(h.uploads.length, 0);
  }
});

test('afbrydelse under fillæsning afbryder native kaldet og starter ikke upload', async () => {
  const h = harness({ event: 'pending' });
  const controller = new AbortController();
  const pending = h.TranscribeAudio('file:///recording.m4a', controller.signal);
  controller.abort();
  await assert.rejects(pending, /afbrudt/);
  assert.equal(h.reads[0].aborted, true);
  assert.equal(h.uploads.length, 0);
  assert.equal(h.reads[0].onload, null);
});

test('allerede afbrudte talesvar læses og uploades ikke', async () => {
  const h = harness(); const controller = new AbortController(); controller.abort();
  await assert.rejects(h.TranscribeAudio('file:///recording.m4a', controller.signal), /afbrudt/);
  assert.equal(h.reads.length, 0);
  assert.equal(h.uploads.length, 0);
});

test('lydblobs frigives også ved API-fejl eller manglende transskription', async () => {
  for (const options of [{ apiStatus: 500 }, { transcript: '' }]) {
    const h = harness(options);
    await assert.rejects(h.TranscribeAudio('file:///recording.m4a'));
    assert.deepEqual(h.closed.sort(), ['original', 'upload']);
  }
});

test('Expo læser også native Blob via FileReader, når arrayBuffer ikke findes', async () => {
  // React Natives Blob har ikke browserens arrayBuffer-metode.
  let fileReaderCalls = 0;
  class NativeBlob extends Blob {
    arrayBuffer = undefined;
    slice(...args) { return new NativeBlob([super.slice(...args)], { type: args[2] }); }
  }
  class NativeFileReader {
    async readAsArrayBuffer(blob) {
      fileReaderCalls++;
      this.result = await Blob.prototype.arrayBuffer.call(blob);
      this.onload();
    }
  }
  const nativeExpo = createExpoFormData({ Blob: NativeBlob, FileReader: NativeFileReader });
  class LocalRequest {
    open() {}
    send() { this.status = 0; this.response = new NativeBlob([audioBytes]); this.onload(); }
  }
  const api = createLoader({ '@env': { OPENAI_API_KEY: 'test-only' }, 'react-native': { Platform: { OS: 'ios' } } }, {
    Blob: NativeBlob, XMLHttpRequest: LocalRequest, FormData: nativeExpo.FormData,
    fetch: async (_url, options) => {
      const { body } = await nativeExpo.convertFormDataAsync(options.body);
      assert.ok(Buffer.from(body).includes(Buffer.from(audioBytes)));
      return { ok: true, json: async () => ({ text: '  Talesvar.  ' }) };
    },
  })('services/Request');
  assert.equal(await api.TranscribeAudio('file:///recording.m4a'), 'Talesvar.');
  assert.equal(fileReaderCalls, 1);
});
