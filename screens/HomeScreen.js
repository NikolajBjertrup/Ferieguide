import { StatusBar } from 'expo-status-bar';
import { Text, View, ImageBackground, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import { HOUSE } from '../data/const';
import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: forsiden med coverbillede, husnavn og velkomsttekst.
// `navigation` får vi automatisk som prop, fordi skærmen ligger i en Stack.Screen.
export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground source={HOUSE.cover} style={GlobalStyle.homeBackground} resizeMode="cover">
      <SafeAreaView style={GlobalStyle.homeOverlay}>
        {/* Diskret tandhjul øverst til højre: fører til udlejer-login */}
        <View style={GlobalStyle.homeTopBar}>
          <Pressable
            style={GlobalStyle.homeSettingsButton}
            onPress={() => navigation.navigate('OwnerLogin')}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={26} color={GlobalStyle.colors.surface} />
          </Pressable>
        </View>

        <View style={GlobalStyle.homeCenter}>
          <View style={GlobalStyle.homeCard}>
            <Text style={GlobalStyle.homeTitle}>{HOUSE.name}</Text>
            <Text style={GlobalStyle.homeWelcome}>{HOUSE.welcome}</Text>
            <ButtonComponent
              title="Se guiden"
              type="primary"
              width={260}
              height={64}
              onPress={() => navigation.navigate('Guide')}
            />
          </View>
        </View>

        <StatusBar style="light" />
      </SafeAreaView>
    </ImageBackground>
  );
}
