import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
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

import { PAGES } from './data/const';
import { GlobalStyle } from './styles/GlobalStyle';
import { auth, uploadStartPages, getPages } from './database/database';

const Stack = createNativeStackNavigator();

export default function App() {
  // Den udlejer, der er logget ind på enheden (null = ingen er logget ind)
  const [user, setUser] = useState(null);
  // Firebase skal lige nå at tjekke AsyncStorage for et gemt login, før vi ved, om nogen er logget ind
  const [authChecked, setAuthChecked] = useState(false);

  // onAuthStateChanged kalder vores funktion, hver gang nogen logger ind eller ud
  // (og én gang ved start). Funktionen den returnerer, stopper lytningen igen.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // Global state: alle sider. PAGES fra const.js er kun startværdien.
  // Når udlejeren redigerer, opdaterer vi denne state, og alle skærme ser ændringen.
  const [pages, setPages] = useState(PAGES);

  // Kører én gang, når appen starter (den tomme [] betyder "kun første gang").
  // Lægger startsiderne op, hvis databasen er tom, og henter så siderne fra Firestore.
  // Indtil svaret kommer (eller hvis der ingen internet er), vises siderne fra const.js.
  useEffect(() => {
    async function loadPages() {
      try {
        await uploadStartPages();
        const pagesFromDb = await getPages();
        setPages(pagesFromDb);
      } catch (error) {
        console.log('Firestore-fejl:', error.message);
      }
    }
    loadPages();
  }, []);

  // Mens Firebase tjekker login, viser vi bare en spinner
  if (!authChecked) {
    return (
      <View style={GlobalStyle.authLoading}>
        <ActivityIndicator size="large" color={GlobalStyle.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

            {/* Render-funktion i stedet for component={...}, så vi kan sende pages/setPages med som props */}
            <Stack.Screen name="Guide" options={{ title: 'Guiden' }}>
              {(props) => <GuideScreen {...props} pages={pages} />}
            </Stack.Screen>

            {/* Tom titel: sidens egen titel vises stort i indholdet, og iOS viser "Guiden" ved tilbage-pilen */}
            <Stack.Screen name="Page" options={{ title: '' }}>
              {(props) => <PageScreen {...props} pages={pages} />}
            </Stack.Screen>
            <Stack.Screen name="OwnerLogin" component={OwnerLoginScreen} options={{ title: 'Udlejer-login' }} />
            <Stack.Screen name="OwnerPages" options={{ title: 'Rediger guiden' }}>
              {(props) => <OwnerPagesScreen {...props} pages={pages} setPages={setPages} />}
            </Stack.Screen>
            <Stack.Screen name="EditPage" options={{ title: 'Rediger side' }}>
              {(props) => <EditPageScreen {...props} pages={pages} setPages={setPages} />}
            </Stack.Screen>
            <Stack.Screen name="QuickSetup" options={{ title: 'Lynopsætning' }}>
              {(props) => <QuickSetupScreen {...props} pages={pages} setPages={setPages} />}
            </Stack.Screen>
            {/* Kameraet har ikke brug for pages – det sender bare billedlinket tilbage til EditPage */}
            <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Tag billede' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
