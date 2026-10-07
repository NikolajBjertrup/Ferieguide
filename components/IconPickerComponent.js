import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ICONS } from '../data/const';
import { GlobalStyle } from '../styles/GlobalStyle';

// Gitter med ikoner, hvor udlejeren vælger ét. Det valgte ikon er fremhævet.
// Ligesom TextInputComponent er den "kontrolleret": skærmen ejer værdien
// (`value`) og får besked om ændringer gennem `onChange`.
export default function IconPickerComponent({ label, value, onChange }) {
  return (
    <View style={GlobalStyle.inputContainer}>
      <Text style={GlobalStyle.inpLabel}>{label}</Text>
      <View style={GlobalStyle.iconGrid}>
        {ICONS.map((icon) => (
          <Pressable
            key={icon}
            onPress={() => onChange(icon)}
            style={({ pressed }) => [
              GlobalStyle.iconOption,
              icon === value && GlobalStyle.iconOptionSelected,
              pressed && GlobalStyle.iconOptionPressed,
            ]}
          >
            <Ionicons
              name={icon}
              size={28}
              color={icon === value ? GlobalStyle.colors.accent : GlobalStyle.colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
