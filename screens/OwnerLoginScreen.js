import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { OWNER_PIN } from '../data/const';
import { GlobalStyle } from '../styles/GlobalStyle';

// Udlejer: indtast PIN for at låse redigering op
export default function OwnerLoginScreen({ navigation }) {
  // Lokal state: det brugeren har tastet, og om sidste forsøg var forkert
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function unlock() {
    if (pin === OWNER_PIN) {
      // replace i stedet for navigate: login-skærmen fjernes fra stacken,
      // så "tilbage" fra udlejer-siderne går til forsiden, ikke til login
      navigation.replace('OwnerPages');
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <View style={GlobalStyle.ownerContainer}>
      <View style={GlobalStyle.ownerCard}>
        <Ionicons name="lock-closed-outline" size={40} color={GlobalStyle.colors.accent} />
        <Text style={GlobalStyle.ownerTitle}>Udlejer</Text>
        <Text style={GlobalStyle.ownerSubtitle}>Indtast PIN-kode for at redigere guiden</Text>

        <TextInputComponent
          label="PIN-kode"
          hint="••••"
          value={pin}
          onChangeText={(text) => {
            setPin(text);
            setError(false);
          }}
          secureTextEntry={true}
          keyboardType="number-pad"
          maxLength={4}
        />

        {/* Fejlbesked vises kun når error er true */}
        {error && <Text style={GlobalStyle.ownerError}>Forkert PIN-kode. Prøv igen.</Text>}

        <ButtonComponent title="Lås op" type="primary" width={220} height={60} onPress={unlock} />
      </View>
      <StatusBar style="dark" />
    </View>
  );
}
