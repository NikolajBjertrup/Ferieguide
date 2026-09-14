import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import GuideScreen from './screens/GuideScreen';
import PageScreen from './screens/PageScreen';
import OwnerLoginScreen from './screens/OwnerLoginScreen';
import OwnerPagesScreen from './screens/OwnerPagesScreen';
import EditPageScreen from './screens/EditPageScreen';

import { PAGES } from './data/const';
import { GlobalStyle } from './styles/GlobalStyle';

const Stack = createNativeStackNavigator();

export default function App() {
  // Global state: alle sider. PAGES fra const.js er kun startværdien.
  // Når udlejeren redigerer, opdaterer vi denne state, og alle skærme ser ændringen.
  const [pages, setPages] = useState(PAGES);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: GlobalStyle.header,
          headerTintColor: GlobalStyle.colors.accent,
          headerTitleStyle: GlobalStyle.headerTitle,
          headerShadowVisible: false,
          contentStyle: GlobalStyle.screenContent,
        }}
      >
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
