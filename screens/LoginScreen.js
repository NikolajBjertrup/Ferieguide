import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { auth, authErrorMessage } from '../database/database';

// Første skærm på en ny enhed: udlejeren logger ind med sin konto.
// Når login lykkes, opdager App.js det (onAuthStateChanged) og viser udlejerskærmen,
// så vi behøver ikke selv at navigere videre herfra.
export default function LoginScreen({ navigation, onLoginStart }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError('');
    try {
      onLoginStart?.();
      await signInWithEmailAndPassword(auth, email.trim(), password);
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
        <Ionicons name="home-outline" size={40} color={GlobalStyle.colors.accent} />
        <Text style={GlobalStyle.ownerTitle}>FerieGuide</Text>
        <Text style={GlobalStyle.ownerSubtitle}>Log ind som udlejer for at sætte enheden op</Text>

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
          hint="Dit kodeord"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        {error !== '' && <Text style={GlobalStyle.ownerError}>{error}</Text>}

        <ButtonComponent
          title={loading ? 'Logger ind …' : 'Log ind'}
          type="primary"
          width={260}
          height={60}
          onPress={login}
        />

        <View style={GlobalStyle.authDivider} />
        <Text style={GlobalStyle.ownerSubtitle}>Har du købt FerieGuide og fået en invitationskode?</Text>
        <ButtonComponent
          title="Opret bruger"
          type="secondary"
          width={260}
          height={60}
          onPress={() => navigation.navigate('Register')}
        />
      </View>
      <StatusBar style="dark" />
    </ScrollView>
  );
}
