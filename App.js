import { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
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
import NewPageScreen from './screens/NewPageScreen';
import ButtonComponent from './components/ButtonComponent';
import HeaderSafeArea from './components/HeaderSafeAreaComponent';

import { GlobalStyle } from './styles/GlobalStyle';
import { auth, getHouse, getHouses, getPages } from './database/database';

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
  const [ownerMode, setOwnerMode] = useState(true);
  const [houseLoadError, setHouseLoadError] = useState(false);
  const [houseLoadAttempt, setHouseLoadAttempt] = useState(0);
  const explicitLogin = useRef(false);

  // onAuthStateChanged kalder vores funktion, hver gang nogen logger ind eller ud
  // (og én gang ved start). Funktionen den returnerer, stopper lytningen igen.
  useEffect(() => {
    let active = true;
    let sequence = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const request = ++sequence;
      // Enheden husker, hvilket hus den viste for denne udlejer sidst.
      // Nøglen indeholder bruger-id'et, så to udlejere på samme enhed ikke blandes sammen.
      let savedHouseId = null;
      let savedMode = null;
      let restoreFailed = false;
      if (currentUser) {
        try {
          [savedHouseId, savedMode] = await Promise.all([
            AsyncStorage.getItem('selectedHouse_' + currentUser.uid),
            AsyncStorage.getItem('displayMode_' + currentUser.uid),
          ]);
          if (!savedHouseId) {
            const houses = await getHouses();
            if (houses.length === 1) {
              savedHouseId = houses[0].id;
              await AsyncStorage.setItem('selectedHouse_' + currentUser.uid, savedHouseId);
            }
          }
        } catch { restoreFailed = true; }
      }
      if (!active || request !== sequence) return;
      // Fejl i den gemte tilstand må aldrig give en gæst redigeringsadgang.
      const isOwner = explicitLogin.current || (!restoreFailed && savedMode !== 'guest');
      if (currentUser && explicitLogin.current) AsyncStorage.setItem('displayMode_' + currentUser.uid, 'owner').catch(() => {});
      explicitLogin.current = false;
      setOwnerMode(isOwner);
      setHouseId(savedHouseId);
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  // Henter husets info og sider, hver gang enheden skifter hus.
  // [houseId] betyder: kør igen, når houseId ændrer sig.
  useEffect(() => {
    setHouseLoadError(false);
    if (!houseId) {
      return;
    }
    // Ryd det gamle hus, mens det nye hentes
    setHouse(null);
    setPages([]);
    let active = true;
    Promise.all([getHouse(houseId), getPages(houseId)])
      .then(([houseFromDb, pagesFromDb]) => { if (active) { setHouse(houseFromDb); setPages(pagesFromDb); } })
      .catch(() => {
        if (!active) return;
        // Bevar husvalg og gæstelås ved netværksfejl; lad brugeren prøve igen.
        setHouseLoadError(true);
      });
    return () => { active = false; };
  }, [houseId, user?.uid, houseLoadAttempt]);

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
    setOwnerMode(true);
    AsyncStorage.setItem('selectedHouse_' + user.uid, id).catch(() => {});
  }

  async function showGuestMode() {
    await AsyncStorage.setItem('displayMode_' + user.uid, 'guest');
    setOwnerMode(false);
  }

  async function unlockOwnerMode() {
    await AsyncStorage.setItem('displayMode_' + user.uid, 'owner');
    setOwnerMode(true);
  }

  if (authChecked && user && houseId && houseLoadError) return (
    <View style={GlobalStyle.authLoading}>
      <Text style={GlobalStyle.ownerError}>Guiden kunne ikke hentes. Kontrollér forbindelsen og prøv igen.</Text>
      <ButtonComponent title="Prøv igen" type="primary" width={240} height={60}
        onPress={() => { setHouseLoadError(false); setHouseLoadAttempt((attempt) => attempt + 1); }} />
      <ButtonComponent title={ownerMode ? 'Vælg et andet hus' : 'Udlejer-login'} type="secondary" width={240} height={60}
        onPress={() => setHouseId(null)} />
    </View>
  );

  // Mens Firebase tjekker login, viser vi bare en spinner
  if (!authChecked || (user && houseId && house?.id !== houseId)) {
    return (
      <View style={GlobalStyle.authLoading}>
        <ActivityIndicator size="large" color={GlobalStyle.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        key={`${user?.uid || 'login'}:${houseId || 'choose'}:${ownerMode ? 'owner' : 'guest'}`}
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
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => <LoginScreen {...props} onLoginStart={() => { explicitLogin.current = true; }} />}
            </Stack.Screen>
            <Stack.Screen name="Register" options={{ title: 'Opret bruger' }}>
              {(props) => <HeaderSafeArea><RegisterScreen {...props} /></HeaderSafeArea>}
            </Stack.Screen>
          </>
        ) : houseId === null && !ownerMode ? (
          <Stack.Screen name="OwnerLogin" options={{ title: 'Udlejer-login' }}>
            {(props) => <HeaderSafeArea><OwnerLoginScreen {...props} onUnlock={unlockOwnerMode} /></HeaderSafeArea>}
          </Stack.Screen>
        ) : houseId === null ? (
          // Logget ind, men enheden har ikke valgt hus endnu
          <Stack.Screen name="ChooseHouse" options={{ title: 'Vælg hus' }}>
            {(props) => <HeaderSafeArea><HousesScreen {...props} houseId={houseId} selectHouse={selectHouse} /></HeaderSafeArea>}
          </Stack.Screen>
        ) : (
          <>
            {ownerMode ? <>
            <Stack.Screen name="OwnerPages" options={{ title: 'Rediger guiden' }}>
              {(props) => <HeaderSafeArea><OwnerPagesScreen {...props} houseId={houseId} pages={pages} setPages={setPages} onShowGuest={showGuestMode} /></HeaderSafeArea>}
            </Stack.Screen>
            <Stack.Screen name="EditHouse" options={{ title: 'Husinfo' }}>
              {(props) => <HeaderSafeArea><EditHouseScreen {...props} house={house} setHouse={setHouse} /></HeaderSafeArea>}
            </Stack.Screen>
            <Stack.Screen name="NewPage" options={{ title: 'Ny kategori' }}>
              {(props) => <HeaderSafeArea><NewPageScreen {...props} houseId={houseId} pages={pages} setPages={setPages} /></HeaderSafeArea>}
            </Stack.Screen>
            <Stack.Screen name="EditPage" options={{ title: 'Rediger side' }}>
              {(props) => <HeaderSafeArea><EditPageScreen {...props} houseId={houseId} pages={pages} setPages={setPages} /></HeaderSafeArea>}
            </Stack.Screen>
            <Stack.Screen name="QuickSetup" options={{ title: 'AI quick-setup', gestureEnabled: false }}>
              {(props) => <HeaderSafeArea><QuickSetupScreen {...props} houseId={houseId} setPages={setPages} setHouse={setHouse} /></HeaderSafeArea>}
            </Stack.Screen>
            {/* Kameraet har ikke brug for pages – det sender bare billedlinket tilbage til EditPage */}
            <Stack.Screen name="Camera" options={{ title: 'Tag billede' }}>
              {(props) => <HeaderSafeArea><CameraScreen {...props} houseId={houseId} /></HeaderSafeArea>}
            </Stack.Screen>
            {/* "Skift hus" fra udlejertilstand. Samme skærm som ChooseHouse, men med et andet navn,
                så React Navigation ved, at det er to forskellige steder i appen. */}
            <Stack.Screen name="Houses" options={{ title: 'Skift hus' }}>
              {(props) => <HeaderSafeArea><HousesScreen {...props} houseId={houseId} selectHouse={selectHouse} /></HeaderSafeArea>}
            </Stack.Screen>
            </> : <>
              <Stack.Screen name="Home" options={{ headerShown: false }}>
                {(props) => <HomeScreen {...props} house={house} />}
              </Stack.Screen>
              <Stack.Screen name="OwnerLogin" options={{ title: 'Udlejer-login' }}>
                {(props) => <HeaderSafeArea><OwnerLoginScreen {...props} onUnlock={unlockOwnerMode} /></HeaderSafeArea>}
              </Stack.Screen>
            </>}
            <Stack.Screen name="Guide" options={{ title: 'Guiden' }}>
              {(props) => <HeaderSafeArea><GuideScreen {...props} pages={pages} /></HeaderSafeArea>}
            </Stack.Screen>
            <Stack.Screen name="Page" options={{ title: '' }}>
              {(props) => <HeaderSafeArea><PageScreen {...props} pages={pages} /></HeaderSafeArea>}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
