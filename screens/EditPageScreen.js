import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';

// Udlejer: rediger titel og brødtekst på én side
export default function EditPageScreen({ navigation, route, pages, setPages }) {
  const { pageId } = route.params;
  const page = pages.find((p) => p.id === pageId);

  // Kladde: vi redigerer lokale kopier og skriver først til den globale
  // state, når brugeren trykker "Gem". Annuller efterlader alt uændret.
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);

  function save() {
    setPages(
      pages.map((p) => (p.id === pageId ? { ...p, title: title, body: body } : p))
    );
    navigation.goBack();
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
            <Ionicons name={page.icon} size={28} color={GlobalStyle.colors.accent} />
            <Text style={GlobalStyle.editHeaderText}>{page.title}</Text>
          </View>

          <TextInputComponent
            label="Titel"
            hint="Sidens titel"
            value={title}
            onChangeText={setTitle}
          />

          <TextInputComponent
            label="Brødtekst"
            hint="Det gæsten skal vide om emnet"
            value={body}
            onChangeText={setBody}
            multiline={true}
          />

          <View style={GlobalStyle.editButtons}>
            <ButtonComponent
              title="Annuller"
              type="secondary"
              width={160}
              height={56}
              onPress={() => navigation.goBack()}
            />
            <ButtonComponent title="Gem" type="primary" width={160} height={56} onPress={save} />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}
