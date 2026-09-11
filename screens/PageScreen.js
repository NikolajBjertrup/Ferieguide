import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: viser én side (titel, billede, brødtekst)
export default function PageScreen() {
  return (
    <View style={GlobalStyle.container}>
      <Text>PageScreen</Text>
      <StatusBar style="auto" />
    </View>
  );
}
