import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, FlatList, Pressable, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';

import ButtonComponent from '../components/ButtonComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { auth, updatePage, deletePage } from '../database/database';

// Udlejer: liste over ALLE sider. Switch slår siden til/fra for gæsten,
// tryk på rækken åbner redigering. Egne kategorier kan oprettes og slettes.
export default function OwnerPagesScreen({ navigation, houseId, pages, setPages, onShowGuest }) {
  const [modeError, setModeError] = useState('');
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
    updatePage(houseId, pageId, { active: !page.active }).catch((error) =>
      console.log('Kunne ikke gemme i Firestore:', error.message)
    );
  }

  // Spørger først, om udlejeren er sikker – sletning kan ikke fortrydes.
  // Alert.alert viser iOS' egen dialog med to knapper.
  function confirmDelete(page) {
    Alert.alert('Slet kategori', 'Vil du slette "' + page.title + '"? Det kan ikke fortrydes.', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Slet', style: 'destructive', onPress: () => removePage(page.id) },
    ]);
  }

  function removePage(pageId) {
    // filter() beholder alle sider undtagen den slettede
    setPages(pages.filter((p) => p.id !== pageId));
    deletePage(houseId, pageId).catch((error) =>
      console.log('Kunne ikke slette i Firestore:', error.message)
    );
  }

  return (
    <View style={GlobalStyle.ownerListContainer}>
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GlobalStyle.ownerList}
        ListHeaderComponent={
          <View>
            <Pressable accessibilityRole="button" accessibilityLabel="Åbn gæstevisning"
              style={({ pressed }) => [GlobalStyle.ownerRow, pressed && GlobalStyle.ownerRowPressed]}
              onPress={() => onShowGuest().catch(() => setModeError('Gæstevisning kunne ikke åbnes. Prøv igen.'))}>
              <Ionicons name="eye-outline" size={28} color={GlobalStyle.colors.accent} />
              <View style={GlobalStyle.ownerRowText}><Text style={GlobalStyle.ownerRowTitle}>Gæstevisning</Text>
                <Text style={GlobalStyle.ownerRowStatus}>Vis guiden for gæsterne og lås redigering</Text></View>
              <Ionicons name="chevron-forward" size={24} color={GlobalStyle.colors.textMuted} />
            </Pressable>
            {!!modeError && <Text style={GlobalStyle.ownerError}>{modeError}</Text>}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Åbn AI quick-setup"
              style={({ pressed }) => [GlobalStyle.setupEntry, pressed && GlobalStyle.ownerRowPressed]}
              onPress={() => navigation.navigate('QuickSetup')}
            >
              <View style={GlobalStyle.setupEntryIcon}><Ionicons name="sparkles-outline" size={32} color={GlobalStyle.colors.accent} /></View>
              <View style={GlobalStyle.ownerRowText}>
                <Text style={GlobalStyle.ownerRowTitle}>AI quick-setup</Text>
                <Text style={GlobalStyle.ownerRowStatus}>Fortæl om dit sommerhus med tekst eller tale. Vi hjælper dig med resten.</Text>
              </View>
              <Ionicons name="arrow-forward-outline" size={28} color={GlobalStyle.colors.accent} />
            </Pressable>
            {/* Husinfo: baggrund, navn, velkomst, wifi og kontakt på forsiden */}
            <Pressable
              style={({ pressed }) => [GlobalStyle.ownerRow, pressed && GlobalStyle.ownerRowPressed]}
              onPress={() => navigation.navigate('EditHouse')}
            >
              <Ionicons name="home-outline" size={28} color={GlobalStyle.colors.accent} />
              <View style={GlobalStyle.ownerRowText}>
                <Text style={GlobalStyle.ownerRowTitle}>Husinfo</Text>
                <Text style={GlobalStyle.ownerRowStatus}>Baggrund, navn, velkomst, wifi og kontakt</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={GlobalStyle.colors.textMuted} />
            </Pressable>

            <Text style={GlobalStyle.ownerListHint}>
              Slå sider til eller fra med kontakten. Tryk på en side for at redigere tekst og billeder.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {/* Opret en ny kategori ud over standardkategorierne */}
            <Pressable
              style={({ pressed }) => [GlobalStyle.ownerRow, GlobalStyle.ownerRowAdd, pressed && GlobalStyle.ownerRowPressed]}
              onPress={() => navigation.navigate('NewPage')}
            >
              <Ionicons name="add-circle-outline" size={28} color={GlobalStyle.colors.accent} />
              <View style={GlobalStyle.ownerRowText}>
                <Text style={GlobalStyle.ownerRowTitle}>Ny kategori</Text>
                <Text style={GlobalStyle.ownerRowStatus}>Fx cykler, pool eller husdyr</Text>
              </View>
            </Pressable>

            {/* Log ud: App.js opdager det via onAuthStateChanged og viser login-skærmen igen */}
            <View style={GlobalStyle.ownerLogoutRow}>
              <ButtonComponent
                title="Skift hus"
                type="secondary"
                width={200}
                height={56}
                onPress={() => navigation.navigate('Houses')}
              />
              <ButtonComponent title="Log ud" type="secondary" width={200} height={56} onPress={() => signOut(auth)} />
            </View>
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
            {/* Kun egne kategorier kan slettes – standardkategorierne kan kun slås fra */}
            {item.custom && (
              <Pressable
                style={({ pressed }) => [
                  GlobalStyle.ownerRowAction,
                  pressed && GlobalStyle.ownerRowActionPressed,
                ]}
                onPress={() => confirmDelete(item)}
              >
                <Ionicons name="trash-outline" size={24} color={GlobalStyle.colors.accent} />
              </Pressable>
            )}
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
