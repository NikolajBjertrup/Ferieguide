import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import GuideScreen from './screens/GuideScreen';
import PageScreen from './screens/PageScreen';
import OwnerLoginScreen from './screens/OwnerLoginScreen';
import OwnerPagesScreen from './screens/OwnerPagesScreen';
import EditPageScreen from './screens/EditPageScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Guide" component={GuideScreen} />
        <Stack.Screen name="Page" component={PageScreen} />
        <Stack.Screen name="OwnerLogin" component={OwnerLoginScreen} />
        <Stack.Screen name="OwnerPages" component={OwnerPagesScreen} />
        <Stack.Screen name="EditPage" component={EditPageScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
