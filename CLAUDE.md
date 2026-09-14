# CLAUDE.md — FerieGuide

Denne fil beskriver projektet for Claude Code. Læs den før du skriver kode.
Svar og kommentér på dansk.

---

## 1. Hvad bygger vi

En React Native-app til **udlejere af ferieboliger**. Udlejeren bygger sin egen
digitale instruktionsbog til huset ved at slå prædefinerede sider til/fra og
udfylde dem med tekst og billeder. Appen kører derefter på en iPad i
ferieboligen i **gæstetilstand**, hvor gæsten kun kan læse guiden.

To brugerroller i én app:

- **Gæst** (standard): kan kun læse. Ingen redigering.
- **Udlejer**: låses op med PIN-kode og kan redigere guiden.

Selve låsningen af iPad'en til én app sker via iOS Vejledt adgang (Guided
Access), ikke i vores kode. Vi simulerer rolleskiftet med en PIN.

Dette er en skoleopgave (CBS, kurset INNT). Der er ingen backend. Al data
ligger i `data/` og i React state.

---

## 2. Hårde krav fra opgaven

Koden SKAL indeholde:

- [ ] Minimum 3 views
- [ ] Minimum 3 screens med navigation
- [ ] Minimum 2 knapper, hvoraf mindst én har en funktion (fx navigerer)
- [ ] Minimum 1 liste (FlatList)
- [ ] Al styling i en separat fil
- [ ] En README.md med link til demovideo

Tjek disse af, inden vi er færdige.

---

## 3. Teknisk stak — lås dig til denne

Oprindeligt låst til kursets undervisningsrepo (CBS-INNT-26) på Expo
~53.0.22. Opgraderet 2026-09-11 til SDK 57, fordi Expo Go på telefonen
kun understøtter nyeste SDK og ikke længere kunne åbne et SDK 53-projekt.
Afvig ikke yderligere uden at spørge.

```
expo                            ~57.0.22
expo-splash-screen              ~57.0.9
expo-status-bar                 ~57.0.1
expo-font                       ~57.0.4 (peer til @expo/vector-icons)
react                           19.2.3
react-native                    0.86.3
@react-navigation/native        ^7.1.17
@react-navigation/native-stack  ^7.3.26
@react-navigation/bottom-tabs   ^7.4.7
react-native-screens            ~4.26.0
react-native-safe-area-context  ~5.7.0
react-native-gesture-handler    ~2.32.0
react-native-reanimated         4.5.1
react-native-worklets           0.10.1
babel-preset-expo               ~57.0.0 (devDependency)
@expo/vector-icons              (Ionicons)
```

Bemærk: `react-native-reanimated` 4.x kræver New Architecture (allerede
slået til i `app.json` via `newArchEnabled`) og peer-dependencyen
`react-native-worklets`. `app.json` bruger nu `expo-splash-screen` som
config-plugin i stedet for det gamle top-level `splash`-felt, og
`android.edgeToEdgeEnabled` er fjernet, da det er default i SDK 57.

**Forbudt uden at spørge først:**

- expo-router (kurset bruger klassisk `App.js` + `index.js`)
- TypeScript
- Tailwind, NativeWind, styled-components
- Firebase eller anden backend (kommer senere på kurset)
- Nye npm-pakker overhovedet

---

## 4. Mappestruktur — følg kursets konvention præcist

```
App.js                      ← navigation + global state
index.js
app.json
babel.config.js
assets/                     ← billeder til demoen
components/                 ← genbrugelige komponenter
  ButtonComponent.js
  TextInputComponent.js
data/
  const.js                  ← husdata + sider
screens/                    ← én fil pr. skærm
styles/
  GlobalStyle.js            ← AL styling
```

### Konventioner fra kursets kode

- Stylingfilen hedder `styles/GlobalStyle.js` og eksporterer et **named
  export**: `export const GlobalStyle = StyleSheet.create({ ... })`
- Import: `import { GlobalStyle } from '../styles/GlobalStyle';`
- Skærme og komponenter er `export default function XScreen()`
- Data eksporteres som konstanter i store bogstaver: `export const PAGES = [...]`
- Billeder indlæses med `require('../assets/koekken.jpg')`
- Knapper bruger `ButtonComponent` med props `{title, onPress, width, height, type}`,
  hvor `type` er `'primary'` eller `'secondary'`
- **Ingen inline styles.** Alt skal ligge i `GlobalStyle`.

---

## 5. Datamodel

Alt i `data/const.js`.

```js
export const HOUSE = {
  name: "Sommerhus Klitvej 12",
  welcome: "Velkommen til Klitvej 12. Her finder du alt om huset og området.",
  checkout: "Senest kl. 10.00",
  wifiName: "Klitvej12",
  wifiPassword: "sommer2026",
  ownerName: "Mette Hansen",
  ownerPhone: "+45 12 34 56 78",
  cover: require("../assets/hus.jpg"),
};

export const PAGES = [
  {
    id: "koekken",
    title: "Køkken",
    icon: "restaurant-outline",   // Ionicons-navn
    active: true,                  // vises for gæsten?
    body: "Opvaskemaskinen startes ved at...",
    image: require("../assets/koekken.jpg"),
  },
  // sauna, vaerelser, udtjekning, restauranter, strand, kontakt, ...
];
```

Regler:

- `id` er unik og bruges som `keyExtractor` i FlatList
- `icon` skal være et gyldigt Ionicons-navn
- Start med **8 prædefinerede sider**, hvor 5 har `active: true`
- Gæsten ser kun sider med `active: true`

---

## 6. Skærme

Root er en Stack Navigator i `App.js`.

| Fil | Rolle | Indhold |
|---|---|---|
| `HomeScreen.js` | Gæst | Coverbillede, husnavn, velkomsttekst. Primær knap "Se guiden". Lille tandhjulsknap → `OwnerLoginScreen` |
| `GuideScreen.js` | Gæst | **FlatList** i 2 kolonner med aktive sider. Ikon + titel pr. kort. Tryk → `PageScreen` |
| `PageScreen.js` | Gæst | Viser én side: titel, billede, brødtekst. Tilbageknap |
| `OwnerLoginScreen.js` | Udlejer | PIN-felt (hardcodet `1234`) + knap "Lås op" |
| `OwnerPagesScreen.js` | Udlejer | **FlatList** over ALLE sider med `Switch` til at slå til/fra. Tryk på række → `EditPageScreen` |
| `EditPageScreen.js` | Udlejer | `TextInputComponent` til titel og brødtekst. Knap "Gem" gemmer og navigerer tilbage |

Navigation-params: send kun `pageId` videre, aldrig hele objektet.

### State

`App.js` holder `const [pages, setPages] = useState(PAGES)` og sender
`pages` + `setPages` ned som props via render-funktioner på `Stack.Screen`:

```js
<Stack.Screen name="Guide">
  {(props) => <GuideScreen {...props} pages={pages} setPages={setPages} />}
</Stack.Screen>
```

Ingen Redux, ingen Context, ingen AsyncStorage i første omgang.

---

## 7. Design

Appen skal se ud som et **iPad-produkt i landscape**, ikke som en telefon-app.

- Store touch-flader, minimum 60 px høje kort
- Gæsteskærmene har store skrifter (titler 28-34 px), så de kan læses på afstand
- Rolig, varm farvepalet. Lyse flader, ét accentfarve
- Gæstetilstand skal føles som et færdigt produkt, ikke som en prototype
- Udlejertilstand må gerne se mere "administrativ" ud

---

## 8. Arbejdsform

Jeg er studerende og skal kunne forklare koden bagefter. Derfor:

1. **Én ting ad gangen.** Byg én skærm, lad mig teste den i Expo Go, og gå
   først videre når jeg siger til.
2. **Forklar kort**, hvad du har skrevet, og hvorfor, efter hver ændring.
   Særligt når du bruger noget vi ikke har haft: `useState`, props,
   `navigation.navigate`, `FlatList`.
3. **Spørg, hvis noget er uklart** i stedet for at gætte på et design.
4. **Ingen store refaktoreringer** uden at spørge.
5. Skriv kommentarer på dansk i koden.

Rækkefølge vi bygger i:

1. Navigation + seks tomme skærme, der kan skiftes imellem
2. `data/const.js` med rigtige data
3. `GlobalStyle.js` med farver og basale styles
4. `HomeScreen` → `GuideScreen` → `PageScreen` (hele gæsteflowet)
5. `OwnerLoginScreen` → `OwnerPagesScreen` → `EditPageScreen`
6. Finpudsning af styling

Jeg committer og pusher selv efter hvert punkt. Claude må ikke lave
git commit eller git push – kun minde mig om det, når et trin er færdigt.

---

## 9. Kør appen

```bash
npx expo start          # normalt
npx expo start --tunnel # på CBS-netværk / eduroam
```

`node_modules/` må aldrig committes. Tjek at den står i `.gitignore`.
