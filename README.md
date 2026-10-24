# FerieGuide

En React Native-app til **udlejere af ferieboliger**. Udlejeren bygger en digital
instruktionsbog til sit sommerhus med tekst og billeder. Appen står derefter på en
iPad i huset i **gæstetilstand**, hvor gæsterne kan læse guiden, men ikke ændre den.

Godkendelsesopgave 2 i kurset INNT på CBS (E26).

**Gruppe:** Ole, Anton, Daniel og Nikolaj

## Demovideo

_Link følger_

## Hvem har kodet hvad

AI quick-setup ligger i én skærm, [`QuickSetupScreen.js`](screens/QuickSetupScreen.js),
med et trin pr. side. Linkene peger på de linjer, hvor hvert trin bygges.

| Navn | Skærme / funktioner |
|---|---|
| Ole | AI quick-setup: [startside](screens/QuickSetupScreen.js#L523-L549) og [kategorier](screens/QuickSetupScreen.js#L555-L593) (inkl. [bundlinjen](screens/QuickSetupScreen.js#L629-L636)) |
| Nikolaj | [Login](screens/LoginScreen.js) og [overblik over alle boliger](screens/HousesScreen.js) |
| Daniel | AI quick-setup: [samtale](screens/QuickSetupScreen.js#L443-L517) og [billeder](screens/QuickSetupScreen.js#L595-L606) |
| Anton | AI quick-setup: [godkend](screens/QuickSetupScreen.js#L608-L621) (gemmes med [`publishQuickSetup`](database/database.js#L130)) |

## Funktioner

- **Udlejer:** opret bruger med invitationskode, vælg hus, ret husinfo, slå sider
  til/fra, lav egne kategorier og byg sider af tekst og billeder (kamera/galleri).
- **AI quick-setup:** en chat, hvor udlejeren beskriver huset med tekst eller tale,
  og AI'en skriver gæstevenlige tekster, som godkendes samlet.
- **Gæst:** forside med velkomst, wifi og kontakt, og en guide med de aktive sider.
  Redigering låses op med kontoens kodeord.

## Kursuskrav

| Krav | Hvor |
|---|---|
| Nye knapper | `ButtonComponent`, fx "Se guiden", "Gæstevisning", "Kom i gang" |
| 1 ny skærm pr. gruppemedlem | Se "Hvem har kodet hvad" |
| Navigation mellem skærme | Stack Navigator i `App.js` |
| Ny funktionalitet | Generativ AI (OpenAI), talegenkendelse og kamera |
| Gemme/hente data | Firebase (Auth, Firestore, Storage) og AsyncStorage |
| Styling i separat fil | `styles/GlobalStyle.js` |
| README med demovideo | Denne fil |

## Kør appen

```bash
npm install
npx expo start          # på CBS-netværk: npx expo start --tunnel
```

Scan QR-koden med Expo Go. AI quick-setup kræver en `.env`-fil i projektets rod
med `OPENAI_API_KEY=din-nøgle`. Testlogin/invitationskode udleveres sammen med
afleveringen.

## Teknologi

Expo SDK 58 · React Native · React Navigation 6 · Firebase · OpenAI ·
expo-camera · expo-image-picker · expo-audio
