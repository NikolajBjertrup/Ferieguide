import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { auth, authErrorMessage } from '../database/database';

// Udlejer: skriv kodeordet til kontoen for at låse redigering op.
// Enheden er allerede logget ind (så gæsten kan se guiden), men gæsten
// kender ikke kodeordet og kan derfor ikke komme i udlejertilstand.
export default function OwnerLoginScreen({ navigation }) {
  // Lokal state: det brugeren har tastet, og en evt. fejlbesked
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = auth.currentUser.email;

  async function unlock() {
    setLoading(true);
    setError('');
    try {
      // "Re-autentificering": Firebase tjekker, at kodeordet passer til den
      // bruger, der allerede er logget ind – uden at logge ud og ind igen.
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // replace i stedet for navigate: login-skærmen fjernes fra stacken,
      // så "tilbage" fra udlejer-siderne går til forsiden, ikke til login
      navigation.replace('OwnerPages');
    } catch (e) {
      setError(authErrorMessage(e));
      setPassword('');
      setLoading(false);
    }
  }

  return (
    <View style={GlobalStyle.ownerContainer}>
      <View style={GlobalStyle.ownerCard}>
        <Ionicons name="lock-closed-outline" size={40} color={GlobalStyle.colors.accent} />
        <Text style={GlobalStyle.ownerTitle}>Udlejer</Text>
        <Text style={GlobalStyle.ownerSubtitle}>
          Skriv kodeordet til {email} for at redigere guiden
        </Text>

        <TextInputComponent
          label="Kodeord"
          hint="Dit kodeord"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        {/* Fejlbesked vises kun, når der er en */}
        {error !== '' && <Text style={GlobalStyle.ownerError}>{error}</Text>}

        <ButtonComponent
          title={loading ? 'Tjekker …' : 'Lås op'}
          type="primary"
          width={220}
          height={60}
          onPress={unlock}
        />
      </View>
      <StatusBar style="dark" />
    </View>
  );
}
