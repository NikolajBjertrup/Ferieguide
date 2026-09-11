import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

// Udlejer: redigér titel og brødtekst for én side
export default function EditPageScreen() {
  return (
    <View style={GlobalStyle.container}>
      <Text>EditPageScreen</Text>
      <StatusBar style="auto" />
    </View>
  );
}
