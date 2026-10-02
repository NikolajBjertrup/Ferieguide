import { StatusBar } from 'expo-status-bar';
import { Text, View, FlatList, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';

import ButtonComponent from '../components/ButtonComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { auth, updatePage } from '../database/database';

// Udlejer: liste over ALLE sider. Switch slår siden til/fra for gæsten,
// tryk på rækken åbner redigering.
export default function OwnerPagesScreen({ navigation, pages, setPages }) {
  function toggleActive(pageId) {
    // State må ikke ændres direkte. Vi laver et nyt array, hvor kun den
    // valgte side er byttet ud med en kopi, der har active vendt om.
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, active: !page.active } : page
      )
    );
    // Gem den nye værdi i Firestore
    const page = pages.find((p) => p.id === pageId);
    updatePage(pageId, { active: !page.active }).catch((error) =>
      console.log('Kunne ikke gemme i Firestore:', error.message)
    );
  }

  return (
    <View style={GlobalStyle.ownerListContainer}>
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GlobalStyle.ownerList}
        ListHeaderComponent={
          <Text style={GlobalStyle.ownerListHint}>
            Slå sider til eller fra med kontakten. Tryk på en side for at redigere tekst,
            eller tryk på mikrofonen for at indtale indholdet.
          </Text>
        }
        ListFooterComponent={
          // Log ud: App.js opdager det via onAuthStateChanged og viser login-skærmen igen
          <View style={GlobalStyle.ownerLogoutRow}>
            <ButtonComponent title="Log ud" type="secondary" width={200} height={56} onPress={() => signOut(auth)} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [GlobalStyle.ownerRow, pressed && GlobalStyle.ownerRowPressed]}
            onPress={() => navigation.navigate('EditPage', { pageId: item.id })}
          >
            <Ionicons name={item.icon} size={28} color={GlobalStyle.colors.accent} />
            <View style={GlobalStyle.ownerRowText}>
              <Text style={GlobalStyle.ownerRowTitle}>{item.title}</Text>
              <Text style={GlobalStyle.ownerRowStatus}>
                {item.active ? 'Vises for gæsten' : 'Skjult'}
              </Text>
            </View>
            {/* Genvej til lynopsætning: indtal siden i stedet for at skrive den */}
            <Pressable
              style={({ pressed }) => [
                GlobalStyle.ownerRowMic,
                pressed && GlobalStyle.ownerRowMicPressed,
              ]}
              onPress={() => navigation.navigate('QuickSetup', { pageId: item.id })}
            >
              <Ionicons name="mic" size={24} color={GlobalStyle.colors.accent} />
            </Pressable>
            <Switch
              value={item.active}
              onValueChange={() => toggleActive(item.id)}
              trackColor={{ true: GlobalStyle.colors.accent, false: GlobalStyle.colors.border }}
            />
            <Ionicons name="chevron-forward" size={24} color={GlobalStyle.colors.textMuted} />
          </Pressable>
        )}
      />
      <StatusBar style="dark" />
    </View>
  );
}
