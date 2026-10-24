const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./loadAppModule.cjs');
const { hookHarness } = require('./hookHarness.cjs');
const tick = () => new Promise((resolve) => setImmediate(resolve));

function appHarness({ savedMode, savedHouse = 'hus1', houses = [{ id: 'hus1' }], failHouse = false, failStorage = false } = {}) {
  const driver = hookHarness();
  const storage = new Map();
  if (savedHouse) storage.set('selectedHouse_ejer', savedHouse);
  if (savedMode) storage.set('displayMode_ejer', savedMode);
  let listener;
  const node = (type, props) => ({ type, props });
  const screenNames = ['Home', 'Guide', 'Page', 'OwnerLogin', 'OwnerPages', 'EditPage', 'QuickSetup', 'Camera', 'Login', 'Register', 'Houses', 'EditHouse', 'NewPage'];
  const load = createLoader({
    ...Object.fromEntries(screenNames.map((name) => [`screens/${name}Screen.js`, { __esModule: true, default: name }])),
    react: driver.hooks, 'react/jsx-runtime': { jsx: node, jsxs: node, Fragment: 'Fragment' },
    'react-native': { View: 'View', Text: 'Text', ActivityIndicator: 'ActivityIndicator' },
    'components/ButtonComponent.js': { __esModule: true, default: 'Button' },
    'components/HeaderSafeAreaComponent.js': { __esModule: true, default: 'HeaderSafeArea' },
    '@react-navigation/native': { NavigationContainer: 'NavigationContainer' },
    '@react-navigation/native-stack': { createNativeStackNavigator: () => ({ Screen: 'Screen', Navigator: 'Navigator' }) },
    'firebase/auth': { onAuthStateChanged: (_auth, callback) => { listener = callback; return () => {}; } },
    '@react-native-async-storage/async-storage': { getItem: async (key) => { if (failStorage) throw new Error('Storage-fejl'); return storage.get(key) || null; }, setItem: async (key, value) => storage.set(key, value), removeItem: async (key) => storage.delete(key) },
    'expo-linking': { createURL: () => 'ferieguide://' },
    'styles/GlobalStyle.js': { GlobalStyle: { colors: {} } },
    'database/database.js': { auth: {}, getHouse: async (id) => { if (failHouse) throw new Error('Offline'); return { id, name: 'Huset' }; }, getHouses: async () => houses, getPages: async () => [] },
  }, { __DEV__: false });
  const App = load('App').default;
  const render = () => driver.render(App);
  const flatten = (value) => Array.isArray(value) ? value.flatMap(flatten) : value && typeof value === 'object' ? [value, ...flatten(value.props?.children)] : [];
  const routes = () => flatten(render()).filter((element) => element.type === 'Screen');
  render();
  return {
    async auth(user) { await listener(user); for (let i = 0; i < 3; i++) { render(); await tick(); } },
    names: () => routes().map((element) => element.props.name),
    routes,
    button(title) { return flatten(render()).find((element) => element.type === 'Button' && element.props.title === title)?.props; },
    failHouse(value) { failHouse = value; },
    props(name) {
      const route = routes().find((element) => element.props.name === name);
      // Skærme med topbjælke er pakket ind i HeaderSafeArea; testen skal se selve skærmens props
      let element = route.props.children({});
      if (element.type === 'HeaderSafeArea') element = element.props.children;
      return element.props;
    },
    async settle() { render(); await tick(); render(); }, storage,
  };
}

test('login åbner udlejerskærmen med quick-setup først', async () => {
  const h = appHarness(); await h.auth(null);
  h.props('Login').onLoginStart(); await h.auth({ uid: 'ejer' });
  assert.equal(h.names()[0], 'OwnerPages');
  assert.ok(h.names().includes('QuickSetup'));
});

test('netværksfejl i gæstetilstand bevarer låsen og giver mulighed for at prøve igen', async () => {
  const h = appHarness({ savedMode: 'guest', failHouse: true }); await h.auth({ uid: 'ejer' });
  assert.deepEqual(h.names(), []);
  assert.ok(h.button('Prøv igen'));
  assert.ok(h.button('Udlejer-login'));
  assert.equal(h.button('Vælg et andet hus'), undefined);
  h.failHouse(false); h.button('Prøv igen').onPress(); await h.settle();
  assert.equal(h.names()[0], 'Home');
});

test('manglende husvalg eller fejl i lokal lagring låser ikke gæstetilstand op', async () => {
  for (const options of [{ savedMode: 'guest', savedHouse: null, houses: [] }, { failStorage: true }]) {
    const h = appHarness(options); await h.auth({ uid: 'ejer' });
    assert.deepEqual(h.names(), ['OwnerLogin']);
    await h.props('OwnerLogin').onUnlock(); await h.settle();
    assert.deepEqual(h.names(), ['ChooseHouse']);
  }
});

test('gæstevisning fjerner redigeringsskærme og låses op via re-autentificering', async () => {
  const h = appHarness(); await h.auth({ uid: 'ejer' });
  await h.props('OwnerPages').onShowGuest(); await h.settle();
  assert.equal(h.names()[0], 'Home');
  assert.ok(!h.names().includes('OwnerPages'));
  assert.ok(!h.names().includes('QuickSetup'));
  assert.equal(h.storage.get('displayMode_ejer'), 'guest');
  await h.props('OwnerLogin').onUnlock(); await h.settle();
  assert.equal(h.names()[0], 'OwnerPages');
});

test('genstart husker gæstevisning, men et nyt login åbner udlejerskærmen', async () => {
  const h = appHarness({ savedMode: 'guest' }); await h.auth({ uid: 'ejer' });
  assert.equal(h.names()[0], 'Home');
  await h.auth(null); h.props('Login').onLoginStart(); await h.auth({ uid: 'ejer' });
  assert.equal(h.names()[0], 'OwnerPages');
});

test('én bolig vælges automatisk efter login, flere kræver et valg', async () => {
  const one = appHarness({ savedHouse: null }); await one.auth({ uid: 'ejer' });
  assert.equal(one.names()[0], 'OwnerPages');
  const many = appHarness({ savedHouse: null, houses: [{ id: 'a' }, { id: 'b' }] }); await many.auth({ uid: 'ejer' });
  assert.deepEqual(many.names(), ['ChooseHouse']);
  many.props('ChooseHouse').selectHouse('b'); await many.settle();
  assert.equal(many.names()[0], 'OwnerPages');
});

test('alle skærme med topbjælke skubbes ned under bjælken (iOS 26), skærme uden bjælke gør ikke', async () => {
  const checkAll = (h) => {
    for (const route of h.routes()) {
      const wrapped = route.props.children({}).type === 'HeaderSafeArea';
      const hasHeader = route.props.options?.headerShown !== false;
      assert.equal(wrapped, hasHeader, route.props.name);
    }
  };
  const loggedOut = appHarness(); await loggedOut.auth(null); checkAll(loggedOut);
  const owner = appHarness(); await owner.auth({ uid: 'ejer' }); checkAll(owner);
  const guest = appHarness({ savedMode: 'guest' }); await guest.auth({ uid: 'ejer' }); checkAll(guest);
  const choose = appHarness({ savedHouse: null, houses: [{ id: 'a' }, { id: 'b' }] }); await choose.auth({ uid: 'ejer' }); checkAll(choose);
});
