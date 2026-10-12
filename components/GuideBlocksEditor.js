import { View, Text, TextInput, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextInputComponent from './TextInputComponent';
import ButtonComponent from './ButtonComponent';
import { GlobalStyle as S } from '../styles/GlobalStyle';
import { newBlockId } from '../database/database';

// Quick-setup bruger samme tekst-/billedblokke som den manuelle sideeditor.
export default function GuideBlocksEditor({ blocks, onChange, disabled = false }) {
  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  let textNumber = 0;
  return <View style={S.setupBlockEditor}>
    <Text style={S.setupMuted}>Hvert afsnit har en overskrift, som gæsten også ser. Brug pilene til at placere billeder mellem afsnittene.</Text>
    {blocks.map((block, index) => {
      const label = block.type === 'text' ? `Tekst ${++textNumber}` : `Billede ${index + 1}`;
      return <View key={block.id} style={S.blockRow}>
        <View style={S.blockContent}>
          {block.type === 'text' ? <>
            <TextInput accessibilityLabel={`Overskrift til ${label.toLowerCase()}`} style={S.blockTitleInput} value={block.title || ''} editable={!disabled} maxLength={60}
              placeholder="Overskrift, fx Gaskomfur" placeholderTextColor={S.colors.textMuted}
              onChangeText={(title) => onChange(blocks.map((item) => item.id === block.id ? { ...item, title } : item))} />
            <TextInputComponent accessibilityLabel={label} value={block.text} hint="Skriv et afsnit til gæsterne" multiline editable={!disabled} maxLength={16000}
            onChangeText={(text) => onChange(blocks.map((item) => item.id === block.id ? { ...item, text } : item))} /></> :
            <Image source={{ uri: block.url }} style={S.blockImage} accessibilityLabel={label} />}
        </View>
        <View style={S.blockControls}>
          {[{ icon: 'chevron-up', title: `Flyt ${label.toLowerCase()} op`, inactive: index === 0, action: () => move(index, -1) },
            { icon: 'chevron-down', title: `Flyt ${label.toLowerCase()} ned`, inactive: index === blocks.length - 1, action: () => move(index, 1) },
            { icon: 'close', title: `Fjern ${label.toLowerCase()}`, action: () => onChange(blocks.filter((item) => item.id !== block.id)) }].map((action) =>
            <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={action.title} disabled={disabled || action.inactive}
              accessibilityState={{ disabled: !!(disabled || action.inactive) }} onPress={action.action}
              style={({ pressed }) => [S.blockIconButton, pressed && S.blockIconButtonPressed, (disabled || action.inactive) && S.setupDisabled]}>
              <Ionicons name={action.icon} size={24} color={S.colors.accent} />
            </Pressable>)}
        </View>
      </View>;
    })}
    <ButtonComponent title="+ Tekstblok" type="secondary" height={56} width={190} disabled={disabled}
      onPress={() => onChange([...blocks, { id: newBlockId(), type: 'text', text: '' }])} />
  </View>;
}
