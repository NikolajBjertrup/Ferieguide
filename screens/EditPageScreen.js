import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { GlobalStyle } from '../styles/GlobalStyle';
import { updatePage, newBlockId } from '../database/database';

// Udlejer: rediger titel og sidens blokke (tekst og billeder).
// Blokkene kan tilføjes, flyttes op/ned og slettes.
export default function EditPageScreen({ navigation, route, pages, setPages }) {
  const { pageId } = route.params;
  const page = pages.find((p) => p.id === pageId);

  // Kladde: vi redigerer lokale kopier og skriver først til den globale
  // state, når brugeren trykker "Gem". Annuller efterlader alt uændret.
  const [title, setTitle] = useState(page.title);
  const [blocks, setBlocks] = useState(page.blocks);

  // Tilføjer en tom tekstblok nederst
  function addTextBlock() {
    setBlocks([...blocks, { id: newBlockId(), type: 'text', text: '' }]);
  }

  // Opdaterer teksten i én blok. Som altid laver vi et nyt array i stedet
  // for at ændre det gamle direkte.
  function changeText(blockId, text) {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, text: text } : b)));
  }

  // Flytter blokken på plads `index` én plads op (-1) eller ned (+1)
  function moveBlock(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) {
      return; // Kan ikke flytte længere op/ned
    }
    const copy = [...blocks];
    // Byt de to blokke om
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setBlocks(copy);
  }

  // Fjerner en blok. filter() beholder alle blokke undtagen den valgte.
  function removeBlock(blockId) {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  }

  function save() {
    setPages(pages.map((p) => (p.id === pageId ? { ...p, title: title, blocks: blocks } : p)));
    // Gem også i Firestore, så ændringen er der næste gang appen åbnes
    updatePage(pageId, { title: title, blocks: blocks }).catch((error) =>
      console.log('Kunne ikke gemme i Firestore:', error.message)
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

          <Text style={GlobalStyle.inpLabel}>Indhold</Text>
          {blocks.length === 0 && (
            <Text style={GlobalStyle.blockEmpty}>Siden er tom. Tilføj en tekst nedenfor.</Text>
          )}

          {/* Én række pr. blok: indholdet til venstre, knapperne ▲ ▼ ✕ til højre */}
          {blocks.map((block, index) => (
            <View key={block.id} style={GlobalStyle.blockRow}>
              <View style={GlobalStyle.blockContent}>
                {block.type === 'text' ? (
                  <TextInputComponent
                    label="Tekst"
                    hint="Det gæsten skal vide"
                    value={block.text}
                    onChangeText={(text) => changeText(block.id, text)}
                    multiline={true}
                  />
                ) : (
                  <Image
                    source={{ uri: block.url }}
                    style={GlobalStyle.blockImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              <View style={GlobalStyle.blockControls}>
                <Pressable
                  onPress={() => moveBlock(index, -1)}
                  style={({ pressed }) => [GlobalStyle.blockIconButton, pressed && GlobalStyle.blockIconButtonPressed]}
                >
                  <Ionicons name="chevron-up" size={24} color={GlobalStyle.colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => moveBlock(index, 1)}
                  style={({ pressed }) => [GlobalStyle.blockIconButton, pressed && GlobalStyle.blockIconButtonPressed]}
                >
                  <Ionicons name="chevron-down" size={24} color={GlobalStyle.colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => removeBlock(block.id)}
                  style={({ pressed }) => [GlobalStyle.blockIconButton, pressed && GlobalStyle.blockIconButtonPressed]}
                >
                  <Ionicons name="close" size={24} color={GlobalStyle.colors.accent} />
                </Pressable>
              </View>
            </View>
          ))}

          <View style={GlobalStyle.blockAddRow}>
            <ButtonComponent title="+ Tekst" type="secondary" width={160} height={56} onPress={addTextBlock} />
          </View>

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
