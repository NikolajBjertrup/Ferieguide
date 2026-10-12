// Vis de rigtige skærmkomponenter med fiktive data, uden login eller API-kald.
// node tests/previewQuickSetup.cjs → http://127.0.0.1:8096/?step=0&width=1194
// Startsiden vises som standard. Tilføj &intro=0 for at se trinnene, og &new=1 for en helt ny opsætning.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const RN = require('react-native-web');
const { createLoader } = require('./loadAppModule.cjs');
const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
const fontPath = path.resolve(__dirname, '../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');

http.createServer((request, response) => {
  if (request.url === '/ionicons.ttf') {
    response.writeHead(200, { 'Content-Type': 'font/ttf' }); response.end(fs.readFileSync(fontPath)); return;
  }
  if (request.url === '/house.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' }); response.end(fs.readFileSync(path.resolve(__dirname, '../assets/hus.png'))); return;
  }
  const params = new URL(request.url, 'http://127.0.0.1').searchParams;
  const step = Math.min(3, Math.max(0, Number(params.get('step')) || 0));
  const width = Number(params.get('width')) || 1194;
  const showIntro = params.get('intro') !== '0';
  const fresh = params.get('new') === '1';
  let draft;
  const load = createLoader({
    // Skærmens eneste useState(true) er startsiden; her kan den slås fra uden at trykke.
    react: { ...React, useState: (initial) => React.useState(initial === true ? showIntro : initial) },
    'react-native': { ...RN, useWindowDimensions: () => ({ width, height: 834, scale: 1, fontScale: 1 }),
      // React Native Web indlæser ellers billedet i en effekt, som ikke kører ved statisk rendering.
      Image: ({ source, style, accessibilityLabel }) => React.createElement('img', {
        src: source.uri, alt: accessibilityLabel, style: { ...RN.StyleSheet.flatten(style), objectFit: 'cover' },
      }),
    },
    'expo-status-bar': { StatusBar: () => null }, 'react-native-safe-area-context': { SafeAreaView: RN.View },
    '@expo/vector-icons': { Ionicons: ({ name, size, color }) => React.createElement(RN.Text, { style: { fontFamily: 'Ionicons', fontSize: size, color } }, String.fromCodePoint(glyphs[name] || glyphs['help-outline'])) },
    'expo-audio': { useAudioRecorder: () => ({}), useAudioRecorderState: () => ({}), RecordingPresets: { HIGH_QUALITY: {} } },
    'expo-image-picker': {}, 'services/Request.js': {}, 'database/database.js': {},
    'services/useQuickSetupDraft.js': { __esModule: true, default: () => ({ draft, setDraft: () => {}, saveStatus: 'saved', completed: { current: false } }) },
  });
  const { HOUSE, PAGES } = load('data/const');
  const { createSetupDraft, withGuideBlocks, withBlocks } = load('services/quickSetup');
  draft = createSetupDraft({ name: 'Sommerhuset ved klitterne', welcome: 'Velkommen til vores fristed. Vi håber, I vil nyde roen og de lange ture langs vandet.', wifiName: 'Klitten', wifiPassword: 'Ferie2026', ownerName: 'Anna', ownerPhone: '+45 12 34 56 78' }, [], HOUSE, PAGES);
  draft.selectedIds = ['koekken', 'bad', 'sauna', 'saerligt'];
  draft.step = step;
  draft.currentTopicId = 'koekken';
  draft.sessions.koekken.messages.push({ role: 'user', content: 'Opvaskemaskinen har en Eco-knap i højre side. Tabs ligger under vasken.' }, { role: 'assistant', content: 'Tak, det har jeg skrevet ind i forslaget.\n\nEr der noget særligt, gæsterne skal vide om kaffemaskinen?' });
  draft.sessions.koekken = withGuideBlocks(draft.sessions.koekken, 'Start opvaskemaskinen med Eco-knappen i højre side.\n\nI finder opvasketabs i skabet under vasken.', 'koekken');
  const kitchenBlocks = draft.sessions.koekken.blocks;
  draft.sessions.koekken = withBlocks(draft.sessions.koekken, [kitchenBlocks[0], { id: 'preview-photo', type: 'image', url: '/house.png' }, kitchenBlocks[1]]);
  draft.sessions.bad = withGuideBlocks(draft.sessions.bad, 'Åbn vinduet efter bad, så rummet bliver luftet ud.', 'bad');
  if (fresh) draft = { ...createSetupDraft({ name: 'Sommerhuset ved klitterne' }, [], HOUSE, PAGES), step };
  const Screen = load('screens/QuickSetupScreen').default;
  RN.AppRegistry.registerComponent('SetupPreview', () => () => React.createElement(Screen, { navigation: {}, houseId: 'preview', setPages: () => {}, setHouse: () => {} }));
  const { element, getStyleElement } = RN.AppRegistry.getApplication('SetupPreview');
  const markup = ReactDOMServer.renderToString(element);
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="da"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FerieGuide — designkontrol</title>${ReactDOMServer.renderToStaticMarkup(getStyleElement())}<style>@font-face{font-family:Ionicons;src:url('/ionicons.ttf')}html,body,#root{margin:0;min-height:100%;background:#FAF6F0}#root{display:flex;min-height:100vh}</style><body><div id="root">${markup}</div></body></html>`);
}).listen(8096, '127.0.0.1', () => console.log('Designkontrol: http://127.0.0.1:8096'));
