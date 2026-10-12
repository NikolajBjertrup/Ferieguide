import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { auth, getHouses, createHouse } from '../database/database';

// Udlejer: vælg hvilket af sine huse denne enhed skal vise – eller opret et nyt.
// `houseId` er det hus, enheden viser nu (null hvis intet er valgt).
// `selectHouse` kommer fra App.js og gemmer valget på enheden.
export default function HousesScreen({ navigation, houseId, selectHouse }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Hent udlejerens huse, når skærmen åbnes
  useEffect(() => {
    getHouses()
      .then((result) => setHouses(result))
      .catch((e) => setError('Kunne ikke hente husene: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  function choose(id) {
    selectHouse(id);
    // Valg af et nyt hus genstarter navigationen på udlejerskærmen i App.js.
    // Ved valg af samme hus går vi tilbage til udlejerskærmen.
    if (navigation.canGoBack()) {
      navigation.popToTop();
    }
  }

  async function create() {
    if (newName.trim() === '') {
      setError('Giv huset et navn.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const id = await createHouse(newName);
      choose(id); // Et nyt hus vælges med det samme
    } catch (e) {
      setError('Kunne ikke oprette huset: ' + e.message);
      setCreating(false);
    }
  }

  return (
    <View style={GlobalStyle.ownerListContainer}>
      <FlatList
        data={houses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={GlobalStyle.ownerList}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        ListHeaderComponent={
          <Text style={GlobalStyle.ownerListHint}>
            Vælg det hus, denne enhed skal vise for gæsterne. Valget huskes på enheden.
          </Text>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={GlobalStyle.colors.accent} />
          ) : (
            <Text style={GlobalStyle.ownerListHint}>Du har ingen huse endnu. Opret dit første nedenfor.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [GlobalStyle.ownerRow, pressed && GlobalStyle.ownerRowPressed]}
            onPress={() => choose(item.id)}
          >
            <Ionicons name="home-outline" size={28} color={GlobalStyle.colors.accent} />
            <View style={GlobalStyle.ownerRowText}>
              <Text style={GlobalStyle.ownerRowTitle}>{item.name}</Text>
              {/* Markér det hus, enheden viser lige nu */}
              {item.id === houseId && <Text style={GlobalStyle.ownerRowStatus}>Vises på denne enhed</Text>}
            </View>
            <Ionicons name="chevron-forward" size={24} color={GlobalStyle.colors.textMuted} />
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <View style={GlobalStyle.houseCreateCard}>
              <TextInputComponent
                label="Nyt hus"
                hint="Fx Sommerhus Klitvej 12"
                value={newName}
                onChangeText={setNewName}
              />
              {error !== '' && <Text style={GlobalStyle.ownerError}>{error}</Text>}
              <ButtonComponent
                title={creating ? 'Opretter …' : 'Opret hus'}
                type="primary"
                width={200}
                height={56}
                onPress={create}
              />
            </View>

            <View style={GlobalStyle.ownerLogoutRow}>
              <ButtonComponent title="Log ud" type="secondary" width={200} height={56} onPress={() => signOut(auth)} />
            </View>
          </View>
        }
      />
      <StatusBar style="dark" />
    </View>
  );
}
