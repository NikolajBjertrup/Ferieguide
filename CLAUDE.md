# CLAUDE.md — FerieGuide

Denne fil beskriver projektet for Claude Code. Læs den før du skriver kode.
Svar og kommentér på dansk.

---

## 1. Hvad bygger vi

En React Native-app til **udlejere af ferieboliger**. Udlejeren bygger sin egen
digitale instruktionsbog til huset ved at slå prædefinerede sider til/fra og
udfylde dem med tekst og billeder. Appen kører derefter på en iPad i
ferieboligen i **gæstetilstand**, hvor gæsten kun kan læse guiden.

Appen er et abonnementsprodukt med flere udlejere:

- En udlejer **oprettes kun med en invitationskode**, som man får ved køb af
  abonnement (koden kommer i et link). Der er ingen rigtig webshop – et "køb"
  simuleres ved at oprette en kode i Firestore (`invites/{KODE}`).
- En udlejer kan have **flere huse**. Hvert hus har sin egen husinfo og sine
  egne sider. Udlejernes data er adskilt.
- Udlejeren logger ind på en vilkårlig enhed og vælger, hvilket hus enheden
  skal vise. Valget huskes på enheden.

Roller på enheden:

- **Gæst** (standard, når enheden er logget ind og har valgt hus): kan kun læse.
- **Udlejer**: låses op ved at skrive **kodeordet til kontoen** (re-autentificering
  i Firebase). Kan redigere sider, husinfo, skifte hus og logge ud.

Selve låsningen af iPad'en til én app sker via iOS Vejledt adgang (Guided
Access), ikke i vores kode.

Dette er en skoleopgave (CBS, kurset INNT). Backend er **Firebase**
(Authentication, Firestore og Storage) direkte fra appen – ingen egen server.

---

## 2. Hårde krav fra opgaven

Koden SKAL indeholde:

- [x] Minimum 3 views
- [x] Minimum 3 screens med navigation
- [x] Minimum 2 knapper, hvoraf mindst én har en funktion (fx navigerer)
- [x] Minimum 1 liste (FlatList) – GuideScreen, OwnerPagesScreen, HousesScreen
- [x] Al styling i en separat fil
- [x] En README.md med link til demovideo

Tjek dem igen, inden vi afleverer.

---

## 3. Teknisk stak — lås dig til denne

Oprindeligt låst til kursets undervisningsrepo (CBS-INNT-26) på Expo
~53.0.22. Opgraderet 2026-09-11 til SDK 57, fordi Expo Go på telefonen
kun understøtter nyeste SDK. Afvig ikke yderligere uden at spørge.

```
expo                                ~57.0.26
react                               19.2.3
react-native                        0.86.3
@react-navigation/native            ^6.1.18   (v6 – ikke v7)
@react-navigation/native-stack      ^6.11.0
react-native-screens                ~4.26.0
react-native-safe-area-context      ~5.7.0
react-native-gesture-handler        ~2.32.0
react-native-reanimated             4.5.1
react-native-worklets               0.10.1
expo-splash-screen / expo-status-bar / expo-font / expo-asset
@expo/vector-icons                  (Ionicons)

firebase                            ^12.19.0  Auth, Firestore, Storage
@react-native-async-storage/async-storage  ^2.2.0  husker login + valgt hus
expo-camera                         ~57.0.6   tag billede (kursets 07_kamera)
expo-image-picker                   ~57.0.20  vælg billede fra galleri
expo-audio                          ~57.0.5   talebesked i lynopsætning
expo-linking                        ~57.0.11  deep link til "Opret bruger"
react-native-dotenv                 ^3.4.11   OPENAI_API_KEY fra .env
babel-preset-expo                   ~57.0.0   (devDependency)
```

Ikke i brug lige nu: `react-native-gifted-chat`, `react-native-keyboard-controller`,
`services/ChatFaceData.js` (rester fra en tidligere chat-funktion).

Bemærk: `react-native-reanimated` 4.x kræver New Architecture og
`react-native-worklets`. `app.json` bruger config-plugins for
`expo-splash-screen`, `expo-audio`, `expo-camera` og `expo-image-picker`.

**Forbudt uden at spørge først:**

- expo-router (kurset bruger klassisk `App.js` + `index.js`)
- TypeScript
- Tailwind, NativeWind, styled-components
- Redux, Context eller andre state-biblioteker
- Nye npm-pakker overhovedet
- Andre Firebase-tjenester end Auth, Firestore og Storage (fx Cloud Functions)

---

## 4. Mappestruktur — følg kursets konvention præcist

```
App.js                      ← navigation + global state (user, houseId, house, pages)
index.js
app.json
babel.config.js
.env                        ← OPENAI_API_KEY (må aldrig committes)
assets/                     ← lokale billeder (forsidens cover, app-ikon, splash)
components/                 ← genbrugelige komponenter
  ButtonComponent.js
  TextInputComponent.js
data/
  const.js                  ← standardtekster: HOUSE og PAGES (skabelon for nye huse)
database/
  database.js               ← AL Firebase-kode (som i kursets 06_FirebaseLogin)
firebase/
  firestore.rules           ← sikkerhedsregler, kopieres ind i Console
  storage.rules
services/
  Request.js                ← OpenAI: Whisper + omskrivning til guidetekst
screens/                    ← én fil pr. skærm
styles/
  GlobalStyle.js            ← AL styling
```

### Konventioner fra kursets kode

- Stylingfilen hedder `styles/GlobalStyle.js` og eksporterer et **named
  export**: `export const GlobalStyle = StyleSheet.create({ ... })`
- Farver læses fra JS via `GlobalStyle.colors.accent` osv.
- Skærme og komponenter er `export default function XScreen()`
- Data eksporteres som konstanter i store bogstaver: `export const PAGES = [...]`
- Lokale billeder indlæses med `require('../assets/koekken.png')`
- Knapper bruger `ButtonComponent` med props `{title, onPress, width, height, type}`,
  hvor `type` er `'primary'` eller `'secondary'`
- **Ingen inline styles.** Alt skal ligge i `GlobalStyle`.
- Skærme kalder aldrig Firestore direkte – de bruger funktioner fra
  `database/database.js`. Undtagelse: `signInWithEmailAndPassword`, `signOut`
  og `reauthenticateWithCredential` kaldes i skærmene, som i kursets guide.

---

## 5. Datamodel

### Firestore

```
invites/{KODE}                 { used: false }  → { used: true, usedBy: uid }
users/{uid}                    { email, inviteCode, createdAt }
houses/{houseId}               { ownerId, name, welcome, checkout, wifiName,
                                 wifiPassword, ownerName, ownerPhone, createdAt }
houses/{houseId}/pages/{id}    { title, icon, active, blocks, order }
```

- Invitationskoder skrives med STORE bogstaver. `registerUser` normaliserer input.
- `ownerId` på huset = udlejerens Firebase-uid. Det er det, der adskiller brugerne.
- Sidens `id` (fx `koekken`) er dokument-id og bruges som `keyExtractor`.
- `order` styrer rækkefølgen (Firestore sorterer ellers efter id).
- `blocks` er sidens indhold i rækkefølge:
  - tekstblok: `{ id, type: 'text', text }`
  - billedblok: `{ id, type: 'image', url }` (download-URL fra Storage)
  - blok-id laves med `newBlockId()`

### Storage

Billeder ligger i `houses/{houseId}/pages/{pageId}/{tidspunkt}.jpg`.
Firestore gemmer kun linket. Slettede billedblokke fjernes ikke fra Storage.

### data/const.js

Bruges kun som **skabelon**, når et nyt hus oprettes (`createHouse`):

- `HOUSE`: standardtekster til husinfo + `cover` (lokalt forsidebillede).
- `PAGES`: 8 prædefinerede sider, 5 med `active: true`, hver med én tekstblok.
  Sider har intet fast topbillede – vil udlejeren have et billede øverst, lægger
  de en billedblok og flytter den op med pilene.

### På enheden (AsyncStorage)

- Firebase-login (via `getReactNativePersistence`)
- Valgt hus: nøglen `selectedHouse_<uid>`

---

## 6. Skærme og navigation

Root er en Stack Navigator i `App.js` med **tre grene**, som vælges ud fra state:

1. `user === null` → `Login`, `Register`
2. logget ind, `houseId === null` → `ChooseHouse` (HousesScreen)
3. logget ind med hus → alle øvrige skærme

| Fil | Rolle | Indhold |
|---|---|---|
| `LoginScreen.js` | – | Email + kodeord. Knap til "Opret bruger" |
| `RegisterScreen.js` | – | Invitationskode (kan komme fra link via `route.params.code`), email, kodeord |
| `HousesScreen.js` | Udlejer | **FlatList** over egne huse, opret nyt hus, log ud. Bruges som `ChooseHouse` og `Houses` ("Skift hus") |
| `HomeScreen.js` | Gæst | Coverbillede, husnavn, velkomst, wifi, udtjekning, kontakt. "Se guiden". Tandhjul → `OwnerLogin` |
| `GuideScreen.js` | Gæst | **FlatList** i 2 kolonner med aktive sider. Tryk → `PageScreen` |
| `PageScreen.js` | Gæst | Titel og sidens blokke (tekst og billeder) i udlejerens rækkefølge |
| `OwnerLoginScreen.js` | Udlejer | Kodeord til kontoen (re-autentificering) → `OwnerPages` |
| `OwnerPagesScreen.js` | Udlejer | Husinfo-række, **FlatList** over alle sider med `Switch` og mikrofon, "Skift hus", "Log ud" |
| `EditHouseScreen.js` | Udlejer | Husinfo: navn, velkomst, udtjekning, wifi, kontakt |
| `EditPageScreen.js` | Udlejer | Titel + blok-editor: + Tekst, + Kamera, + Galleri, ▲ ▼ ✕. "Gem" |
| `CameraScreen.js` | Udlejer | Tag billede, upload, send `newImageUrl` tilbage til `EditPage` |
| `QuickSetupScreen.js` | Udlejer | Talebesked → Whisper → forslag, der erstatter første tekstblok |

Deep link: `linking` i `App.js` mapper `register?code=KODE` til `Register`
(scheme `ferieguide` i `app.json`). Linket virker kun, når ingen er logget ind
på enheden, da `Register` kun findes i den gren.

Navigation-params: send kun id'er (`pageId`) og små værdier (`newImageUrl`,
`code`), aldrig hele objekter.

### State

`App.js` holder `user`, `houseId`, `house` og `pages` og sender dem ned som
props via render-funktioner på `Stack.Screen`:

```js
<Stack.Screen name="EditPage">
  {(props) => <EditPageScreen {...props} houseId={houseId} pages={pages} setPages={setPages} />}
</Stack.Screen>
```

Ændringer skrives først i state (så UI'et er hurtigt) og derefter til Firestore
med `updatePage` / `updateHouse`. Ingen Redux, ingen Context.

---

## 7. Firebase-opsætning (Console)

- Projekt: `ferieguide-4fad6`. Config ligger direkte i `database/database.js`
  (Firebase-apiKey er ikke hemmelig – reglerne beskytter data).
- Blaze-plan (kræves af Storage). Storage-bucket ligger i US-EAST1 (gratis kvote).
- Authentication: Email/Password slået til.
- Invitationskoder oprettes manuelt i `invites` med `used: false`.
- Sikkerhedsregler ligger i `firebase/firestore.rules` og `firebase/storage.rules`
  og kopieres manuelt ind i Console (Rules → Publish). Ændrer du datamodellen,
  skal reglerne opdateres samtidig – og jeg skal publicere dem.
  - Kun ejeren (`ownerId`) kan læse/skrive et hus, dets sider og dets billeder.
  - `users/{uid}` kan kun oprettes i samme batch, som en invitationskode bruges.
  - Huse kan kun oprettes af brugere med et `users`-dokument.
  - Invitationskoder kan slås op enkeltvis, men ikke listes.

---

## 8. Design

Appen skal se ud som et **iPad-produkt i landscape**, ikke som en telefon-app.

- Store touch-flader, minimum 60 px høje kort
- Gæsteskærmene har store skrifter (titler 28-34 px), så de kan læses på afstand
- Rolig, varm farvepalet. Lyse flader, én accentfarve
- Gæstetilstand skal føles som et færdigt produkt, ikke som en prototype
- Udlejertilstand og login må gerne se mere "administrative" ud

---

## 9. Arbejdsform og status

Jeg er studerende og skal kunne forklare koden bagefter. Derfor:

1. **Én ting ad gangen.** Byg ét trin, lad mig teste det i Expo Go, og gå
   først videre når jeg siger til.
2. **Forklar kort**, hvad du har skrevet, og hvorfor, efter hver ændring.
   Særligt nye begreber (fx `useEffect` med afhængigheder, `useRef`, batch,
   `where`, re-autentificering).
3. **Spørg, hvis noget er uklart** i stedet for at gætte på et design.
4. **Ingen store refaktoreringer** uden at spørge.
5. Skriv kommentarer på dansk i koden.
6. Ændringer i Firebase Console laver jeg selv – giv mig trinvise instruktioner.

### Status for flerbruger-udvidelsen

- [x] 1. Console: Email/Password + invitationskoder
- [x] 2. Login og opret bruger med kode
- [x] 3. Flere huse pr. bruger, valgt hus huskes på enheden
- [x] 4. Udlejertilstand med kodeord (PIN er fjernet)
- [x] 5. Husinfo i databasen + EditHouseScreen
- [x] 6. Link (deep link), der åbner "Opret bruger" med koden udfyldt
- [x] 7. Sikkerhedsregler for Firestore og Storage + oprydning i gammel
      `pages`-collection og gamle billeder under `pages/` i Storage

Jeg committer og pusher selv efter hvert trin. Claude må ikke lave
git commit eller git push – kun minde mig om det, når et trin er færdigt.

---

## 10. Kør appen

```bash
npx expo start          # normalt
npx expo start --tunnel # på CBS-netværk / eduroam
```

Efter installation af nye pakker eller ændringer i `app.json`: genstart Expo helt.

`node_modules/` og `.env` må aldrig committes. Begge står i `.gitignore`.
