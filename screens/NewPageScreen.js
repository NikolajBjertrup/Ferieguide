import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import IconPickerComponent from '../components/IconPickerComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { ICONS } from '../data/const';
import { createPage } from '../database/database';

// Udlejer: opret en ny kategori med eget navn og ikon.
// Bagefter åbnes den direkte i EditPage, så udlejeren kan fylde indhold i.
export default function NewPageScreen({ navigation, houseId, pages, setPages }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    if (title.trim() === '') {
      setError('Giv kategorien et navn.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      // Den nye kategori lægges sidst: én højere end den højeste order i huset.
      // Math.max(...) finder det største tal i listen (-1 hvis huset ingen sider har).
      const highestOrder = Math.max(-1, ...pages.map((p) => p.order));
      const newPage = await createPage(houseId, title, icon, highestOrder + 1);

      setPages([...pages, newPage]);
      // replace: "tilbage" fra redigering går til listen, ikke til denne skærm
      navigation.replace('EditPage', { pageId: newPage.id });
    } catch (e) {
      setError('Kunne ikke oprette kategorien: ' + e.message);
      setCreating(false);
    }
  }

  return (
    <View style={GlobalStyle.ownerListContainer}>
      <ScrollView
        contentContainerStyle={GlobalStyle.editScroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={GlobalStyle.editCard}>
          <View style={GlobalStyle.editHeader}>
            <Ionicons name={icon} size={28} color={GlobalStyle.colors.accent} />
            <Text style={GlobalStyle.editHeaderText}>{title.trim() === '' ? 'Ny kategori' : title}</Text>
          </View>

          <TextInputComponent label="Navn" hint="Fx Cykler, Pool eller Husdyr" value={title} onChangeText={setTitle} />
          <IconPickerComponent label="Ikon" value={icon} onChange={setIcon} />

          <Text style={GlobalStyle.ownerListHint}>
            Kategorien starter skjult for gæsten. Slå den til i listen, når den er udfyldt.
          </Text>
          {error !== '' && <Text style={GlobalStyle.ownerError}>{error}</Text>}

          <View style={GlobalStyle.editButtons}>
            <ButtonComponent
              title="Annuller"
              type="secondary"
              width={160}
              height={56}
              onPress={() => navigation.goBack()}
            />
            <ButtonComponent
              title={creating ? 'Opretter …' : 'Opret'}
              type="primary"
              width={160}
              height={56}
              onPress={create}
            />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}
