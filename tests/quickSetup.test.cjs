const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./loadAppModule.cjs');
const load = createLoader();
const logic = load('services/quickSetup');
const { HOUSE, PAGES } = load('data/const');
const { HOUSE_TOPIC_ID } = load('data/quickSetup');
const json = (value) => JSON.parse(JSON.stringify(value));
const emptyInfo = { name: 'Huset ved vandet', welcome: '', wifiName: '', wifiPassword: '', ownerName: '', ownerPhone: '' };
const makeDraft = () => logic.createSetupDraft(emptyInfo, [], HOUSE, PAGES);
const result = (changes = {}) => ({ reply: 'Tak.', question: 'Hvor ligger tilbehøret?', guideText: 'Tryk på Eco.', complete: false, houseInfo: emptyInfo, ...changes });

test('nye kladder fjerner gamle demooplysninger og bevarer ejerens egne fakta', () => {
  const pages = [{ ...PAGES[0], order: 0 }, { id: 'cykler', title: 'Cykler', icon: 'bicycle-outline', order: 1, active: true, custom: true, blocks: [{ id: 't', type: 'text', text: 'To cykler står i skuret.' }] }];
  const draft = logic.createSetupDraft({ ...HOUSE, name: 'Mit hus' }, pages, HOUSE, PAGES);
  assert.equal(draft.houseInfo.name, 'Mit hus');
  assert.equal(draft.houseInfo.wifiPassword, '');
  assert.equal(draft.sessions.koekken.guideText, '');
  assert.equal(draft.sessions.cykler.guideText, 'To cykler står i skuret.');
  assert.equal(draft.sessions.cykler.initialGuideText, 'To cykler står i skuret.');
  assert.deepEqual(json(draft.selectedIds), ['cykler']);
  assert.ok(logic.isSetupDraft(draft));
});

test('valgte emner følger kategorierne og starter altid med husinfo', () => {
  const draft = makeDraft();
  draft.selectedIds = ['sauna', 'bad'];
  assert.deepEqual(json(logic.setupTopics(draft).map((topic) => topic.id)), [HOUSE_TOPIC_ID, 'bad', 'sauna']);
  assert.equal(logic.setupPages(draft).filter((page) => page.publishable).length, 0);
});

test('AI-svar afvises ved ugyldigt format eller manglende opfølgning', () => {
  for (const invalid of [null, {}, result({ complete: 'false' }), result({ question: '' }), result({ houseInfo: {} }), result({ guideText: 'a'.repeat(16001) })]) {
    assert.throws(() => logic.validateAssistantResult(invalid), /kunne ikke læses/);
  }
  assert.equal(logic.validateAssistantResult(result({ complete: true, question: '' })).complete, true);
});

test('omsætning gemmer hele samtalen og ændrer kun husinfo på husinfo-trinnet', () => {
  const draft = makeDraft();
  const messages = [...draft.sessions.bad.messages, { role: 'user', content: 'Tryk på Eco.' }];
  const next = logic.applyAssistantResult(draft, 'bad', messages, result({ houseInfo: { ...emptyInfo, name: 'Opfundet navn' } }));
  assert.equal(next.houseInfo.name, emptyInfo.name);
  assert.equal(next.sessions.bad.messages.length, 3);
  assert.equal(next.sessions.bad.input, '');
  assert.equal(draft.sessions.bad.guideText, '');
  const house = logic.applyAssistantResult(draft, HOUSE_TOPIC_ID, [], result({ houseInfo: { ...emptyInfo, wifiPassword: 'Kode 123!' } }));
  assert.equal(house.houseInfo.wifiPassword, 'Kode 123!');
});

test('publiceringsblokke bevarer billedernes positioner og undgår gammel tekst', () => {
  const first = { id: 'i1', type: 'image', url: 'https://example.test/1.jpg' };
  const last = { id: 'i2', type: 'image', url: 'https://example.test/2.jpg' };
  const added = { id: 'i3', type: 'image', url: 'https://example.test/3.jpg' };
  const session = { guideText: 'Ny tekst', images: [first, added], basePage: { blocks: [first, { id: 't1', type: 'text', text: 'Gammelt' }, last, { id: 't2', type: 'text', text: 'Også gammelt' }] } };
  assert.deepEqual(json(logic.buildPageBlocks(session, 'bad')), [first, { id: 't1', type: 'text', text: 'Ny tekst' }, added]);
});

test('sammenligning af sider er uafhængig af Firestores rækkefølge på objektfelter', () => {
  const page = { title: 'Bad', icon: 'water-outline', blocks: [{ text: 'Test', type: 'text', id: '1' }] };
  const other = { icon: 'water-outline', title: 'Bad', blocks: [{ id: '1', type: 'text', text: 'Test' }] };
  assert.equal(JSON.stringify(logic.pageSnapshot(page)), JSON.stringify(logic.pageSnapshot(other)));
});

function databaseHarness(initialHouse, initialPages = {}, fail = false) {
  let writes = [];
  const deleteMarker = '__delete__';
  const snapshots = { 'houses/test': initialHouse, ...Object.fromEntries(Object.entries(initialPages).map(([id, page]) => [`houses/test/pages/${id}`, page])) };
  const firebase = {
    getFirestore: () => ({}), doc: (_db, ...parts) => parts.join('/'), deleteField: () => deleteMarker,
    runTransaction: async (_db, run) => {
      const staged = [];
      const result = await run({
        get: async (ref) => ({ exists: () => !!snapshots[ref], data: () => snapshots[ref] }),
        set: (ref, value) => staged.push({ ref, value }), update: (ref, value) => staged.push({ ref, value }),
      });
      if (fail) throw new Error('Simuleret netværksfejl');
      writes = staged;
      return result;
    },
  };
  const dbLoad = createLoader({
    'firebase/app': { initializeApp: () => ({}) },
    'firebase/auth': { initializeAuth: () => ({}), getReactNativePersistence: () => ({}) },
    '@react-native-async-storage/async-storage': {}, 'firebase/firestore': firebase,
    'firebase/storage': { getStorage: () => ({}) },
  });
  return { db: dbLoad('database/database'), writes: () => writes };
}

test('publicering skriver husinfo, nye sider og kladdesletning i samme transaktion', async () => {
  const draft = makeDraft();
  draft.selectedIds = ['bad', 'sauna'];
  draft.sessions.bad = logic.withGuideBlocks(draft.sessions.bad, 'Åbn vinduet efter bad.', 'bad');
  draft.houseInfo.welcome = 'Velkommen til vandet.';
  const h = databaseHarness(emptyInfo);
  const saved = await h.db.publishQuickSetup('test', draft);
  assert.equal(saved.pages.length, 1);
  assert.equal(saved.pages[0].active, true);
  assert.equal(saved.pages[0].id, 'bad');
  assert.equal(h.writes().length, 2);
  assert.equal(h.writes()[1].value.quickSetupDraft, '__delete__');
  assert.equal(saved.house.welcome, 'Velkommen til vandet.');
});

test('fejl i transaktion publicerer ingen sider og fjerner ikke kladden', async () => {
  const draft = makeDraft(); draft.selectedIds = ['bad']; draft.sessions.bad = logic.withGuideBlocks(draft.sessions.bad, 'Test', 'bad');
  const h = databaseHarness(emptyInfo, {}, true);
  await assert.rejects(h.db.publishQuickSetup('test', draft), /netværksfejl/);
  assert.equal(h.writes().length, 0);
});

test('samtidige ændringer i siden stopper hele publiceringen', async () => {
  const draft = makeDraft(); draft.selectedIds = ['bad']; draft.sessions.bad = logic.withGuideBlocks(draft.sessions.bad, 'Test', 'bad');
  const h = databaseHarness(emptyInfo, { bad: { title: 'Anden side', blocks: [] } });
  await assert.rejects(h.db.publishQuickSetup('test', draft), /ændret siden/);
  assert.equal(h.writes().length, 0);
});

test('en genoptaget kladde kan publiceres trods ny rækkefølge på Firestore-felter', async () => {
  const page = { title: 'Bad', icon: 'water-outline', active: false, order: 1, custom: true, blocks: [{ id: '1', type: 'text', text: 'Før' }] };
  const draft = logic.createSetupDraft(emptyInfo, [{ id: 'bad', ...page }], HOUSE, PAGES);
  // Firestore returnerer typisk map-felter i en anden rækkefølge end klienten.
  draft.sessions.bad.basePage = Object.fromEntries(Object.entries(draft.sessions.bad.basePage).reverse());
  draft.selectedIds = ['bad']; draft.sessions.bad = logic.withGuideBlocks(draft.sessions.bad, 'Efter', 'bad');
  const h = databaseHarness(emptyInfo, { bad: page });
  const result = await h.db.publishQuickSetup('test', draft);
  assert.equal(result.pages[0].blocks[0].text, 'Efter');
});

test('samtidige ændringer i husinfo overskrives ikke', async () => {
  const draft = makeDraft(); draft.houseInfo.name = 'Mit nye navn';
  const h = databaseHarness({ ...emptyInfo, name: 'Ændret på en anden enhed' });
  await assert.rejects(h.db.publishQuickSetup('test', draft), /Husinfo er ændret/);
  assert.equal(h.writes().length, 0);
});

test('AI-kald bruger struktureret svar, bevarer koder og respekterer afslutning', async () => {
  let sent;
  const api = createLoader({ '@env': { OPENAI_API_KEY: 'test-only' }, 'react-native': { Platform: { OS: 'ios' } } }, {
    fetch: async (_url, options) => { sent = JSON.parse(options.body); return { ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(result()) } }] }) }; },
  })('services/Request');
  const draft = makeDraft();
  const answer = await api.ContinueQuickSetup({ topic: { id: HOUSE_TOPIC_ID, title: 'Husinfo' }, session: draft.sessions[HOUSE_TOPIC_ID], houseInfo: { ...emptyInfo, wifiPassword: 'Kode 123!' }, messages: [], finish: true });
  assert.equal(sent.response_format.json_schema.strict, true);
  assert.equal(sent.store, false);
  assert.ok(sent.messages[1].content.includes('Kode 123!'));
  assert.equal(answer.complete, true);
  assert.equal(answer.question, '');
});

test('API-fejl og afvisninger indeholder ingen rå fejl eller hemmeligheder', async () => {
  for (const status of [401, 429, 500]) {
    const api = createLoader({ '@env': { OPENAI_API_KEY: 'test-only' }, 'react-native': { Platform: { OS: 'ios' } } }, {
      fetch: async () => ({ ok: false, status, text: async () => 'hemmelig debug-info' }),
    })('services/Request');
    await assert.rejects(api.ContinueQuickSetup({ topic: {}, session: {}, houseInfo: {}, messages: [] }), (error) => !error.message.includes('hemmelig'));
  }
});

test('gamle kladder migreres til tekstblokke uden at miste input eller billeder', () => {
  const draft = makeDraft();
  draft.sessions.bad.guideText = 'Bruseren.\n\nUdluftningen.';
  draft.sessions.bad.input = 'Mit ufærdige svar';
  draft.sessions.bad.images = [{ id: 'photo', type: 'image', url: 'https://example.test/1.jpg' }];
  delete draft.sessions.bad.blocks;
  const migrated = logic.migrateSetupDraft(draft);
  assert.deepEqual(json(migrated.sessions.bad.blocks.map((block) => block.type)), ['text', 'text', 'image']);
  assert.equal(migrated.sessions.bad.input, 'Mit ufærdige svar');
});

test('genskrivning bevarer et eksisterende billede mellem tekstblokke', () => {
  const session = logic.withBlocks({}, [{ id: 'a', type: 'text', text: 'Gammel tekst' }, { id: 'p', type: 'image', url: 'https://example.test/1.jpg' }, { id: 'b', type: 'text', text: 'Mere gammel tekst' }]);
  const result = logic.withGuideBlocks(session, 'Ny vejledning.\n\nNye oplysninger.', 'bad');
  assert.deepEqual(json(result.blocks.map((block) => block.type)), ['text', 'image', 'text']);
  assert.equal(result.blocks[2].text, 'Nye oplysninger.');
});

test('opdeling af eksisterende tekst flytter ikke billedet forbi et gammelt afsnit', () => {
  const image = { id: 'photo', type: 'image', url: 'https://example.test/1.jpg' };
  const page = { id: 'bad', title: 'Bad', icon: 'water-outline', blocks: [
    { id: 'a', type: 'text', text: 'Første afsnit.\n\nAndet afsnit.' }, image,
    { id: 'b', type: 'text', text: 'Tredje afsnit.' },
  ] };
  const draft = logic.createSetupDraft(emptyInfo, [page], HOUSE, PAGES);
  assert.deepEqual(json(draft.sessions.bad.blocks.map((block) => block.type)), ['text', 'text', 'image', 'text']);
  assert.equal(draft.sessions.bad.blocks[1].text, 'Andet afsnit.');
  assert.equal(draft.sessions.bad.blocks[3].text, 'Tredje afsnit.');
  assert.ok(logic.isSetupDraft(draft));
});

test('ugyldige blokke og gentagne blok-id’er afvises ved genoptagelse', () => {
  for (const blocks of [null, {}, [null], [{ id: 'a', type: 'text' }], [{ id: 'a', type: 'image' }],
    [{ id: 'a', type: 'text', text: 'Et' }, { id: 'a', type: 'text', text: 'To' }]]) {
    const draft = makeDraft(); draft.sessions.bad.blocks = blocks;
    assert.equal(logic.isSetupDraft(draft), false);
  }
});

// Multipart- og filtypetests findes i audioUpload.test.cjs og bruger Expo-koden direkte.
