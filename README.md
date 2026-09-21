## Demovideo

https://youtube.com/shorts/8t2mC9-cTaE?feature=share

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


## Mappestruktur

```
App.js            navigation + global state
components/       genbrugelige komponenter (knap, tekstfelt)
data/const.js     husdata og sider
screens/          én fil pr. skærm
styles/           al styling i GlobalStyle.js
assets/           billeder
```
