import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  setAudioModeAsync,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import { TranscribeAudio, RewriteToGuideText } from '../services/Request';
import { GlobalStyle } from '../styles/GlobalStyle';
import { updatePage } from '../database/database';

// Gør millisekunder til fx "0:07"
function formatTid(millis) {
  const sekunder = Math.floor((millis || 0) / 1000);
  const minutter = Math.floor(sekunder / 60);
  const rest = sekunder % 60;
  return minutter + ':' + String(rest).padStart(2, '0');
}

// Udlejer: lynopsætning af én kategori. Udlejeren indtaler en talebesked,
// Whisper laver den til tekst, og modellen skriver den om til guidetekst.
export default function QuickSetupScreen({ navigation, route, pages, setPages }) {
  const { pageId } = route.params;
  const page = pages.find((p) => p.id === pageId);

  // Optageren lever i en hook, så den ryddes op af sig selv, når skærmen lukkes.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Spørger optageren hvert 250 ms, så vi kan vise en tæller der løber.
  const recorderState = useAudioRecorderState(recorder, 250);

  // status styrer hvad skærmen viser:
  // 'klar' = før optagelse, 'optager', 'arbejder' = venter på OpenAI, 'forslag' = tekst klar
  const [status, setStatus] = useState('klar');
  const [spokenText, setSpokenText] = useState('');   // det Whisper hørte
  const [suggestion, setSuggestion] = useState('');   // den færdige guidetekst
  const [error, setError] = useState('');

  async function startOptagelse() {
    setError('');
    try {
      // iOS skal have lov til at bruge mikrofonen, før vi må optage
      const tilladelse = await AudioModule.requestRecordingPermissionsAsync();
      if (!tilladelse.granted) {
        setError('Appen må ikke bruge mikrofonen. Giv adgang i Indstillinger.');
        return;
      }
      // Sæt lydsessionen op til optagelse
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('optager');
    } catch (e) {
      setError('Kunne ikke starte optagelsen: ' + e.message);
    }
  }

  async function stopOgSend() {
    setStatus('arbejder');
    setError('');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('Der blev ikke gemt nogen optagelse.');

      // To kald til OpenAI: først lyd -> tekst, så tekst -> pæn tekst
      const raaTekst = await TranscribeAudio(uri);
      if (!raaTekst || raaTekst.trim().length === 0) {
        throw new Error('Der blev ikke hørt noget tale i optagelsen.');
      }
      setSpokenText(raaTekst.trim());

      const pænTekst = await RewriteToGuideText(page.title, raaTekst);
      setSuggestion(pænTekst);
      setStatus('forslag');
    } catch (e) {
      setError(e.message);
      setStatus('klar');
    }
  }

  // Gem forslaget som sidens brødtekst og gå tilbage til listen
  function gem() {
    setPages(pages.map((p) => (p.id === pageId ? { ...p, body: suggestion } : p)));
    // Gem også i Firestore
    updatePage(pageId, { body: suggestion }).catch((error) =>
      console.log('Kunne ikke gemme i Firestore:', error.message)
    );
    navigation.goBack();
  }

  function optagForfra() {
    setSpokenText('');
    setSuggestion('');
    setError('');
    setStatus('klar');
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

          {/* Trin 1-2: optag og send */}
          {status !== 'forslag' && (
            <View style={GlobalStyle.quickRecordArea}>
              <Text style={GlobalStyle.quickHint}>
                Tryk på mikrofonen og fortæl frit om {page.title.toLowerCase()}, som om du
                stod med gæsten. Du behøver ikke tale pænt – teksten bliver skrevet om bagefter.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  GlobalStyle.quickMicButton,
                  status === 'optager' && GlobalStyle.quickMicButtonActive,
                  pressed && GlobalStyle.quickMicButtonPressed,
                ]}
                onPress={status === 'optager' ? stopOgSend : startOptagelse}
                disabled={status === 'arbejder'}
              >
                {status === 'arbejder' ? (
                  <ActivityIndicator size="large" color={GlobalStyle.colors.surface} />
                ) : (
                  <Ionicons
                    name={status === 'optager' ? 'stop' : 'mic'}
                    size={56}
                    color={GlobalStyle.colors.surface}
                  />
                )}
              </Pressable>

              <Text style={GlobalStyle.quickStatusText}>
                {status === 'klar' && 'Klar til at optage'}
                {status === 'optager' && 'Optager ' + formatTid(recorderState.durationMillis) + ' – tryk for at stoppe'}
                {status === 'arbejder' && 'Lytter og skriver teksten …'}
              </Text>
            </View>
          )}

          {/* Trin 3: forslaget, som udlejeren kan rette i */}
          {status === 'forslag' && (
            <View>
              <Text style={GlobalStyle.quickHint}>
                Her er forslaget. Ret det, hvis noget mangler, og tryk Gem.
              </Text>

              <TextInputComponent
                label="Forslag til brødtekst"
                hint="Teksten gæsten kommer til at læse"
                value={suggestion}
                onChangeText={setSuggestion}
                multiline={true}
              />

              <Text style={GlobalStyle.quickSpokenLabel}>Det du sagde:</Text>
              <Text style={GlobalStyle.quickSpokenText}>{spokenText}</Text>
            </View>
          )}

          {error.length > 0 && <Text style={GlobalStyle.ownerError}>{error}</Text>}

          <View style={GlobalStyle.editButtons}>
            {status === 'forslag' ? (
              <>
                <ButtonComponent
                  title="Optag igen"
                  type="secondary"
                  width={160}
                  height={56}
                  onPress={optagForfra}
                />
                <ButtonComponent title="Gem" type="primary" width={160} height={56} onPress={gem} />
              </>
            ) : (
              <ButtonComponent
                title="Annuller"
                type="secondary"
                width={160}
                height={56}
                onPress={() => navigation.goBack()}
              />
            )}
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}
