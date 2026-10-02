import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import GuideScreen from './screens/GuideScreen';
import PageScreen from './screens/PageScreen';
import OwnerLoginScreen from './screens/OwnerLoginScreen';
import OwnerPagesScreen from './screens/OwnerPagesScreen';
import EditPageScreen from './screens/EditPageScreen';
import QuickSetupScreen from './screens/QuickSetupScreen';
import CameraScreen from './screens/CameraScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HousesScreen from './screens/HousesScreen';
import EditHouseScreen from './screens/EditHouseScreen';

import { GlobalStyle } from './styles/GlobalStyle';
import { auth, getHouse, getPages } from './database/database';

const Stack = createNativeStackNavigator();

// Deep links: fortæller React Navigation, hvilke adresser der åbner hvilke skærme.
// Invitationslinket fra købet ser fx sådan ud:
//   ferieguide://register?code=SOMMER2026            (i en færdigbygget app)
//   exp://192.168.1.10:8083/--/register?code=SOMMER2026  (i Expo Go under udvikling)
// Linking.createURL('/') giver den rigtige start på adressen i begge tilfælde.
// ?code=... bliver automatisk til route.params.code på RegisterScreen.
const linking = {
  prefixes: [Linking.createURL('/'), 'ferieguide://'],
  config: {
    screens: {
      Register: 'register',
    },
  },
};

export default function App() {
  // Den udlejer, der er logget ind på enheden (null = ingen er logget ind)
  const [user, setUser] = useState(null);
  // Firebase skal lige nå at tjekke AsyncStorage for et gemt login, før vi ved, om nogen er logget ind
  const [authChecked, setAuthChecked] = useState(false);
  // Det hus, denne enhed viser (null = intet hus valgt endnu)
  const [houseId, setHouseId] = useState(null);
  // Global state: alle sider i det valgte hus. Når udlejeren redigerer,
  // opdaterer vi denne state, og alle skærme ser ændringen.
  const [pages, setPages] = useState([]);
  // Husets info (navn, velkomsttekst, wifi ...), som vises på forsiden
  const [house, setHouse] = useState(null);

  // onAuthStateChanged kalder vores funktion, hver gang nogen logger ind eller ud
  // (og én gang ved start). Funktionen den returnerer, stopper lytningen igen.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Enheden husker, hvilket hus den viste for denne udlejer sidst.
      // Nøglen indeholder bruger-id'et, så to udlejere på samme enhed ikke blandes sammen.
      let savedHouseId = null;
      if (currentUser) {
        savedHouseId = await AsyncStorage.getItem('selectedHouse_' + currentUser.uid);
      }
      setHouseId(savedHouseId);
      setUser(currentUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // Henter husets info og sider, hver gang enheden skifter hus.
  // [houseId] betyder: kør igen, når houseId ændrer sig.
  useEffect(() => {
    if (!houseId) {
      return;
    }
    // Ryd det gamle hus, mens det nye hentes
    setHouse(null);
    setPages([]);
    getHouse(houseId)
      .then((houseFromDb) => setHouse(houseFromDb))
      .catch((error) => {
        // Huset er slettet, eller det tilhører ikke denne udlejer (reglerne afviser det).
        // Så glemmer enheden valget, og udlejeren sendes til "Vælg hus".
        console.log('Kunne ikke hente huset:', error.message);
        AsyncStorage.removeItem('selectedHouse_' + auth.currentUser.uid);
        setHouseId(null);
      });
    getPages(houseId)
      .then((pagesFromDb) => setPages(pagesFromDb))
      .catch((error) => console.log('Firestore-fejl:', error.message));
  }, [houseId]);

  // Kun under udvikling: skriv et eksempel på et invitationslink i terminalen,
  // så det kan sendes til telefonen og testes. __DEV__ er false i en færdig app.
  useEffect(() => {
    if (__DEV__) {
      console.log('Invitationslink:', Linking.createURL('register', { queryParams: { code: 'DINKODE' } }));
    }
  }, []);

  // Vælg hus på denne enhed. Sendes som prop til HousesScreen.
  function selectHouse(id) {
    setHouseId(id);
    AsyncStorage.setItem('selectedHouse_' + user.uid, id);
  }

  // Mens Firebase tjekker login, viser vi bare en spinner
  if (!authChecked) {
    return (
      <View style={GlobalStyle.authLoading}>
        <ActivityIndicator size="large" color={GlobalStyle.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: GlobalStyle.header,
          headerTintColor: GlobalStyle.colors.accent,
          headerTitleStyle: GlobalStyle.headerTitle,
          headerShadowVisible: false,
          contentStyle: GlobalStyle.screenContent,
        }}
      >
        {/* Ingen logget ind: vis kun login og opret bruger.
            Når user skifter, bytter React Navigation selv skærmene ud. */}
        {user === null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Opret bruger' }} />
          </>
        ) : houseId === null ? (
          // Logget ind, men enheden har ikke valgt hus endnu
          <Stack.Screen name="ChooseHouse" options={{ title: 'Vælg hus' }}>
            {(props) => <HousesScreen {...props} houseId={houseId} selectHouse={selectHouse} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {(props) => <HomeScreen {...props} house={house} />}
            </Stack.Screen>

            {/* Render-funktion i stedet for component={...}, så vi kan sende pages/setPages med som props */}
            <Stack.Screen name="Guide" options={{ title: 'Guiden' }}>
              {(props) => <GuideScreen {...props} pages={pages} />}
            </Stack.Screen>

            {/* Tom titel: sidens egen titel vises stort i indholdet, og iOS viser "Guiden" ved tilbage-pilen */}
            <Stack.Screen name="Page" options={{ title: '' }}>
              {(props) => <PageScreen {...props} pages={pages} />}
            </Stack.Screen>
            <Stack.Screen name="OwnerLogin" component={OwnerLoginScreen} options={{ title: 'Udlejer-login' }} />
            <Stack.Screen name="EditHouse" options={{ title: 'Husinfo' }}>
              {(props) => <EditHouseScreen {...props} house={house} setHouse={setHouse} />}
            </Stack.Screen>
            <Stack.Screen name="OwnerPages" options={{ title: 'Rediger guiden' }}>
              {(props) => <OwnerPagesScreen {...props} houseId={houseId} pages={pages} setPages={setPages} />}
            </Stack.Screen>
            <Stack.Screen name="EditPage" options={{ title: 'Rediger side' }}>
              {(props) => <EditPageScreen {...props} houseId={houseId} pages={pages} setPages={setPages} />}
            </Stack.Screen>
            <Stack.Screen name="QuickSetup" options={{ title: 'Lynopsætning' }}>
              {(props) => <QuickSetupScreen {...props} houseId={houseId} pages={pages} setPages={setPages} />}
            </Stack.Screen>
            {/* Kameraet har ikke brug for pages – det sender bare billedlinket tilbage til EditPage */}
            <Stack.Screen name="Camera" options={{ title: 'Tag billede' }}>
              {(props) => <CameraScreen {...props} houseId={houseId} />}
            </Stack.Screen>
            {/* "Skift hus" fra udlejertilstand. Samme skærm som ChooseHouse, men med et andet navn,
                så React Navigation ved, at det er to forskellige steder i appen. */}
            <Stack.Screen name="Houses" options={{ title: 'Skift hus' }}>
              {(props) => <HousesScreen {...props} houseId={houseId} selectHouse={selectHouse} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
