import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

// Udlejer: PIN-felt for at låse op
export default function OwnerLoginScreen() {
  return (
    <View style={GlobalStyle.container}>
      <Text>OwnerLoginScreen</Text>
      <StatusBar style="auto" />
    </View>
  );
}
