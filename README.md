# FerieGuide

En React Native-app til **udlejere af ferieboliger**. Udlejeren bygger en digital
instruktionsbog til sit sommerhus med tekst og billeder. Appen står derefter på en
iPad i huset i **gæstetilstand**, hvor gæsterne kan læse guiden, men ikke ændre den.

Godkendelsesopgave 2 i kurset INNT på CBS (E26).

**Gruppe:** Ole, Anton, Daniel og Nikolaj

## Demovideo

(https://youtube.com/shorts/BmQOMtlCJGU?feature=share)

## Hvem har kodet hvad

Vi har ofte kodet sammen og på hinandens computere, så commits i git står ikke altid i navnet på den, der har lavet skærmen. Tabellen viser, hvem der har stået for hvad.

| Navn | Skærme |
|---|---|
| Ole | [Quick setup](screens/QuickSetupScreen.js) og [Houses](screens/HousesScreen.js) |
| Nikolaj | [Login](screens/LoginScreen.js) og [Register](screens/RegisterScreen.js) |
| Anton | [EditHouse](screens/EditHouseScreen.js) |
| Daniel | [Camera](screens/CameraScreen.js) og [New page](screens/NewPageScreen.js) |

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
| Nye knapper | `ButtonComponent`, fx "Kom i gang" (QuickSetup), "Brug billede" (Camera), "Gem" (EditHouse) |
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
