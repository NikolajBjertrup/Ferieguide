// Valgfri integrationstest: ét rigtigt AI-kald med fiktive husoplysninger.
// Kør: node --env-file=.env tests/liveQuickSetup.cjs
// Bruger API-forbrug, men skriver ikke til Firebase og læser ikke brugerdata.
const assert = require('node:assert/strict');
const { createLoader } = require('./loadAppModule.cjs');
const loader = createLoader({
  '@env': { OPENAI_API_KEY: process.env.OPENAI_API_KEY },
  'react-native': { Platform: { OS: 'ios' } },
}, { fetch });
const { ContinueQuickSetup } = loader('services/Request');
const houseInfo = { name: 'Testhuset', welcome: '', wifiName: '', wifiPassword: '', ownerName: '', ownerPhone: '' };
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
ContinueQuickSetup({
  topic: { id: 'bad', title: 'Bad', hints: 'Betjening og udluftning.' },
  session: { guideText: '' }, houseInfo,
  messages: [
    { role: 'assistant', content: 'Hvad skal gæsterne vide om badeværelset?' },
    { role: 'user', content: 'Bruseren drejes til venstre for varmt vand. Efter bad skal vinduet stå åbent i 10 minutter. Afslut emnet med det.' },
  ],
  finish: true, signal: controller.signal,
}).then((result) => {
  assert.equal(result.complete, true);
  assert.ok(result.guideText.includes('10'));
  assert.ok(result.guideText.toLowerCase().includes('venstre'));
  console.log('Live AI-test bestået: struktureret svar og konkrete oplysninger bevaret. Ingen Firebase-skrivninger.');
}).catch((error) => {
  console.error('Live AI-test fejlede: ' + error.message);
  process.exitCode = 1;
}).finally(() => clearTimeout(timeout));
