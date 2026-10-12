const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./loadAppModule.cjs');
const { hookHarness } = require('./hookHarness.cjs');
const baseLoad = createLoader();
const logic = baseLoad('services/quickSetup');
const { HOUSE, PAGES } = baseLoad('data/const');
const info = { name: 'Testhus', welcome: '', wifiName: '', wifiPassword: '', ownerName: '', ownerPhone: '' };
const nextTick = () => new Promise((resolve) => setImmediate(resolve));

function screenHarness({ failAI = false, microphone = true, finishTopic = false, failTranscript = false, failAudioReset = false, intro = false, started = false } = {}) {
  const driver = hookHarness();
  let draft = logic.createSetupDraft(info, [], HOUSE, PAGES);
  // Flow-testene starter efter startsiden, medmindre testen beder om andet.
  if (started) draft = { ...draft, selectedIds: ['bad'], step: 1 };
  let published = null;
  let answerCalls = [];
  const completed = { current: false };
  const uploads = [];
  let serial = 0;
  const setDraft = (change) => { draft = typeof change === 'function' ? change(draft) : change; };
  const api = {
    ContinueQuickSetup: async (request) => {
      answerCalls.push(request);
      if (failAI) throw new Error('AI-forbindelsen fejlede');
      return { reply: 'Tak for svaret.', question: finishTopic ? '' : 'Er der andet?', guideText: request.messages.filter((message) => message.role === 'user').map((message) => message.content).join('\n\n'), complete: finishTopic, houseInfo: request.houseInfo };
    },
    TranscribeAudio: async () => { if (failTranscript) throw new Error('Transskription fejlede'); return 'Indtalt svar'; },
  };
  const node = (type, props) => ({ type, props });
  const native = Object.fromEntries(['Text', 'View', 'ScrollView', 'Pressable', 'ActivityIndicator', 'TextInput', 'Image', 'KeyboardAvoidingView'].map((type) => [type, type]));
  const load = createLoader({
    react: driver.hooks, 'react/jsx-runtime': { jsx: node, jsxs: node, Fragment: 'Fragment' },
    'react-native': { ...native, Platform: { OS: 'ios' }, AccessibilityInfo: { isReduceMotionEnabled: async () => true }, Keyboard: { addListener: () => ({ remove() {} }), dismiss() {} },
      Animated: { View: 'View', Value: class {}, timing: () => ({}), delay: () => ({}), sequence: () => ({}), loop: () => ({ start() {}, stop() {} }) }, useWindowDimensions: () => ({ width: 1194 }), AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-status-bar': { StatusBar: 'StatusBar' }, 'react-native-safe-area-context': { SafeAreaView: 'View' }, '@expo/vector-icons': { Ionicons: 'Ionicons' },
    'expo-audio': { useAudioRecorder: () => ({ prepareToRecordAsync: async () => {}, record() {}, stop: async () => {}, uri: 'file:///recording.m4a' }), useAudioRecorderState: () => ({}), setAudioModeAsync: async (mode) => { if (failAudioReset && !mode.allowsRecording) throw new Error('Lydsession fejlede'); }, AudioModule: { requestRecordingPermissionsAsync: async () => ({ granted: microphone }) }, RecordingPresets: { HIGH_QUALITY: {} } },
    'expo-image-picker': { launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///photo.jpg', fileSize: 1024 }] }) },
    'services/Request.js': api, 'styles/GlobalStyle.js': { GlobalStyle: { colors: {} } },
    'services/useQuickSetupDraft.js': { __esModule: true, default: () => ({ draft, setDraft, saveStatus: 'saved', completed, flush: async () => {}, load: async () => {} }) },
    'database/database.js': { newBlockId: () => `id-${++serial}`, uploadImage: async (houseId, pageId) => { uploads.push({ houseId, pageId }); return 'https://example.test/photo.jpg'; }, publishQuickSetup: async (_houseId, value) => { published = value; return { house: value.houseInfo, pages: logic.setupPages(value).filter((page) => page.publishable) }; } },
  });
  const Screen = load('screens/QuickSetupScreen').default;
  let header = {};
  let closed = 0;
  const navigation = { addListener: () => () => {}, setOptions(options) { header = options; }, goBack() { closed++; } };
  function expand(element) {
    if (!element || typeof element !== 'object') return element;
    if (Array.isArray(element)) return element.flatMap(expand);
    if (typeof element.type === 'function') return expand(element.type(element.props));
    return { ...element, children: [element.props?.children].flat().map(expand).flat().filter(Boolean) };
  }
  const text = (element) => typeof element === 'string' ? element : (element?.children || []).map(text).join('');
  const all = (element) => typeof element === 'object' && element ? [element, ...(element.children || []).flatMap(all)] : [];
  const render = () => expand(driver.render(() => Screen({ navigation, houseId: 'test', setHouse() {}, setPages() {} })));
  const find = (type, label) => all(render()).find((element) => element.type === type && (element.props.accessibilityLabel === label || text(element) === label));
  if (!intro) find('Pressable', 'Kom i gang').props.onPress();
  return {
    draft: () => draft, setDraft, published: () => published, calls: () => answerCalls, uploads, render,
    failAI(value) { failAI = value; },
    failTranscript(value) { failTranscript = value; },
    async press(label) { const button = find('Pressable', label); assert.ok(button, `Knap findes: ${label}`); assert.ok(!button.props.disabled, `Knap er aktiv: ${label}`); await button.props.onPress(); },
    type(label, value) { const input = find('TextInput', label); assert.ok(input, `Felt findes: ${label}`); input.props.onChangeText(value); },
    disabled(label) { return !!find('Pressable', label)?.props.disabled; },
    text: () => text(render()),
    // Knapperne i topbjælken sættes med navigation.setOptions og findes ikke i selve skærmen.
    header(side) { render(); return header[side]?.(); },
    closed: () => closed,
  };
}

test('udlejer kan vælge kategorier, chatte, tilføje billede og godkende', async () => {
  const h = screenHarness();
  assert.ok(h.disabled('Start samtalen'));
  await h.press('Bad'); await h.press('Start samtalen');
  assert.equal(h.draft().step, 1);
  await h.press('Spring resten af emnet over');
  h.type('Dit svar til assistenten', 'Luft ud efter bad.'); await h.press('Send svar');
  assert.equal(h.draft().sessions.bad.guideText, 'Luft ud efter bad.');
  assert.equal(h.draft().sessions.bad.input, '');
  await h.press('Spring resten af emnet over');
  await h.press('Vælg billeder');
  assert.deepEqual(h.uploads, [{ houseId: 'test', pageId: 'bad' }]);
  assert.equal(h.draft().sessions.bad.images.length, 1);
  await h.press('Gennemse guiden');
  h.type('Tekst 1', 'Åbn vinduet efter bad.');
  await h.press('Godkend og opret guide');
  assert.equal(h.published().sessions.bad.guideText, 'Åbn vinduet efter bad.');
  assert.ok(h.text().includes('Sommerhuset er klar'));
});

test('AI-fejl bevarer indtastningen og et nyt forsøg tilføjer kun ét svar', async () => {
  const h = screenHarness({ failAI: true });
  await h.press('Bad'); await h.press('Start samtalen'); await h.press('Bad');
  h.type('Dit svar til assistenten', 'Mit svar'); await h.press('Send svar');
  assert.equal(h.draft().sessions.bad.input, 'Mit svar');
  assert.equal(h.draft().sessions.bad.messages.length, 1);
  h.failAI(false); await h.press('Send svar');
  assert.equal(h.draft().sessions.bad.messages.length, 3);
});

test('rettelse af gammelt svar fjerner efterfølgende svar fra AI-grundlaget', async () => {
  const h = screenHarness();
  await h.press('Bad'); await h.press('Start samtalen'); await h.press('Bad');
  h.type('Dit svar til assistenten', 'Første svar'); await h.press('Send svar');
  h.type('Dit svar til assistenten', 'Andet svar'); await h.press('Send svar');
  await h.press('Ret svar 1');
  h.type('Dit svar til assistenten', 'Rettet første svar'); await h.press('Gem rettelse');
  assert.equal(h.calls().at(-1).messages.length, 2);
  assert.equal(h.draft().sessions.bad.guideText, 'Rettet første svar');
  assert.equal(h.draft().sessions.bad.editIndex, null);
});

test('mikrofonafslag giver en fejl og tekstsvar virker stadig', async () => {
  const h = screenHarness({ microphone: false });
  await h.press('Bad'); await h.press('Start samtalen'); await h.press('Indtal svar');
  assert.ok(h.text().includes('Mikrofonen er ikke tilladt'));
  h.type('Dit svar til assistenten', 'Testhus'); await h.press('Send svar');
  assert.equal(h.calls().length, 1);
});

test('stop sender talesvaret direkte til chatten uden et ekstra tryk på Send', async () => {
  const h = screenHarness();
  await h.press('Bad'); await h.press('Start samtalen'); await h.press('Indtal svar');
  await h.press('Stop 0:00');
  assert.equal(h.draft().sessions['house-info'].input, '');
  assert.equal(h.calls().length, 1);
  assert.equal(h.draft().sessions['house-info'].messages[1].content, 'Indtalt svar');
});

test('et usendt svar forhindrer publicering indtil ejeren har behandlet det', async () => {
  const h = screenHarness();
  await h.press('Bad'); await h.press('Start samtalen');
  h.type('Dit svar til assistenten', 'Jeg er stadig ved at skrive');
  h.setDraft((draft) => ({ ...draft, step: 3 }));
  assert.ok(h.disabled('Godkend og opret guide'));
  assert.ok(h.text().includes('endnu ikke er sendt'));
  assert.equal(h.published(), null);
});

test('et uploadet billede kan fjernes fra kladden igen uden at publicere', async () => {
  const h = screenHarness();
  await h.press('Bad'); await h.press('Start samtalen'); await h.press('Spring resten af emnet over');
  await h.press('Spring resten af emnet over'); await h.press('Vælg billeder');
  await h.press('Fjern billede 1');
  assert.equal(h.draft().sessions.bad.images.length, 0);
  assert.equal(h.published(), null);
});

test('kladden genindlæses, og autosave skriver i rækkefølge efter en fejl', async () => {
  const driver = hookHarness();
  const draft = logic.createSetupDraft(info, [], HOUSE, PAGES);
  draft.sessions.bad.input = 'Ikke sendt endnu';
  const writes = [];
  let rejectFirst = true;
  const load = createLoader({ react: driver.hooks, 'database/database.js': {
    getHouse: async () => ({ ...info, quickSetupDraft: draft }), getPages: async () => [],
    saveQuickSetupDraft: async (_id, value) => { writes.push(value.houseInfo.name); if (rejectFirst) { rejectFirst = false; throw new Error('Offline'); } },
  } }, { setTimeout: () => 0, clearTimeout() {} });
  const useDraft = load('services/useQuickSetupDraft').default;
  const render = () => driver.render(() => useDraft('test'));
  render(); await nextTick();
  let state = render(); assert.equal(state.draft.sessions.bad.input, 'Ikke sendt endnu');
  state.setDraft((value) => ({ ...value, houseInfo: { ...value.houseInfo, name: 'Første' } }));
  state = render(); const first = state.flush();
  state.setDraft((value) => ({ ...value, houseInfo: { ...value.houseInfo, name: 'Andet' } }));
  state = render(); const second = state.flush();
  await assert.rejects(first, /Offline/); await second;
  assert.deepEqual(writes, ['Første', 'Andet']);
  assert.equal(render().saveStatus, 'saved');
  driver.unmount();
});

test('færdige emner skifter automatisk, og sidste emne åbner billedtrinnet', async () => {
  const h = screenHarness({ finishTopic: true });
  await h.press('Bad'); await h.press('Start samtalen');
  h.type('Dit svar til assistenten', 'Huset hedder Testhus.'); await h.press('Send svar');
  assert.equal(h.draft().currentTopicId, 'bad');
  assert.equal(h.draft().sessions['house-info'].complete, true);
  await h.press('Indtal svar'); await h.press('Stop 0:00');
  assert.equal(h.draft().step, 2);
  assert.equal(h.draft().sessions.bad.messages[1].content, 'Indtalt svar');
});

test('lydsessionens oprydning må ikke blokere talesvaret', async () => {
  const h = screenHarness({ failAudioReset: true });
  await h.press('Bad'); await h.press('Start samtalen');
  await h.press('Indtal svar'); await h.press('Stop 0:00');
  assert.equal(h.calls().length, 1);
  assert.equal(h.draft().sessions['house-info'].messages[1].content, 'Indtalt svar');
});

test('fejlet transskription kan prøves igen uden en ny optagelse', async () => {
  const h = screenHarness({ failTranscript: true });
  await h.press('Bad'); await h.press('Start samtalen');
  await h.press('Indtal svar'); await h.press('Stop 0:00');
  assert.equal(h.calls().length, 0);
  h.failTranscript(false); await h.press('Prøv talesvaret igen');
  assert.equal(h.calls().length, 1);
});

test('talesvar bevares efter AI-fejl og kan sendes igen uden dubletter', async () => {
  const h = screenHarness({ failAI: true });
  await h.press('Bad'); await h.press('Start samtalen');
  await h.press('Indtal svar'); await h.press('Stop 0:00');
  assert.equal(h.draft().sessions['house-info'].input, 'Indtalt svar');
  assert.equal(h.draft().sessions['house-info'].messages.length, 1);
  h.failAI(false); await h.press('Send svar');
  assert.equal(h.draft().sessions['house-info'].messages.length, 3);
});

test('et billede kan flyttes mellem to AI-tekstblokke og rækkefølgen godkendes', async () => {
  const h = screenHarness();
  await h.press('Bad'); await h.press('Start samtalen'); await h.press('Spring resten af emnet over');
  h.type('Dit svar til assistenten', 'Drej mod venstre for varmt vand.\n\nÅbn vinduet efter bad.'); await h.press('Send svar');
  assert.equal(h.draft().sessions.bad.blocks.length, 2);
  await h.press('Spring resten af emnet over'); await h.press('Vælg billeder');
  await h.press('Flyt billede 3 op');
  assert.deepEqual(Array.from(h.draft().sessions.bad.blocks, (block) => block.type), ['text', 'image', 'text']);
  await h.press('Gennemse guiden'); await h.press('Godkend og opret guide');
  assert.deepEqual(Array.from(logic.buildPageBlocks(h.published().sessions.bad, 'bad'), (block) => block.type), ['text', 'image', 'text']);
});

test('startsiden forklarer forløbet, og hjælperens knap vælger de almindelige kategorier', async () => {
  const h = screenHarness({ intro: true });
  assert.ok(h.text().includes('Hej, og velkommen!'));
  for (const title of ['Vælg kategorier', 'Fortæl', 'Tilføj billeder', 'Godkend']) assert.ok(h.text().includes(title), title);
  assert.ok(!h.text().includes('Hvad skal gæsterne vide om?'));
  await h.press('Kom i gang');
  assert.ok(h.text().includes('Hvad skal gæsterne vide om?'));
  assert.ok(h.disabled('Start samtalen'));
  await h.press('Sauna'); await h.press('Vælg de mest almindelige');
  assert.deepEqual(Array.from(h.draft().selectedIds), ['sauna', 'koekken', 'bad', 'ankomst', 'udtjekning', 'affald']);
  assert.ok(!h.disabled('Start samtalen'));
  await h.press('Fravælg de mest almindelige');
  assert.deepEqual(Array.from(h.draft().selectedIds), ['sauna']);
});

test('en påbegyndt kladde bydes velkommen tilbage og fortsætter på samme trin', async () => {
  const h = screenHarness({ intro: true, started: true });
  assert.ok(h.text().includes('Velkommen tilbage!'));
  assert.ok(h.text().includes('trin 2: Samtale'));
  await h.press('Start forfra');
  assert.ok(h.text().includes('Vil du erstatte denne kladde'));
  await h.press('Behold kladden');
  await h.press('Fortsæt hvor du slap');
  assert.equal(h.draft().step, 1);
  assert.ok(h.text().includes('Dit svar til assistenten') || h.text().includes('Om sommerhuset'));
});

test('en egen kategori kan tilføjes med knappen og bliver valgt med det samme', async () => {
  const h = screenHarness();
  await h.press('Tilføj egen kategori');
  assert.equal(h.draft().categories.some((category) => category.custom && category.title === ''), false);
  h.type('Navn på egen kategori', '  Pool ');
  await h.press('Tilføj egen kategori');
  const pool = h.draft().categories.find((category) => category.title === 'Pool');
  assert.ok(pool);
  assert.deepEqual(Array.from(h.draft().selectedIds), [pool.id]);
  assert.ok(!h.disabled('Start samtalen'));
});

test('topbjælkens tilbageknap går ét trin tilbage, og luk findes på alle trin', async () => {
  const h = screenHarness({ intro: true });
  assert.equal(h.header('headerLeft'), null);
  assert.equal(h.header('headerRight').props.accessibilityLabel, 'Luk');
  await h.press('Kom i gang'); await h.press('Bad'); await h.press('Start samtalen');
  assert.equal(h.draft().step, 1);
  assert.ok(!h.text().includes('Gem og luk'));
  h.header('headerLeft').props.onPress();
  assert.equal(h.draft().step, 0);
  assert.deepEqual(Array.from(h.draft().selectedIds), ['bad']);
  h.header('headerLeft').props.onPress();
  assert.ok(h.text().includes('Hej, og velkommen!') || h.text().includes('Velkommen tilbage!'));
  assert.equal(h.header('headerLeft'), null);
  h.header('headerRight').props.onPress();
  assert.equal(h.closed(), 1);
});

test('wifi kan fravælges, så der hverken spørges om det eller vises wifi-felter', async () => {
  const h = screenHarness();
  h.setDraft((draft) => ({ ...draft, houseInfo: { ...draft.houseInfo, wifiName: 'Klitten' }, initialHouseInfo: { ...draft.initialHouseInfo, wifiName: 'Klitten' } }));
  assert.ok(logic.setupTopics(h.draft())[0].hints.includes('wifi-navn'));
  await h.press('Wifi');
  assert.equal(h.draft().wifi, false);
  assert.equal(h.draft().houseInfo.wifiName, '');
  assert.ok(logic.setupTopics(h.draft())[0].hints.includes('ikke wifi'));
  assert.equal(logic.setupTopics(h.draft())[0].hintsNoWifi, undefined);
  await h.press('Bad'); await h.press('Start samtalen');
  assert.ok(!h.text().includes('Wifi-navn'));
  h.setDraft((draft) => ({ ...draft, step: 0 }));
  await h.press('Wifi');
  assert.equal(h.draft().houseInfo.wifiName, 'Klitten');
  assert.ok(logic.isSetupDraft(h.draft()));
});

test('trinviseren kan hoppe frem til trin, man har været på før', async () => {
  const h = screenHarness();
  assert.ok(h.disabled('Trin 2: Samtale'));
  await h.press('Bad'); await h.press('Start samtalen');
  assert.ok(h.disabled('Trin 3: Billeder'));
  h.setDraft((draft) => logic.goToStep(draft, 2));
  await h.press('Trin 1: Kategorier');
  assert.equal(h.draft().step, 0);
  assert.equal(h.draft().maxStep, 2);
  assert.ok(h.disabled('Trin 4: Godkend'));
  await h.press('Trin 3: Billeder');
  assert.equal(h.draft().step, 2);
  assert.ok(logic.isSetupDraft(h.draft()));
  // Uden valgte kategorier kan man ikke hoppe videre fra kategorisiden.
  await h.press('Trin 1: Kategorier'); await h.press('Bad');
  assert.ok(h.disabled('Trin 3: Billeder'));
});
