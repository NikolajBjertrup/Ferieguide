// Integrationstest med en lokal, syntetisk optagelse. Ingen bruger- eller Firebase-data.
// node --env-file=.env tests/liveSpeech.cjs /absolut/sti/til/test.wav
const fs = require('node:fs');
const { pathToFileURL, fileURLToPath } = require('node:url');
const assert = require('node:assert/strict');
const { createLoader } = require('./loadAppModule.cjs');
const { createExpoFormData } = require('./expoFormData.cjs');

// Kun enhedens lokale fillæsning simuleres. Selve FormData og multipart-kodningen
// kommer fra den installerede Expo-version og accepterer ikke det gamle URI-objekt.
const expo = createExpoFormData();
class LocalFileRequest {
  open(method, uri) { assert.equal(method, 'GET'); this.uri = uri; }
  send() {
    assert.equal(this.responseType, 'blob');
    try {
      this.response = new Blob([fs.readFileSync(fileURLToPath(this.uri))]);
      this.status = 0;
      this.onload();
    } catch { this.onerror?.(); }
  }
  abort() { this.onabort?.(); }
}

const load = createLoader({ '@env': { OPENAI_API_KEY: process.env.OPENAI_API_KEY }, 'react-native': { Platform: { OS: 'ios' } } }, {
  XMLHttpRequest: LocalFileRequest, FormData: expo.FormData,
  fetch: async (url, options) => {
    if (!(options.body instanceof expo.FormData)) return fetch(url, options);
    const { body, boundary } = await expo.convertFormDataAsync(options.body);
    return fetch(url, { ...options, body, headers: { ...options.headers, 'Content-Type': `multipart/form-data; boundary=${boundary}` } });
  },
});
const { TranscribeAudio, ContinueQuickSetup } = load('services/Request');
const { splitGuideText } = load('services/quickSetup');
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 45000);
(async () => {
  const text = await TranscribeAudio(pathToFileURL(process.argv[2]).href, controller.signal);
  assert.match(text.toLowerCase(), /venstre/);
  const result = await ContinueQuickSetup({ topic: { id: 'bad', title: 'Bad', hints: 'Vand og udluftning er to særskilte instruktioner.' }, session: { guideText: '' },
    houseInfo: { name: 'Testhus', welcome: '', wifiName: '', wifiPassword: '', ownerName: '', ownerPhone: '' },
    messages: [{ role: 'user', content: text }], finish: true, signal: controller.signal });
  assert.equal(result.complete, true);
  assert.match(result.guideText.toLowerCase(), /venstre/);
  assert.ok(splitGuideText(result.guideText).length >= 2);
  console.log('Taletest bestået: lyd → Expo multipart → transskription → AI-svar med separate tekstblokke. Ingen Firebase-skrivninger.');
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => clearTimeout(timeout));
