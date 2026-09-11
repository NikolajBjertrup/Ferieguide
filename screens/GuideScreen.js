import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: FlatList med aktive sider (2 kolonner)
export default function GuideScreen() {
  return (
    <View style={GlobalStyle.container}>
      <Text>GuideScreen</Text>
      <StatusBar style="auto" />
    </View>
  );
}
