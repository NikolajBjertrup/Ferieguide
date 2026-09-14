# FerieGuide

En React Native-app til udlejere af ferieboliger. Udlejeren bygger en digital
instruktionsbog til huset ved at slå prædefinerede sider til/fra og udfylde
dem med tekst og billeder. Appen kører på en iPad i ferieboligen, hvor gæsten
kun kan læse guiden.

Godkendelsesopgave 1 i kurset INNT på CBS.

## Demovideo

**[Link til demovideo – indsættes her]**

## Sådan kører du appen

```bash
npm install
npx expo start
```

Scan QR-koden med Expo Go. På CBS-netværk/eduroam: `npx expo start --tunnel`.

## Brugerroller

- **Gæst** (standard): Kan kun læse guiden.
- **Udlejer**: Tryk på tandhjulet på forsiden og indtast PIN `1234` for at
  redigere sider og slå dem til/fra.

## Skærme

| Skærm | Rolle | Indhold |
|---|---|---|
| `HomeScreen` | Gæst | Coverbillede, husnavn, velkomsttekst, knap til guiden |
| `GuideScreen` | Gæst | FlatList i to kolonner med de aktive sider |
| `PageScreen` | Gæst | Én side med titel, billede og brødtekst |
| `OwnerLoginScreen` | Udlejer | PIN-kode |
| `OwnerPagesScreen` | Udlejer | FlatList over alle sider med Switch til/fra |
| `EditPageScreen` | Udlejer | Redigér titel og brødtekst |

## Mappestruktur

```
App.js            navigation + global state
components/       genbrugelige komponenter (knap, tekstfelt)
data/const.js     husdata og sider
screens/          én fil pr. skærm
styles/           al styling i GlobalStyle.js
assets/           billeder
```

## Teknisk stak

Expo SDK 57, React Native 0.86, React Navigation 7 (native-stack). Ingen
backend – al data ligger i `data/const.js` og i React state.
