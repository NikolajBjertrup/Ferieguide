import { StyleSheet, Text, View, TextInput } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

export default function TextInputComponent({label, hint, defaultV}) {
  return (
    <View>
      <Text style = {GlobalStyle.inpLabel}>{label}</Text>
      <TextInput style={GlobalStyle.textInput} placeholder = {hint} defaultValue={defaultV} />
    </View>

  );
}

