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
- Forside med husets navn, velkomsttekst, wifi, udtjekning og kontaktperson
- Guide med de sider, udlejeren har slået til, vist som store kort
- Hver side består af tekst og billeder i den rækkefølge, udlejeren har valgt

**Udlejer**
- Opret bruger med en **invitationskode**, som man modtager ved køb af abonnement
  (koden kan komme i et link, der åbner appen med koden udfyldt)
- Log ind på en vilkårlig enhed og vælg, hvilket af sine **huse** enheden skal vise
- Lås udlejertilstand op med **kodeordet til kontoen** (tandhjulet på forsiden)
- Ret husinfo (navn, velkomst, wifi, udtjekning, kontakt)
- Slå sider til/fra for gæsten
- Byg siderne af blokke: tekst, billeder fra **kameraet** eller **galleriet**,
  flyt dem op/ned og slet dem
- **Lynopsætning**: indtal en side som talebesked – den bliver transskriberet og
  omskrevet til guidetekst med OpenAI

Hver udlejers huse, sider og billeder er adskilt og kan kun ses af udlejeren selv
(og af gæsterne på den iPad, udlejeren har logget ind på).

## Sådan kører du appen

```bash
npm install
npx expo start
```

Scan QR-koden med Expo Go. På CBS-netværk/eduroam: `npx expo start --tunnel`.

Lynopsætning kræver en OpenAI-nøgle i en `.env`-fil i projektets rod:

```
OPENAI_API_KEY=din-nøgle
```

`.env` er udeladt fra Git og skal laves lokalt. Resten af appen virker uden.

### Test af appen

Appen starter på login-skærmen. For at prøve den skal man enten have en
eksisterende testbruger eller en ubrugt invitationskode – de udleveres sammen med
afleveringen og står ikke her, da repoet kan være offentligt.

1. Tryk **Opret bruger**, skriv invitationskoden, email og kodeord
2. Opret et hus – det får 8 standardsider med eksempeltekst
3. Forsiden er nu gæstetilstand. Tryk på **tandhjulet** og skriv kodeordet for at redigere

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
houses/{houseId}               { ownerId, name, welcome, checkout, wifiName, ... }
houses/{houseId}/pages/{id}    { title, icon, active, order, blocks }
```

En sides `blocks` er en liste af tekst- og billedblokke, fx
`{ type: 'text', text: '...' }` og `{ type: 'image', url: '...' }`.

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
components/         genbrugelige komponenter (ButtonComponent, TextInputComponent)
data/const.js       standardtekster og -sider, som nye huse oprettes ud fra
database/           al kode, der taler med Firebase
firebase/           sikkerhedsregler til Firestore og Storage
screens/            én fil pr. skærm (12 skærme)
services/           kald til OpenAI (talebesked → tekst → guidetekst)
styles/             al styling i GlobalStyle.js
assets/             lokale billeder (forsidens baggrund, app-ikon)
```

## Kursuskrav

| Krav | Hvor |
|---|---|
| Min. 3 views | Alle skærme er bygget af `View`-komponenter |
| Min. 3 screens med navigation | 12 skærme i en Stack Navigator (`App.js`) |
| Min. 2 knapper, mindst én med funktion | `ButtonComponent`, fx "Se guiden" der navigerer |
| Min. 1 liste | `FlatList` i `GuideScreen`, `OwnerPagesScreen` og `HousesScreen` |
| Styling i separat fil | `styles/GlobalStyle.js` |
| README med demovideo | Denne fil |

## Teknologi

Expo SDK 57 · React Native 0.86 · React Navigation 6 (native stack) · Firebase 12 ·
expo-camera · expo-image-picker · expo-audio · expo-linking
