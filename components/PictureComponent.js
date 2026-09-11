import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

export default function PictureComponent({source, size}) {
  return (
    <View>
      <Image source={source} style={[{ width: size, height: size, borderRadius: size/2 }, GlobalStyle.picture]} />
    </View>
  );
}
