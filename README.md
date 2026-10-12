# FerieGuide

En React Native-app til **udlejere af ferieboliger**. Udlejeren bygger en digital
instruktionsbog til sit sommerhus – køkken, sauna, udtjekning, stranden osv. – med
tekst og billeder. Appen står derefter på en iPad i huset i **gæstetilstand**, hvor
gæsterne kan læse guiden, men ikke ændre den.

Lavet som eksamensprojekt i kurset INNT på CBS.

## Demovideo

https://youtube.com/shorts/8t2mC9-cTaE?feature=share

## Funktioner

**Gæst**
- Forside med husets navn, velkomsttekst, wifi og kontaktperson på udlejerens eget baggrundsbillede
- Guide med de sider, udlejeren har slået til, vist som store kort
- Hver side består af tekst og billeder i den rækkefølge, udlejeren har valgt

**Udlejer**
- Opret bruger med en **invitationskode**, som man modtager ved køb af abonnement
  (koden kan komme i et link, der åbner appen med koden udfyldt)
- Log ind på en vilkårlig enhed og vælg, hvilket af sine **huse** enheden skal vise
- Efter login åbner **udlejerskærmen** med AI quick-setup. Har kontoen kun ét hus,
  vælges det automatisk. **Gæstevisning** låser redigeringen og huskes ved genstart.
- Lås udlejertilstand op med **kodeordet til kontoen** (tandhjulet på forsiden)
- Ret husinfo (baggrundsbillede, navn, velkomst, wifi, kontakt)
- Slå sider til/fra for gæsten
- Opret **egne kategorier** med navn og ikon (fx cykler, pool, husdyr) og slet dem igen
- Byg siderne af blokke: tekst, billeder fra **kameraet** eller **galleriet**,
  flyt dem op/ned og slet dem
- **AI quick-setup**: en startside, hvor appens hjælper (en lille hus-figur) forklarer
  de fire trin. Vælg derefter kategorier og gennemgå hele sommerhuset i en chat.
  Svar med tekst eller tale, få opfølgende spørgsmål og gæstevenlige tekstforslag,
  tilføj billeder og godkend husinfo og guidesider samlet.
- Gem og genoptag en opsætningskladde, ret tidligere svar og spring spørgsmål over.
  Gæsterne ser først resultatet efter godkendelse.

Hver udlejers huse, sider og billeder er adskilt og kan kun ses af udlejeren selv
(og af gæsterne på den iPad, udlejeren har logget ind på).

## Sådan kører du appen

```bash
npm install
npx expo start
```

Scan QR-koden med Expo Go. På CBS-netværk/eduroam: `npx expo start --tunnel`.

AI quick-setup kræver en OpenAI-nøgle i en `.env`-fil i projektets rod:

```
OPENAI_API_KEY=din-nøgle
```

`.env` er udeladt fra Git og skal laves lokalt. Resten af appen virker uden.
Efter ændringer i `.env` eller Babel-konfigurationen: genstart med `npx expo start --clear`.

AI bruger den eksisterende OpenAI-integration: `gpt-5` til samtale og strukturerede
tekstforslag, `whisper-1` til talegenkendelse. Der er ikke tilføjet npm-pakker eller
Firebase-tjenester. Nøglen indgår fortsat i appens bundle; denne eksisterende
begrænsning skal løses med en server, før appen distribueres bredt. Læg aldrig en
sådan bundle på et offentligt websted.

### Test af appen

Appen starter på login-skærmen. For at prøve den skal man enten have en
eksisterende testbruger eller en ubrugt invitationskode – de udleveres sammen med
afleveringen og står ikke her, da repoet kan være offentligt.

1. Tryk **Opret bruger**, skriv invitationskoden, email og kodeord
2. Opret et hus – det får 8 tomme, skjulte standardkategorier
3. Udlejerskærmen åbner med AI quick-setup og manuel redigering.
4. Tryk **Gæstevisning**, når iPad'en er klar til gæsterne. Tryk på **tandhjulet**
   og skriv kodeordet for at redigere igen. Genstart bevarer gæstevisningen;
   et nyt login med email og kodeord åbner udlejerskærmen.

### Test af AI quick-setup

1. Åbn **Rediger guiden → AI quick-setup**. Startsiden viser hjælperen og de fire trin;
   tryk **Kom i gang**. Hjælperen spørger, om den skal vælge det, de fleste huse har; **Ja tak, vælg for mig** slår Køkken, Bad,
   Ankomst & parkering, Udtjekning og Affald & genbrug til på én gang. Kategorierne står i grupper (I huset, Praktisk,
   Ude og omkring, Særligt for dit hus). Slå til og fra, fx Det særlige ved huset.
   Du kan også oprette din egen kategori.
2. Tryk **Start samtalen**. Assistenten starter med husnavn, velkomst, wifi og kontakt.
   Samtalen er en chat med hjælperen: emnerne står som en række øverst, og skrivefeltet
   sidder fast i bunden. Svar med tekst og **pilen**, eller tryk på **mikrofonen**
   og stop optagelsen. Talesvaret bliver automatisk transskriberet og sendt ind i
   chatten. Ved fejl kan optagelsen prøves igen; transskriberet tekst bevares i
   skrivefeltet, hvis AI-svaret fejler.
3. Kontrollér opfølgende spørgsmål og tekstforslaget. På telefon ligger tekstforslaget under fanen
   **Udkast til gæsten**; på iPad står det til højre for samtalen. **Ret** under et svar genoptager samtalen
   fra det valgte svar; de efterfølgende svar i samme emne erstattes. Du kan også rette
   gæsteteksten direkte eller springe et spørgsmål/emne over. Når assistenten har
   gennemgået et emne, åbner det næste automatisk. Efter sidste emne åbnes billeder.
4. Tryk på **krydset** i topbjælken (kladden gemmes automatisk), åbn quick-setuppet igen og kontrollér, at startsiden siger
   **Velkommen tilbage!**, og at **Fortsæt hvor du slap** åbner samme trin med kladden bevaret.
   Tryk på tallene øverst for at hoppe frem og tilbage mellem de trin, du allerede har været på.
   Vent på **Kladde gemt**, før appen lukkes helt. Uden netforbindelse vises en gemmefejl.
5. Tilføj billeder fra galleri eller kamera. Højst 12 pr. kategori, under 9 MB pr. billede.
   Hvert AI-afsnit er en separat tekstblok med en kort overskrift (fx Gaskomfur), som gæsten også ser. Brug pilene til at flytte billeder ind
   mellem tekstblokkene; tilføj, ret eller fjern blokke som ved manuel opsætning.
6. Gennemse husinfo og kategorier. **Godkend og opret guide** opdaterer husinfo og
   publicerer alle valgte kategorier med indhold i én Firestore-transaktion.
   Tomme kategorier springes over. Eksisterende sider uden for opsætningen bevares.
7. Åbn guiden i gæstetilstand og kontrollér tekst og billeder.

Kladden gemmes som `quickSetupDraft` på husets eksisterende dokument og er beskyttet
af de nuværende ejerregler; denne ændring kræver ingen nye regler i Firebase Console.
Lydfiler sendes til OpenAI til transskription, men gemmes ikke i Firestore eller Storage.
På iOS/Android læses optagelsen først som en Blob med den indbyggede lokale fillæser.
Det gør lyduploadet kompatibelt med Expo 57; et råt `{ uri, name, type }`-objekt
afvises af Expo med `Unsupported FormDataPart implementation`. Ingen nye pakker kræves.
Uploadede billeder gemmes i Storage før godkendelse; som i resten af appen slettes
filen ikke automatisk, hvis den bagefter fjernes fra kladden.

Opsætningen understøtter op til 20 kategorier, 4.000 tegn pr. svar og 12 svar pr. emne.
Hvis den publicerede husinfo eller en valgt side er ændret på en anden enhed, blokeres
overskrivningen. Start en ny opsætning for at tage udgangspunkt i de nyeste oplysninger.
Arbejd kun på én opsætningskladde pr. hus ad gangen.

Automatiske tests (fiktive AI-, mikrofon- og Firebase-svar; ingen eksterne skrivninger):

```bash
npm test
```

Valgfri integrationstest med ét rigtigt OpenAI-kald og fiktive oplysninger
(bruger API-forbrug, ingen Firebase-skrivninger):

```bash
node --env-file=.env tests/liveQuickSetup.cjs
```

Valgfri taletest med en lokal dansk lydfil (to OpenAI-kald, ingen Firebase-skrivninger):

```bash
node --env-file=.env tests/liveSpeech.cjs /absolut/sti/til/test.wav
```

Testklippet skal sige: "Bruseren drejes til venstre for varmt vand. Åbn vinduet efter bad."
Den bruger Expo-versionens rigtige FormData- og multipart-kode og tester transskription
og tekstblokke. Kun enhedens lokale fillæsning simuleres. Mikrofontilladelse og selve optagelsen skal
også prøves på iPad'en i Expo Go.

Visuel kontrol af de rigtige skærmkomponenter med fiktive data, uden login:

```bash
node tests/previewQuickSetup.cjs
```

Åbn `http://127.0.0.1:8096/?step=0&width=1194`. Startsiden vises som standard (`&new=1`
viser den for en helt ny opsætning). Tilføj `&intro=0` og skift `step` mellem 0–3 for at se trinnene.
Dette er en statisk designkontrol, ikke en interaktiv erstatning for testen i Expo Go.

## Arkitektur

Appen har ingen egen server. Den bruger **Firebase** direkte:

| Tjeneste | Bruges til |
|---|---|
| Authentication | Login med email og kodeord. Login huskes på enheden (AsyncStorage) |
| Cloud Firestore | Invitationskoder, brugere, huse og sider |
| Storage | Billeder, som udlejeren tager eller vælger |

### Datamodel i Firestore

```
invites/{KODE}                 { used, usedBy }
users/{uid}                    { email, inviteCode, createdAt }
houses/{houseId}               { ownerId, name, welcome, wifiName, coverUrl, ..., quickSetupDraft? }
houses/{houseId}/pages/{id}    { title, icon, active, order, blocks, custom }
```

En sides `blocks` er en liste af tekst- og billedblokke, fx
`{ type: 'text', title: 'Gaskomfur', text: '...' }` (overskriften er valgfri) og `{ type: 'image', url: '...' }`.

### Sikkerhed

Sikkerhedsreglerne ligger i [`firebase/firestore.rules`](firebase/firestore.rules)
og [`firebase/storage.rules`](firebase/storage.rules):

- Kun ejeren af et hus kan læse og rette huset, dets sider og dets billeder
- En bruger kan kun oprettes i samme skrivning, som en ubrugt invitationskode
  markeres som brugt
- Invitationskoder kan slås op én ad gangen, men ikke listes

## Mappestruktur

```
App.js              navigation og global state (bruger, valgt hus, husinfo, sider)
components/         genbrugelige komponenter (knap, tekstfelt, ikonvælger)
data/const.js       standardtekster og -sider, som nye huse oprettes ud fra
database/           al kode, der taler med Firebase
firebase/           sikkerhedsregler til Firestore og Storage
screens/            én fil pr. skærm (13 skærme)
services/           AI-samtale, talegenkendelse, opsætningslogik og kladdegemning
tests/              flow-, fejl- og gemmetests samt visuel kontrol med fiktive data
styles/             al styling i GlobalStyle.js
assets/             lokale billeder (forsidens baggrund, app-ikon)
```

## Kursuskrav

| Krav | Hvor |
|---|---|
| Min. 3 views | Alle skærme er bygget af `View`-komponenter |
| Min. 3 screens med navigation | 13 skærme i en Stack Navigator (`App.js`) |
| Min. 2 knapper, mindst én med funktion | `ButtonComponent`, fx "Se guiden" der navigerer |
| Min. 1 liste | `FlatList` i `GuideScreen`, `OwnerPagesScreen` og `HousesScreen` |
| Styling i separat fil | `styles/GlobalStyle.js` |
| README med demovideo | Denne fil |

## Teknologi

Expo SDK 57 · React Native 0.86 · React Navigation 6 (native stack) · Firebase 12 ·
expo-camera · expo-image-picker · expo-audio · expo-linking
