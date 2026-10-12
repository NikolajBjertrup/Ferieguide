import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, AppState, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioRecorderState, setAudioModeAsync, AudioModule, RecordingPresets } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import GuideBlocksEditor from '../components/GuideBlocksEditor';
import { ContinueQuickSetup, TranscribeAudio } from '../services/Request';
import useQuickSetupDraft from '../services/useQuickSetupDraft';
import { advanceTopic, applyAssistantResult, makeSession, MAX_ANSWER_LENGTH, MAX_CATEGORIES, MAX_TURNS, setupPages, setupTopics, withBlocks } from '../services/quickSetup';
import { HOUSE_FIELDS, HOUSE_TOPIC_ID, SETUP_STEPS } from '../data/quickSetup';
import { GlobalStyle as S } from '../styles/GlobalStyle';
import { newBlockId, publishQuickSetup, uploadImage } from '../database/database';

const FIELD_LABELS = { name: 'Husets navn', welcome: 'Velkomst til gæsterne', wifiName: 'Wifi-navn', wifiPassword: 'Wifi-adgangskode', ownerName: 'Kontaktperson', ownerPhone: 'Telefonnummer' };

function SmallButton({ title, icon, onPress, disabled, active = false, label }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label || title} accessibilityState={{ disabled: !!disabled, selected: active }}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [S.setupSmallButton, active && S.setupSmallButtonActive, pressed && S.setupPressed, disabled && S.setupDisabled]}>
      {icon && <Ionicons name={icon} size={21} color={S.colors.accent} />}
      <Text style={S.setupSmallButtonText}>{title}</Text>
    </Pressable>
  );
}

export default function QuickSetupScreen({ navigation, houseId, setPages, setHouse }) {
  const { draft, setDraft, flush, load, loadError, saveError, saveStatus, completed } = useQuickSetupDraft(houseId);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [recording, setRecording] = useState(false);
  const [failedRecording, setFailedRecording] = useState(null);
  const [transitionNotice, setTransitionNotice] = useState('');
  const [success, setSuccess] = useState(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  const allowLeave = useRef(false);
  const requestController = useRef(null);
  const chatScroll = useRef(null);
  const outerScroll = useRef(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const topics = draft ? setupTopics(draft) : [];
  const topic = topics.find((item) => item.id === draft?.currentTopicId) || topics[0];
  const session = draft?.sessions[topic?.id];
  const editIndex = session?.editIndex ?? null;
  const locked = !!busy || recording;
  const categoryPages = draft ? setupPages(draft) : [];
  const publishable = categoryPages.filter((page) => page.publishable);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestController.current?.abort();
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, []);

  // Tilbage gemmer først kladden; en netværksfejl lader ejeren blive på skærmen.
  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (allowLeave.current || completed.current || !draft) return;
    event.preventDefault();
    if (lock.current || recording) { setError('Afslut optagelsen eller vent på den igangværende handling først.'); return; }
    lock.current = true;
    setBusy('Gemmer kladde …');
    flush().then(() => {
      allowLeave.current = true;
      navigation.dispatch(event.data.action);
    }).catch(() => {
      setError('Kladden kunne ikke gemmes. Kontrollér forbindelsen og prøv igen.');
    }).finally(() => { lock.current = false; if (mounted.current) setBusy(''); });
  }), [navigation, draft, recording, flush, completed]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false, headerBackVisible: false, headerLeft: () => null });
  }, [navigation, locked]);

  function changeSession(changes, id = topic.id) {
    setDraft((current) => ({ ...current, sessions: { ...current.sessions, [id]: { ...current.sessions[id], ...changes } } }));
  }

  function changeBlocks(id, blocks) {
    setDraft((current) => ({ ...current, sessions: { ...current.sessions, [id]: withBlocks(current.sessions[id], blocks) } }));
  }

  useEffect(() => { outerScroll.current?.scrollTo({ y: 0, animated: true }); }, [draft?.step, draft?.currentTopicId]);

  function changeStep(step) {
    if (locked) return;
    setError('');
    setDraft((current) => ({ ...current, step }));
  }

  function chooseTopic(id) {
    if (locked) return;
    setError(''); setTransitionNotice('');
    setDraft((current) => ({ ...current, currentTopicId: id, step: 1 }));
  }

  function toggleCategory(id) {
    if (draft.selectedIds.includes(id)) {
      setDraft({ ...draft, selectedIds: draft.selectedIds.filter((value) => value !== id) });
    } else if (draft.selectedIds.length >= MAX_CATEGORIES) {
      setError(`Vælg højst ${MAX_CATEGORIES} kategorier i én opsætning.`);
    } else {
      setError(''); setDraft({ ...draft, selectedIds: [...draft.selectedIds, id] });
    }
  }

  function addCategory() {
    const title = customTitle.trim();
    if (!title) return;
    if (draft.selectedIds.length >= MAX_CATEGORIES) { setError(`Vælg højst ${MAX_CATEGORIES} kategorier.`); return; }
    const existing = draft.categories.find((category) => category.title.toLocaleLowerCase('da') === title.toLocaleLowerCase('da'));
    if (existing) {
      if (!draft.selectedIds.includes(existing.id)) toggleCategory(existing.id);
    } else {
      const category = { id: `custom-${newBlockId()}`, title, icon: 'book-outline', custom: true };
      setDraft({ ...draft, categories: [...draft.categories, category], selectedIds: [...draft.selectedIds, category.id], sessions: { ...draft.sessions, [category.id]: makeSession(category) } });
    }
    setCustomTitle('');
  }

  // Tekst og tale bruger præcis samme afsendelse, også ved gentagelse efter netværksfejl.
  async function requestAnswer(source, topicId, text, finish = false) {
    const currentTopic = setupTopics(source).find((item) => item.id === topicId);
    const currentSession = source.sessions[topicId];
    const editingIndex = currentSession.editIndex ?? null;
    setBusy('Assistenten skriver …'); setError(''); setPendingMessage(text);
    const controller = new AbortController();
    requestController.current = controller;
    const messages = [...(editingIndex === null ? currentSession.messages : currentSession.messages.slice(0, editingIndex)), { role: 'user', content: text }];
    const editing = editingIndex !== null;
    const result = await ContinueQuickSetup({
      topic: currentTopic, session: editing ? { ...currentSession, guideText: currentSession.initialGuideText || '' } : currentSession,
      houseInfo: editing && topicId === HOUSE_TOPIC_ID ? (source.initialHouseInfo || source.baseHouse) : source.houseInfo,
      messages, finish: finish || messages.filter((message) => message.role === 'user').length >= MAX_TURNS,
      signal: controller.signal,
    });
    if (!mounted.current) return;
    setDraft((current) => {
      const next = applyAssistantResult(current, topicId, messages, result);
      return result.complete ? advanceTopic(next, topicId) : next;
    });
    if (result.complete) setTransitionNotice(`${currentTopic.title} er gennemgået. Tekstforslaget er opdateret i kladden.`);
  }

  async function sendAnswer({ skip = false, finish = false } = {}) {
    if (lock.current || recording) return;
    if (!skip && !finish && session.input.length > MAX_ANSWER_LENGTH) return;
    if (!skip && !finish && editIndex === null && session.messages.filter((message) => message.role === 'user').length >= MAX_TURNS) return;
    const text = skip ? 'Jeg springer dette spørgsmål over. Gå videre uden at gætte svaret.' : finish ? 'Afslut emnet med de oplysninger, du har.' : session.input.trim();
    if (!text) return;
    lock.current = true;
    try {
      await requestAnswer(draft, topic.id, text, finish);
    } catch (e) { if (mounted.current) setError(e.message); }
    finally {
      lock.current = false;
      if (mounted.current) { setBusy(''); setPendingMessage(''); }
    }
  }

  function nextTopic() {
    setError('');
    setDraft((current) => advanceTopic({ ...current,
      sessions: { ...current.sessions, [topic.id]: { ...current.sessions[topic.id], complete: true, editIndex: null } },
    }, topic.id));
  }

  async function startRecording() {
    if (lock.current || recording) return;
    lock.current = true; setBusy('Åbner mikrofon …'); setError(''); setFailedRecording(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('Mikrofonen er ikke tilladt. Giv adgang i Indstillinger, eller skriv dit svar.');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (e) {
      setError(e.message);
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    } finally { lock.current = false; setBusy(''); }
  }

  async function stopRecording(retryUri = null) {
    if (lock.current || (!recording && !retryUri)) return;
    lock.current = true; setBusy('Omsætter tale til tekst …'); setError('');
    const id = topic.id;
    try {
      let uri = retryUri;
      if (!uri) {
        await recorder.stop();
        setRecording(false);
        // Hent den færdige fil før lydsessionen ændres. Oprydning må ikke blokere transskription.
        uri = recorder.uri || recorder.getStatus?.().url;
      }
      if (!uri) throw new Error('Optagelsen blev ikke gemt. Prøv igen.');
      setFailedRecording({ uri, topicId: id });
      const controller = new AbortController();
      requestController.current = controller;
      const text = await TranscribeAudio(uri, controller.signal);
      if (mounted.current) {
        setFailedRecording(null);
        const input = [session.input, text].filter(Boolean).join('\n');
        const source = { ...draft, sessions: { ...draft.sessions, [id]: { ...session, input } } };
        setDraft(source); // Bevar hele talesvaret, også hvis det efterfølgende AI-kald fejler.
        if (input.length > MAX_ANSWER_LENGTH) throw new Error(`Talesvaret er klar i skrivefeltet, men er for langt. Forkort det til ${MAX_ANSWER_LENGTH} tegn og tryk Send svar.`);
        await requestAnswer(source, id, input);
      }
    } catch (e) { if (mounted.current) setError(e.message); }
    finally {
      lock.current = false;
      if (mounted.current) { setRecording(false); setBusy(''); setPendingMessage(''); }
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  }

  // Begræns optagelser til to minutter og stop også, når appen går i baggrunden.
  useEffect(() => {
    if (recording && recorderState.durationMillis >= 120000) stopRecording();
  }, [recording, recorderState.durationMillis]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active' && recording) stopRecording(); });
    return () => subscription.remove();
  }, [recording]);

  async function addImages(page, camera = false) {
    if (lock.current) return;
    lock.current = true; setBusy(camera ? 'Åbner kamera …' : 'Åbner billeder …'); setError('');
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Kameraet er ikke tilladt. Giv adgang i Indstillinger, eller vælg billeder fra galleriet.');
      }
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 }) :
        await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsMultipleSelection: true, selectionLimit: Math.max(1, 12 - page.images.length) });
      if (result.canceled) return;
      for (const [index, asset] of result.assets.slice(0, 12 - page.images.length).entries()) {
        if (asset.fileSize > 9 * 1024 * 1024) throw new Error('Et billede er for stort. Vælg et billede under 9 MB.');
        setBusy(`Uploader billede ${index + 1} af ${result.assets.length} …`);
        const url = await uploadImage(houseId, page.id, asset.uri);
        if (!mounted.current) return;
        // Gem hvert færdigt upload, så en senere fejl ikke mister de første billeder.
        setDraft((current) => ({ ...current, sessions: { ...current.sessions, [page.id]: withBlocks(current.sessions[page.id],
          [...current.sessions[page.id].blocks, { id: newBlockId(), type: 'image', url }]) } }));
      }
    } catch (e) { setError('Billedet kunne ikke tilføjes. ' + e.message); }
    finally { lock.current = false; if (mounted.current) setBusy(''); }
  }

  async function publish() {
    if (lock.current) return;
    lock.current = true; setBusy('Opretter guiden …'); setError('');
    try {
      await flush();
      const result = await publishQuickSetup(houseId, draft);
      completed.current = true;
      setHouse(result.house);
      setPages((current) => {
        const updatedIds = result.pages.map((page) => page.id);
        return [...current.filter((page) => !updatedIds.includes(page.id)), ...result.pages].sort((a, b) => a.order - b.order);
      });
      setSuccess(result.pages.length);
    } catch (e) { setError('Guiden blev ikke publiceret. ' + e.message); }
    finally { lock.current = false; if (mounted.current) setBusy(''); }
  }

  function renderHouseFields() {
    return HOUSE_FIELDS.map((key) => (
      <TextInputComponent key={key} label={FIELD_LABELS[key]} hint={key === 'name' ? 'Sommerhusets navn' : 'Valgfrit'}
        value={draft.houseInfo[key]} multiline={key === 'welcome'} maxLength={key === 'welcome' ? 4000 : 300}
        autoCapitalize={key.startsWith('wifi') ? 'none' : 'sentences'}
        keyboardType={key === 'ownerPhone' ? 'phone-pad' : 'default'} editable={!locked}
        onChangeText={(text) => setDraft((current) => ({ ...current, houseInfo: { ...current.houseInfo, [key]: text } }))} />
    ));
  }

  if (success !== null) return (
    <View style={S.setupSuccess}>
      <Ionicons name="checkmark-circle-outline" size={72} color={S.colors.accent} />
      <Text style={S.setupTitle}>Sommerhuset er klar</Text>
      <Text style={S.setupLead}>Husinfo og {success} {success === 1 ? 'kategori er gemt' : 'kategorier er gemt'}. Gæsterne kan nu se den godkendte guide.</Text>
      <ButtonComponent title="Se guiden" type="primary" height={60} width={240} onPress={() => navigation.replace('Guide')} />
      <SmallButton title="Tilbage til redigering" onPress={() => navigation.goBack()} />
    </View>
  );

  if (!draft) return (
    <View style={S.setupSuccess}>
      {loadError ? <><Text style={S.ownerError}>{loadError}</Text><SmallButton title="Prøv igen" onPress={() => load()} />
        {!restartConfirm ? <SmallButton title="Start en ny opsætning" onPress={() => setRestartConfirm(true)} /> : <><Text style={S.setupMuted}>Erstat den gemte kladde? Din publicerede guide bevares.</Text><SmallButton title="Erstat kladden" onPress={() => { load(true); setRestartConfirm(false); }} /></>}
        <SmallButton title="Tilbage" onPress={() => navigation.goBack()} /></> : <><ActivityIndicator color={S.colors.accent} /><Text style={S.setupMuted}>Henter din opsætning …</Text></>}
    </View>
  );

  const answers = session.messages.filter((message) => message.role === 'user').length;
  const inputTooLong = session.input.length > MAX_ANSWER_LENGTH;
  const hasUnsent = topics.some((item) => draft.sessions[item.id].input.trim());
  const seconds = Math.floor((recorderState.durationMillis || 0) / 1000);

  return (
    <KeyboardAvoidingView style={S.setupRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={outerScroll} keyboardShouldPersistTaps="handled" contentContainerStyle={S.setupScroll}>
        <View style={S.setupShell}>
          <View style={S.setupTopRow}>
            <View style={S.setupGrow}>
              <Text style={S.setupEyebrow}>DIN DIGITALE HUSGUIDE</Text>
              <Text style={S.setupTitle}>Lad os sætte sommerhuset op</Text>
              <Text style={S.setupMuted}>{saveStatus === 'saved' ? 'Kladde gemt — du kan fortsætte senere' : saveStatus === 'error' ? 'Kladden er ikke gemt' : 'Gemmer kladde …'}</Text>
            </View>
            <SmallButton title="Gem og luk" icon="pause-outline" disabled={locked} onPress={() => navigation.goBack()} />
          </View>

          <View style={S.setupSteps}>
            {SETUP_STEPS.map((label, index) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: draft.step === index, disabled: locked || index > draft.step }}
              disabled={locked || index > draft.step} onPress={() => changeStep(index)} style={[S.setupStep, draft.step === index && S.setupStepActive]}>
              <Text style={S.setupStepNumber}>{index + 1}</Text><Text style={S.setupStepText}>{label}</Text>
            </Pressable>)}
          </View>

          {(error || loadError || saveError) ? <View style={S.setupError} accessibilityLiveRegion="polite">
            <Text style={S.ownerError}>{error || loadError || `Kladden kunne ikke gemmes. ${saveError}`}</Text>
            {saveStatus === 'error' && <SmallButton title="Gem kladde igen" disabled={locked} onPress={() => flush().catch(() => {})} />}
          </View> : null}

          {!!busy && <View style={S.setupBusy} accessibilityLiveRegion="polite"><ActivityIndicator color={S.colors.accent} /><Text style={S.setupBody}>{busy}</Text></View>}
          {!!transitionNotice && <View style={S.setupNotice} accessibilityLiveRegion="polite"><Text style={S.setupBody}>{transitionNotice}</Text></View>}

          {draft.step === 0 && <View style={S.setupCard}>
            <Text style={S.setupHeading}>Hvad skal gæsterne vide om?</Text>
            <Text style={S.setupLead}>Vælg kategorierne til dit sommerhus. Vi begynder med husets navn, velkomst, wifi og kontakt og tager derefter én kategori ad gangen.</Text>
            <View style={S.setupCategoryGrid}>
              {draft.categories.map((category) => {
                const selected = draft.selectedIds.includes(category.id);
                return <Pressable key={category.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={category.title}
                  disabled={locked} onPress={() => toggleCategory(category.id)} style={({ pressed }) => [S.setupCategory, selected && S.setupCategorySelected, pressed && S.setupPressed]}>
                  <Ionicons name={category.icon} size={27} color={S.colors.accent} /><Text style={S.setupCategoryText}>{category.title}</Text>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? S.colors.accent : S.colors.border} />
                </Pressable>;
              })}
            </View>
            <View style={S.setupInline}>
              <TextInput style={S.setupCustomInput} placeholder="Din egen kategori, fx pool eller cykler" placeholderTextColor={S.colors.textMuted}
                accessibilityLabel="Navn på egen kategori" value={customTitle} onChangeText={setCustomTitle} maxLength={60} editable={!locked} onSubmitEditing={addCategory} />
              <SmallButton title="Tilføj" icon="add-outline" disabled={locked || !customTitle.trim()} onPress={addCategory} />
            </View>
            <Text style={S.setupMuted}>{draft.selectedIds.length} kategorier valgt. Eksisterende sider uden for opsætningen bevares.</Text>
            <View style={S.setupActions}><ButtonComponent title="Start samtalen" type="primary" height={60} width={240} disabled={locked || !draft.selectedIds.length}
              onPress={() => { setDraft({ ...draft, step: 1, currentTopicId: HOUSE_TOPIC_ID }); setError(''); }} /></View>
          </View>}

          {draft.step === 1 && <View style={[S.setupColumns, !wide && S.setupColumnsStacked]}>
            <View style={[S.setupSidebar, !wide && S.setupSidebarCompact]}>
              <Text style={S.setupEyebrow}>DIN GENNEMGANG</Text>
              <Text style={S.setupMuted}>{topics.filter((item) => draft.sessions[item.id].complete).length} af {topics.length} emner gennemgået</Text>
              <View style={wide ? S.setupTopicList : S.setupTopicWrap}>
                {topics.map((item) => <SmallButton key={item.id} title={item.title} icon={draft.sessions[item.id].complete ? 'checkmark-circle-outline' : item.icon}
                  active={topic.id === item.id} disabled={locked} onPress={() => chooseTopic(item.id)} />)}
              </View>
            </View>
            <View style={S.setupChatColumn}>
              <View style={S.setupCard}>
                <Text style={S.setupHeading}>{topic.title}</Text>
                <Text style={S.setupMuted}>Skriv og send, eller indtal og tryk stop. Talesvaret sendes automatisk til samtalen.</Text>
                <ScrollView ref={chatScroll} style={S.setupChatHistory} nestedScrollEnabled keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() => chatScroll.current?.scrollToEnd({ animated: true })}>
                  {session.messages.map((message, index) => <View key={`${topic.id}-${index}`} style={[S.setupBubble, message.role === 'user' && S.setupUserBubble]}>
                    <Text style={S.setupBubbleLabel}>{message.role === 'user' ? 'DIG' : 'FERIEGUIDE ASSISTENT'}</Text>
                    <Text style={S.setupBody} selectable>{message.content}</Text>
                    {message.role === 'user' && <SmallButton title="Ret svar" disabled={locked} label={`Ret svar ${Math.ceil(index / 2)}`} onPress={() => changeSession({ input: message.content, editIndex: index })} />}
                  </View>)}
                  {!!pendingMessage && <View style={[S.setupBubble, S.setupUserBubble]}><Text style={S.setupBody}>{pendingMessage}</Text></View>}
                </ScrollView>
                {editIndex !== null && <View style={S.setupNotice}><Text style={S.setupMuted}>Du retter et tidligere svar. Senere svar i dette emne erstattes, og forslaget skrives på ny.</Text><SmallButton title="Annuller rettelse" disabled={locked} onPress={() => changeSession({ input: '', editIndex: null })} /></View>}
                {inputTooLong && <Text style={S.ownerError}>Dit svar er for langt. Del det op i svar på højst {MAX_ANSWER_LENGTH} tegn.</Text>}
                <TextInput style={S.setupComposer} accessibilityLabel="Dit svar til assistenten" placeholder="Fortæl med dine egne ord …" placeholderTextColor={S.colors.textMuted}
                  value={session.input} onChangeText={(input) => changeSession({ input })} multiline editable={!locked} />
                <View style={S.setupComposerActions}>
                  <SmallButton title={recording ? `Stop ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Indtal svar'} icon={recording ? 'stop-circle' : 'mic-outline'}
                    active={recording} disabled={!!busy || (answers >= MAX_TURNS && editIndex === null)} onPress={recording ? () => stopRecording() : startRecording} />
                  <ButtonComponent title={editIndex !== null ? 'Gem rettelse' : 'Send svar'} type="primary" height={60} width={180}
                    disabled={locked || !session.input.trim() || inputTooLong || (answers >= MAX_TURNS && editIndex === null)} onPress={() => sendAnswer()} />
                </View>
                {failedRecording?.topicId === topic.id && <SmallButton title="Prøv talesvaret igen" icon="refresh-outline" disabled={locked} onPress={() => stopRecording(failedRecording.uri)} />}
                <Text style={S.setupCaption}>Tale og svar behandles af OpenAI. Kun teksten gemmes i din kladde. Maks. 2 minutter pr. optagelse.</Text>
                <View style={S.setupActionWrap}>
                  {!session.complete && <SmallButton title="Spring spørgsmål over" disabled={locked || !!session.input.trim()} onPress={() => sendAnswer({ skip: true })} />}
                  {!session.complete && answers > 0 && <SmallButton title="Afslut med mine svar" disabled={locked || !!session.input.trim()} onPress={() => sendAnswer({ finish: true })} />}
                  <SmallButton title="Spring resten af emnet over"
                    icon="arrow-forward-outline" disabled={locked || !!session.input.trim() || editIndex !== null} onPress={nextTopic} />
                </View>
                {answers >= MAX_TURNS && <Text style={S.setupMuted}>Emnet er klar til gennemgang. Ret et tidligere svar eller tilpas forslaget nedenfor.</Text>}
              </View>
              <View style={S.setupCard}>
                <Text style={S.setupHeading}>Sådan ser gæsten det</Text>
                <Text style={S.setupMuted}>Et udkast, du kan tilpasse. Det bliver først synligt, når du godkender hele guiden.</Text>
                {topic.id === HOUSE_TOPIC_ID ? renderHouseFields() : <GuideBlocksEditor blocks={session.blocks} disabled={locked} onChange={(blocks) => changeBlocks(topic.id, blocks)} />}
              </View>
            </View>
          </View>}

          {draft.step === 2 && <View>
            <Text style={S.setupHeading}>Gør guiden nem at genkende</Text>
            <Text style={S.setupLead}>Tilføj billeder af fx betjeningspaneler, placeringer og udstyr. Billeder er valgfrie og bliver knyttet til den valgte kategori.</Text>
            {categoryPages.map((page) => <View key={page.id} style={S.setupCard}>
              <View style={S.setupTopRow}><Text style={S.setupHeading}>{page.title}</Text><Text style={S.setupMuted}>{page.images.length} / 12 billeder</Text></View>
              <GuideBlocksEditor blocks={page.blocks} disabled={locked} onChange={(blocks) => changeBlocks(page.id, blocks)} />
              <View style={S.setupActionWrap}><SmallButton title="Vælg billeder" icon="images-outline" disabled={locked || page.images.length >= 12} onPress={() => addImages(page)} />
                <SmallButton title="Tag billede" icon="camera-outline" disabled={locked || page.images.length >= 12} onPress={() => addImages(page, true)} /></View>
            </View>)}
            <View style={S.setupActions}><SmallButton title="Tilbage til samtalen" disabled={locked} onPress={() => changeStep(1)} />
              <ButtonComponent title="Gennemse guiden" type="primary" height={60} width={240} disabled={locked} onPress={() => changeStep(3)} /></View>
          </View>}

          {draft.step === 3 && <View>
            <Text style={S.setupHeading}>Et sidste kig, før gæsterne ser guiden</Text>
            <Text style={S.setupLead}>Kontrollér oplysningerne og ret det, der mangler. De {publishable.length} kategorier med indhold bliver synlige ved godkendelse.</Text>
            <View style={S.setupCard}><Text style={S.setupHeading}>Husinfo</Text>{renderHouseFields()}</View>
            {categoryPages.map((page) => <View key={page.id} style={S.setupCard}>
              <View style={S.setupTopRow}><View style={S.setupGrow}><Text style={S.setupHeading}>{page.title}</Text><Text style={S.setupMuted}>{page.publishable ? page.basePage ? 'Opdaterer den eksisterende side' : 'Opretter en ny side' : page.basePage ? 'Intet nyt indhold — eksisterende side bevares' : 'Ingen oplysninger — siden oprettes ikke'}</Text></View>
                <SmallButton title="Til samtalen" icon="chatbubble-outline" disabled={locked} onPress={() => chooseTopic(page.id)} /></View>
              <GuideBlocksEditor blocks={page.blocks} disabled={locked} onChange={(blocks) => changeBlocks(page.id, blocks)} />
            </View>)}
            {hasUnsent && <View style={S.setupNotice}><Text style={S.setupBody}>Der er et svar, som endnu ikke er sendt. Gå tilbage til samtalen og send eller fjern det før godkendelse.</Text></View>}
            <Text style={S.setupMuted}>Godkendelse erstatter tekster og billedvalg i de viste kategorier. Andre sider bevares. Du kan redigere alt bagefter.</Text>
            <View style={S.setupActions}><SmallButton title="Tilbage til billeder" disabled={locked} onPress={() => changeStep(2)} />
              <ButtonComponent title="Godkend og opret guide" type="primary" height={64} width={300} disabled={locked || !draft.houseInfo.name.trim() || hasUnsent} onPress={publish} /></View>
          </View>}

          <View style={S.setupFooter}>
            {!restartConfirm ? <SmallButton title="Start en ny opsætning" disabled={locked} onPress={() => setRestartConfirm(true)} /> : <View style={S.setupNotice}>
              <Text style={S.setupBody}>Vil du erstatte denne kladde med en ny opsætning? Din nuværende, publicerede guide bliver bevaret.</Text>
              <View style={S.setupActionWrap}><SmallButton title="Behold kladden" onPress={() => setRestartConfirm(false)} disabled={locked} />
                <SmallButton title="Erstat kladden" disabled={locked} onPress={async () => { setBusy('Henter en ny opsætning …'); lock.current = true; await load(true); setRestartConfirm(false); setError(''); lock.current = false; setBusy(''); }} /></View>
            </View>}
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
