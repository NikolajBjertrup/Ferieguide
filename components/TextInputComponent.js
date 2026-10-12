import { Text, View, TextInput } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

// Label + tekstfelt. Feltet er "kontrolleret": værdien ejes af skærmen via
// `value`, og hver tastetryk sendes tilbage gennem `onChangeText`.
export default function TextInputComponent({
  label,
  hint,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  maxLength,
  multiline,
  autoCapitalize,
  editable = true,
}) {
  return (
    <View style={GlobalStyle.inputContainer}>
      <Text style={GlobalStyle.inpLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        style={[GlobalStyle.textInput, multiline && GlobalStyle.textInputMultiline]}
        placeholder={hint}
        placeholderTextColor={GlobalStyle.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize} // fx "none" til email, så første bogstav ikke bliver stort
      />
    </View>
  );
}
