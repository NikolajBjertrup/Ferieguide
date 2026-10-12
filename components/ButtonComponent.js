import { Text, Pressable } from 'react-native';

import { GlobalStyle } from '../styles/GlobalStyle';

export default function ButtonComponent({title, onPress, width, height, type, disabled = false}) {
  return (
    <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        // Conditional styling - vi kigger på type og pressed for at ændre styling og farver
        style={({ pressed }) => [
          {
            backgroundColor:
              type === 'primary'
                ? pressed
                  ? GlobalStyle.colors.accentPressed
                  : GlobalStyle.colors.accent
                : pressed
                  ? GlobalStyle.colors.accentSoft
                  : GlobalStyle.colors.surface,
            width: width,
            height: height,
          },
          type === 'primary' ? GlobalStyle.primaryBtn : GlobalStyle.secondaryBtn, // Conditional styling
          disabled && GlobalStyle.setupDisabled,
        ]}
        onPress={onPress}
      >
        <Text style={type === 'primary' ? GlobalStyle.primaryBtnText : GlobalStyle.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}
