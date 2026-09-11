import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

// Udlejer: FlatList over alle sider med Switch til aktiver/deaktiver
export default function OwnerPagesScreen() {
  return (
    <View style={GlobalStyle.container}>
      <Text>OwnerPagesScreen</Text>
      <StatusBar style="auto" />
    </View>
  );
}
