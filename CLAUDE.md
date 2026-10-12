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

- **Udlejer** er første skærm efter login med email og kodeord. Kan redigere sider,
  husinfo, skifte hus og logge ud. Ét hus vælges automatisk; flere kræver husvalg.
- **Gæst** vælges med **Gæstevisning** og kan kun læse. Tilstanden huskes ved genstart.
  Redigering låses op via tandhjulet og **kodeordet til kontoen** (re-autentificering
  i Firebase). Redigeringsskærmene findes ikke i gæstens navigationsstak.

Selve låsningen af iPad'en til én app sker via iOS Vejledt adgang (Guided
Access), ikke i vores kode.

Backend er **Firebase** (Authentication, Firestore og Storage) direkte fra
appen – ingen egen server.

### Målet

Appen startede som en skoleopgave (CBS, kurset INNT), men målet er nu en
**færdig, rigtig app** med mange funktioner, som kan bruges af rigtige udlejere
og lejere. Skoleopgavens minimumskrav (antal views, skærme, knapper, lister)
er ikke længere styrende. Prioritér det, en rigtig bruger har brug for:
stabilitet, sikkerhed, et færdigt udseende og funktioner, der løser udlejerens
og gæstens problemer.

Første milepæl: appen kører via **TestFlight** på en iPad i udlejerens eget
sommerhus, så kundetilfredsheden kan testes med rigtige lejere (se §11).

---

## 2. Kvalitetskrav

Fordi appen skal bruges af rigtige mennesker, gælder:

- **Gæstetilstand må aldrig gå i stykker.** Fejl ved hentning skal vises pænt
  (eller falde tilbage på noget fornuftigt) – ikke som en hvid skærm eller evig
  spinner.
- **Sikkerhed:** nye data skal dækkes af sikkerhedsregler, før funktionen er
  færdig. Hemmelige nøgler må ikke ende et sted, hvor andre kan læse dem.
- **Persondata (GDPR):** gemmer vi noget om gæster, skal det være begrundet,
  minimalt og forklaret for gæsten.
- **Ingen testdata eller udviklerting i det, brugeren ser** (fx `console.log`
  med hemmeligheder, eksempeltekster, der ligner rigtige oplysninger).
- README.md skal holdes opdateret, så den beskriver den aktuelle app. Den bruges
  stadig til eksamen: behold intro om CBS/INNT, demovideo-linket og tabellen
  med kursuskrav – og tjek at kravene stadig er opfyldt, når koden ændres.

---

## 3. Teknisk stak

Oprindeligt baseret på kursets undervisningsrepo (CBS-INNT-26) på Expo
~53.0.22. Opgraderet 2026-09-11 til SDK 57, fordi Expo Go på telefonen
kun understøtter nyeste SDK. Opgradér ikke SDK eller større biblioteker uden
at spørge.

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
expo-audio                          ~57.0.5   talesvar i AI quick-setup
expo-linking                        ~57.0.11  deep link til "Opret bruger"
react-native-dotenv                 ^3.4.11   OPENAI_API_KEY fra .env
babel-preset-expo                   ~57.0.0   (devDependency)
```

Ikke i brug lige nu: `react-native-gifted-chat`, `react-native-keyboard-controller`,
`services/ChatFaceData.js` (rester fra en tidligere chat-funktion).

Bemærk: `react-native-reanimated` 4.x kræver New Architecture og
`react-native-worklets`. `app.json` bruger config-plugins for
`expo-splash-screen`, `expo-audio`, `expo-camera` og `expo-image-picker`.

**Kræver at du spørger mig først** (foreslå og begrund – jeg godkender):

- Nye npm-pakker (brug `npx expo install`, så versionen passer til SDK'et)
- Nye Firebase-tjenester ud over Auth, Firestore og Storage (fx Hosting,
  Cloud Functions, Analytics, Crashlytics)
- Andre eksterne tjenester eller betalte API'er

**Vi bruger ikke** (kodekonventionerne beholdes, selvom skoleopgaven er slut):

- expo-router – vi bruger klassisk `App.js` + `index.js` med React Navigation
- TypeScript – koden er JavaScript
- Tailwind, NativeWind, styled-components – al styling i `GlobalStyle.js`
- Redux, Context eller andre state-biblioteker – state ligger i `App.js` og
  sendes som props

---

## 4. Mappestruktur og konventioner

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
  IconPickerComponent.js    ← gitter til at vælge en kategoris ikon
  GuideBlocksEditor.js      ← tekst-/billedblokke med flytning og sletning i quick-setup
  GuideAgentComponent.js    ← appens hjælper: hus-figur tegnet i kode + taleboble; `GuideAgentIcon` er den lille udgave ved beskeder i samtalen
data/
  const.js                  ← HOUSE og PAGES (skabelon for nye huse) + ICONS (ikonvalg)
  quickSetup.js             ← quick-setups kategorier, grupper (SETUP_GROUPS), trin, startsidens tekster, RECOMMENDED_IDS og AGENT_NAME
database/
  database.js               ← AL Firebase-kode (som i kursets 06_FirebaseLogin)
firebase/
  firestore.rules           ← sikkerhedsregler, kopieres ind i Console
  storage.rules
services/
  Request.js                ← OpenAI: Whisper + struktureret opsætningssamtale
  quickSetup.js             ← kategorier, kladder, AI-svar og publiceringsblokke
  useQuickSetupDraft.js      ← genoptagelse og sekventiel kladdegemning
tests/                      ← flow-/fejltests med mocks, statisk designkontrol
screens/                    ← én fil pr. skærm
styles/
  GlobalStyle.js            ← AL styling
```

### Konventioner (fra kursets kode – beholdes)

- Stylingfilen hedder `styles/GlobalStyle.js` og eksporterer et **named
  export**: `export const GlobalStyle = StyleSheet.create({ ... })`
- Farver læses fra JS via `GlobalStyle.colors.accent` osv.
- Skærme og komponenter er `export default function XScreen()`
- Data eksporteres som konstanter i store bogstaver: `export const PAGES = [...]`
- Lokale billeder indlæses med `require('../assets/hus.png')`
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
houses/{houseId}               { ownerId, name, welcome, wifiName, wifiPassword,
                                 ownerName, ownerPhone, coverUrl, createdAt,
                                 quickSetupDraft? }
houses/{houseId}/pages/{id}    { title, icon, active, blocks, order, custom }
```

- Invitationskoder skrives med STORE bogstaver. `registerUser` normaliserer input.
- `ownerId` på huset = udlejerens Firebase-uid. Det er det, der adskiller brugerne.
- Sidens `id` (fx `koekken`) er dokument-id og bruges som `keyExtractor`.
- `order` styrer rækkefølgen (Firestore sorterer ellers efter id).
- Wifi er en del af husinfo, ikke en side. I quick-setup kan det fravælges (`quickSetupDraft.wifi: false`);
  så tømmes wifi-felterne, og forsiden viser kun wifi og kontakt, når de er udfyldt.
- `blocks` er sidens indhold i rækkefølge:
  - tekstblok: `{ id, type: 'text', text, title? }` – `title` er en valgfri overskrift, som gæsten ser over afsnittet.
    I quick-setup skriver AI'en den som afsnittets første linje (`splitTitle`/`blocksText` i `services/quickSetup.js`)
  - billedblok: `{ id, type: 'image', url }` (download-URL fra Storage)
  - blok-id laves med `newBlockId()`
- Kategorier: standardkategorierne har faste id'er (fx `koekken`) og faste ikoner
  og kan kun slås fra. Udlejerens egne kategorier har automatisk id og
  `custom: true`, starter skjulte (`active: false`), kan skifte ikon (fra `ICONS`
  i const.js) og kan slettes.

### Storage

Billeder ligger i `houses/{houseId}/pages/{pageId}/{tidspunkt}.jpg` (sider) og
`houses/{houseId}/cover/{tidspunkt}.jpg` (baggrund på forsiden, link i `coverUrl`;
mangler den, bruges `HOUSE.cover` fra assets).
Firestore gemmer kun linket. Slettede billedblokke fjernes ikke fra Storage.

### data/const.js

Bruges kun som **skabelon**, når et nyt hus oprettes (`createHouse`):

- `HOUSE`: historiske eksempeltekster + `cover` (lokalt forsidebillede).
- `PAGES`: 8 prædefinerede kategorier med historiske eksempeltekster.
  Nye huse oprettes med tom husinfo (bortset fra ejerens valgte navn) og tomme,
  skjulte kategorier. Eksempelteksterne bruges til at genkende og udelade demoindhold
  i quick-setup for ældre huse, aldrig som AI-fakta.
  Sider har intet fast topbillede – vil udlejeren have et billede øverst, lægger
  de en billedblok og flytter den op med pilene.

### På enheden (AsyncStorage)

- Firebase-login (via `getReactNativePersistence`)
- Valgt hus: nøglen `selectedHouse_<uid>`
- Visning: `displayMode_<uid>` er `owner` eller `guest`. Et nyt login åbner altid
  udlejertilstand; genstart bevarer gæstevisning. Hentefejl låser ikke gæstetilstand op.

---

## 6. Skærme og navigation

Root er en Stack Navigator i `App.js` med **tre grene**, som vælges ud fra state:

1. `user === null` → `Login`, `Register`
2. logget ind, `houseId === null` → `ChooseHouse` (HousesScreen)
3. logget ind med hus → enten udlejerskærme (først `OwnerPages`) eller gæsteskærme
   (først `Home`, kun `OwnerLogin`, `Guide` og `Page`). Skift nulstiller stakken.
   En gæst uden gyldigt husvalg skal låse op før husvælgeren kan åbnes.

| Fil | Rolle | Indhold |
|---|---|---|
| `LoginScreen.js` | – | Email + kodeord. Knap til "Opret bruger" |
| `RegisterScreen.js` | – | Invitationskode (kan komme fra link via `route.params.code`), email, kodeord |
| `HousesScreen.js` | Udlejer | **FlatList** over egne huse, opret nyt hus, log ud. Bruges som `ChooseHouse` og `Houses` ("Skift hus") |
| `HomeScreen.js` | Gæst | Baggrund (`coverUrl` eller standard), husnavn, velkomst, wifi og kontakt (kun når de er udfyldt). "Se guiden". Tandhjul → `OwnerLogin` |
| `GuideScreen.js` | Gæst | **FlatList** i 2 kolonner med aktive sider. Tryk → `PageScreen` |
| `PageScreen.js` | Gæst | Titel og sidens blokke (tekst med valgfri overskrift, billeder) i udlejerens rækkefølge |
| `OwnerLoginScreen.js` | Udlejer | Kodeord til kontoen (re-autentificering) → `OwnerPages` |
| `OwnerPagesScreen.js` | Udlejer | Fælles AI quick-setup, husinfo-række, **FlatList** over sider med `Switch` og slet (kun egne), "Ny kategori", "Gæstevisning", "Skift hus", "Log ud" |
| `NewPageScreen.js` | Udlejer | Navn + ikon til en ny kategori → åbner `EditPage` |
| `EditHouseScreen.js` | Udlejer | Husinfo: baggrund (kamera/galleri/standard), navn, velkomst, wifi, kontakt |
| `EditPageScreen.js` | Udlejer | Titel, ikon (kun egne kategorier) + blok-editor: + Tekst, + Kamera, + Galleri, ▲ ▼ ✕. "Gem" |
| `CameraScreen.js` | Udlejer | Tag billede, upload, send `newImageUrl` tilbage til `returnTo` (`EditPage` eller `EditHouse`) |
| `QuickSetupScreen.js` | Udlejer | Startside med hjælperen og de fire trin ("Kom i gang" / "Fortsæt hvor du slap") → kategorivalg i grupper med fast bundlinje (hjælperens knap vælger de almindelige) → AI-samtale som chat med hjælperen (emner øverst, skrivefelt fast i bunden, udkast i fane på telefon / kolonne på iPad; tekst/tale) → billeder → redigering og samlet godkendelse. Topbjælken har "Tilbage" (ét trin) og et kryds, der gemmer kladden og lukker. Tallene i trinviseren hopper direkte til trin, man har været på før (`quickSetupDraft.maxStep`) |

Deep link: `linking` i `App.js` mapper `register?code=KODE` til `Register`
(scheme `ferieguide` i `app.json`). Linket virker kun, når ingen er logget ind
på enheden, da `Register` kun findes i den gren.

Navigation-params: send kun id'er (`pageId`) og små værdier (`newImageUrl`,
`code`), aldrig hele objekter.

### State

`App.js` holder `user`, `houseId`, `house`, `pages` og `ownerMode` og sender dem ned som
props via render-funktioner på `Stack.Screen`:

```js
<Stack.Screen name="EditPage">
  {(props) => <EditPageScreen {...props} houseId={houseId} pages={pages} setPages={setPages} />}
</Stack.Screen>
```

De almindelige editorer skriver først i state og derefter til Firestore med
`updatePage` / `updateHouse`. Quick-setup gemmer en separat `quickSetupDraft` på huset
med de eksisterende ejerregler; ingen nye regler kræves. Kladden indeholder
kategorivalg, samtaler, input, tekstforslag, husinfo og billedlinks, aldrig lydfiler.
Hvert emne har `blocks` i samme format som den manuelle editor; `guideText` og `images`
afledes herfra. AI-afsnit opdeles ved tomme linjer. Billeder kan flyttes mellem
tekstblokke, og den valgte rækkefølge bevares ved publicering. Gamle kladder uden
`blocks` migreres ved indlæsning uden at miste svar eller billeder.
Ved godkendelse skriver `publishQuickSetup` husinfo og valgte sider i én transaktion,
fjerner kladden og opdaterer først derefter global state. Sider uden for opsætningen
bevares; tomme kategorier springes over. Ændringer fra andre enheder opdages ved
sammenligning med kladdens udgangspunkt. Ingen Redux, ingen Context.

Quick-setup: højst 20 valgte kategorier, 4.000 tegn pr. svar og 12 svar pr. emne;
taleoptagelser stopper efter 2 minutter. Stop transskriberer og sender automatisk
svaret til chatten. Ved transskriptionsfejl kan samme optagelse forsøges igen;
ved efterfølgende AI-fejl bevares teksten i input. Færdige emner skifter automatisk
til næste ufærdige emne; sidste emne åbner billedtrinnet.
Ejeren kan genoptage, springe over og rette
tidligere svar. Rettelser erstatter de efterfølgende svar i samme emne. Kun ét aktivt
setup pr. hus ad gangen. Kladden kræver netværk; **Kladde gemt** bekræfter gemning.
`npm test` tester flow, transskriptionshåndtering, fejl, genoptagelse og transaktioner
med mocks. `tests/liveSpeech.cjs` kan teste en lokal lydfil gennem den rigtige
OpenAI-integration. Mikrofonoptagelse og Firebase skal også prøves i Expo Go på enheden.

Lydupload i Expo 57: global `fetch` bruger Expo og afviser React Natives gamle
`FormData.append('file', { uri, name, type })`. `Request.js` læser derfor den lokale
lydfil med indbygget `XMLHttpRequest` (`responseType: 'blob'`) og tilføjer Blob +
filnavn til FormData. Filindlæsning har timeout/afbrydelse; native blobs frigives
efter upload uden at slette optagelsen. Ingen ekstra pakker eller global fetch-ændring.
`audioUpload.test.cjs` og `liveSpeech.cjs` bruger den installerede Expo-versions
FormData-patch og multipart-kode direkte, så test ikke skjuler formatfejl.

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

## 9. Arbejdsform

1. **Hele funktioner ad gangen.** Byg en samlet funktion færdig (data, regler,
   skærme, styling), før jeg tester den i Expo Go. Del kun op, hvis funktionen
   er stor nok til, at noget kan gå galt undervejs.
2. **Kort opsummering bagefter:** hvad er ændret (filer), hvad skal jeg gøre
   (fx publicere regler) og hvordan jeg tester. Ingen lange forklaringer af
   kendte begreber – kun af nye, ikke-oplagte ting.
3. **Spørg, hvis noget er uklart** i stedet for at gætte på et design eller
   en adfærd, brugeren vil mærke.
4. **Ingen store refaktoreringer** uden at spørge.
5. Skriv kommentarer på dansk i koden.
6. Ændringer i Firebase Console laver jeg selv – giv mig trinvise instruktioner.
7. Opdatér denne fil og README.md, når datamodel, skærme eller stak ændres.

Jeg committer og pusher selv. Claude må ikke lave git commit eller git push –
kun minde mig om det, når en funktion er færdig.

---

## 10. Kør appen

```bash
npx expo start          # normalt
npx expo start --tunnel # på CBS-netværk / eduroam
```

Efter installation af nye pakker eller ændringer i `app.json`: genstart Expo helt.

`node_modules/` og `.env` må aldrig committes. Begge står i `.gitignore`.

---

## 11. Køreplan og kendte begrænsninger

### Næste milepæl: TestFlight på sommerhus-iPad'en

- [ ] Apple Developer Program + Expo-konto (mig)
- [ ] `app.json`: `ios.bundleIdentifier`, `ios.config.usesNonExemptEncryption: false`,
      evt. `orientation: "landscape"`
- [ ] `eas.json` med production-profil og `autoIncrement`
- [x] `babel.config.js`: dotenv-stien er `.env` i projektets rod
- [ ] OpenAI-nøglen som EAS-miljøvariabel (`.env` kommer ikke med op til EAS)
- [ ] Build (`eas build`) + upload (`eas submit`) + intern TestFlight-gruppe
- [ ] Separat Apple-ID til sommerhus-iPad'en, automatiske opdateringer fra
- [ ] Påmindelse: TestFlight-builds udløber efter 90 dage

### Idéer til funktioner

- Feedback fra gæster (stjerner + kommentar i Firestore, med egne regler og GDPR-tekst)
- Bookinger med ankomst/afrejse, så udtjekning kan vises igen med rigtig dato
- Flere sprog til gæsterne (fx dansk, engelsk, tysk)
- Visning af hvilke sider gæsterne bruger (kræver godkendelse af evt. ny tjeneste)

### Kendte begrænsninger

- **OpenAI-nøglen ligger i app-koden** (`react-native-dotenv` bager den ind i
  bundlen). Acceptabelt på en lukket TestFlight-iPad med beløbsgrænse på
  nøglen – men skal flyttes til en server (fx Cloud Functions), før appen
  deles bredt eller laves som web-app.
- Appen virker ikke som web-app uden ombygning (Firebase-login-persistens,
  `Alert.alert`, lydupload til Whisper og nøglen ovenfor).
- Firestore har ingen offline-cache i vores opsætning: ingen wifi ved opstart
  = tom guide.
- Billeder i Storage slettes ikke, når en billedblok, kategori eller baggrund
  fjernes.
- Invitationskoder oprettes manuelt i Console – der er ingen webshop.
- Ubrugte pakker: `react-native-gifted-chat`, `react-native-keyboard-controller`,
  og `services/ChatFaceData.js` kan ryddes op.
