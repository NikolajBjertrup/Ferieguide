import { StatusBar } from 'expo-status-bar';
import { Text, View, ImageBackground, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import { HOUSE } from '../data/const';
import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: forsiden med coverbillede, husnavn og velkomsttekst.
// `navigation` får vi automatisk som prop, fordi skærmen ligger i en Stack.Screen.
// `house` kommer fra App.js og er hentet fra Firestore. Coverbilledet ligger lokalt.
export default function HomeScreen({ navigation, house }) {
  // Huset er ikke hentet endnu
  if (house === null) {
    return (
      <View style={GlobalStyle.authLoading}>
        <ActivityIndicator size="large" color={GlobalStyle.colors.accent} />
      </View>
    );
  }

  const hasWifi = !!(house.wifiName || house.wifiPassword);
  const hasContact = !!(house.ownerName || house.ownerPhone);

  return (
    // Udlejerens eget baggrundsbillede, hvis der er et – ellers appens standardbillede
    <ImageBackground
      source={house.coverUrl ? { uri: house.coverUrl } : HOUSE.cover}
      style={GlobalStyle.homeBackground}
      resizeMode="cover"
    >
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
            <Text style={GlobalStyle.homeTitle}>{house.name}</Text>
            <Text style={GlobalStyle.homeWelcome}>{house.welcome}</Text>

            {/* Det gæster oftest leder efter: wifi og kontakt. Tomme oplysninger vises ikke. */}
            {(hasWifi || hasContact) && <View style={GlobalStyle.homeInfoRow}>
              {hasWifi && <View style={GlobalStyle.homeInfoItem}>
                <Ionicons name="wifi-outline" size={22} color={GlobalStyle.colors.accent} />
                <Text style={GlobalStyle.homeInfoLabel}>Wifi</Text>
                {!!house.wifiName && <Text style={GlobalStyle.homeInfoValue}>Navn: {house.wifiName}</Text>}
                {!!house.wifiPassword && <Text style={GlobalStyle.homeInfoValue}>Kode: {house.wifiPassword}</Text>}
              </View>}
              {hasContact && <View style={GlobalStyle.homeInfoItem}>
                <Ionicons name="call-outline" size={22} color={GlobalStyle.colors.accent} />
                <Text style={GlobalStyle.homeInfoLabel}>Kontakt</Text>
                {!!house.ownerName && <Text style={GlobalStyle.homeInfoValue}>{house.ownerName}</Text>}
                {!!house.ownerPhone && <Text style={GlobalStyle.homeInfoValue}>{house.ownerPhone}</Text>}
              </View>}
            </View>}

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
