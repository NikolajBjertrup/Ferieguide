import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { registerUser, authErrorMessage } from '../database/database';

// Opret en ny udlejer. Det kan kun lade sig gøre med en invitationskode,
// som man modtager, når man køber abonnement.
export default function RegisterScreen({ route }) {
  // Koden kan komme med fra linket (route.params.code) – ellers skrives den i hånden.
  // ?. betyder: hvis params ikke findes, så giv undefined i stedet for en fejl.
  const [code, setCode] = useState(route.params?.code || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hvis skærmen allerede er åben, når et link med en ny kode åbnes,
  // ændres route.params.code. Så skriver vi den nye kode ind i feltet.
  const codeFromLink = route.params?.code;
  useEffect(() => {
    if (codeFromLink) {
      setCode(codeFromLink);
    }
  }, [codeFromLink]);

  async function register() {
    if (code.trim() === '') {
      setError('Skriv din invitationskode.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await registerUser(code, email, password);
      // Brugeren er nu logget ind, og App.js skifter selv til guiden
    } catch (e) {
      setError(authErrorMessage(e));
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={GlobalStyle.authScroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
    >
      <View style={GlobalStyle.ownerCard}>
        <Ionicons name="key-outline" size={40} color={GlobalStyle.colors.accent} />
        <Text style={GlobalStyle.ownerTitle}>Opret bruger</Text>
        <Text style={GlobalStyle.ownerSubtitle}>
          Brug invitationskoden fra din købsbekræftelse
        </Text>

        <TextInputComponent
          label="Invitationskode"
          hint="Fx SOMMER2026"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <TextInputComponent
          label="Email"
          hint="din@email.dk"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInputComponent
          label="Kodeord"
          hint="Mindst 6 tegn"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        {error !== '' && <Text style={GlobalStyle.ownerError}>{error}</Text>}

        <ButtonComponent
          title={loading ? 'Opretter …' : 'Opret bruger'}
          type="primary"
          width={260}
          height={60}
          onPress={register}
        />
      </View>
      <StatusBar style="dark" />
    </ScrollView>
  );
}
