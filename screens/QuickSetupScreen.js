import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView, Keyboard, Platform, AppState, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioRecorder, useAudioRecorderState, setAudioModeAsync, AudioModule, RecordingPresets } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';

import ButtonComponent from '../components/ButtonComponent';
import TextInputComponent from '../components/TextInputComponent';
import GuideBlocksEditor from '../components/GuideBlocksEditor';
import GuideAgentComponent, { GuideAgentIcon } from '../components/GuideAgentComponent';
import { ContinueQuickSetup, TranscribeAudio } from '../services/Request';
import useQuickSetupDraft from '../services/useQuickSetupDraft';
import { advanceTopic, applyAssistantResult, furthestStep, goToStep, groupCategories, hasWifi, makeSession, recommendedIds, toggleRecommended, MAX_ANSWER_LENGTH, MAX_CATEGORIES, MAX_TURNS, setupPages, setupStarted, setupTopics, toggleWifi, withBlocks } from '../services/quickSetup';
import { AGENT_NAME, HOUSE_FIELDS, HOUSE_INFO_TEXT, WIFI_FIELDS, WIFI_OPTION, HOUSE_TOPIC_ID, SETUP_FACTS, SETUP_INTRO, SETUP_STEPS } from '../data/quickSetup';
import { GlobalStyle as S } from '../styles/GlobalStyle';
import { newBlockId, publishQuickSetup, uploadImage } from '../database/database';

const SAVE_STATUS = {
  saved: { icon: 'cloud-done-outline', text: 'Kladde gemt' },
  error: { icon: 'cloud-offline-outline', text: 'Kladden er ikke gemt' },
};
const FIELD_LABELS = { name: 'Husets navn', welcome: 'Velkomst til gæsterne', wifiName: 'Wifi-navn', wifiPassword: 'Wifi-adgangskode', ownerName: 'Kontaktperson', ownerPhone: 'Telefonnummer' };

// `compact` er en lille pille-knap, fx hjælperens svarknap i taleboblen.
// Rund ikonknap til skrivefeltet i samtalen (mikrofon og send).
function RoundButton({ label, icon, onPress, disabled, filled = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [S.chatRound, filled && S.chatRoundFilled, pressed && S.setupDisabled, disabled && S.setupDisabled]}>
      <Ionicons name={icon} size={24} color={filled ? S.colors.surface : S.colors.accent} />
    </Pressable>
  );
}

function SmallButton({ title, icon, onPress, disabled, active = false, label, compact = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label || title} accessibilityState={{ disabled: !!disabled, selected: active }}
      disabled={disabled} onPress={onPress} hitSlop={compact ? 8 : 0}
      style={({ pressed }) => [S.setupSmallButton, compact && S.setupSmallButtonCompact, active && S.setupSmallButtonActive, pressed && S.setupPressed, disabled && S.setupDisabled]}>
      {icon && <Ionicons name={icon} size={compact ? 16 : 21} color={S.colors.accent} />}
      <Text style={[S.setupSmallButtonText, compact && S.setupSmallButtonTextCompact]}>{title}</Text>
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
  // Startsiden vises, hver gang opsætningen åbnes. Den er ikke en del af kladden.
  const [intro, setIntro] = useState(true);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // På telefon vises samtalen og udkastet til gæsten som to faner.
  const [chatView, setChatView] = useState('chat');
  const lock = useRef(false);
  const mounted = useRef(true);
  const allowLeave = useRef(false);
  const requestController = useRef(null);
  const chatScroll = useRef(null);
  const outerScroll = useRef(null);
  const shell = useRef(null);
  const customInput = useRef(null);
  const customFocused = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  // Grupperne står side om side på iPad og under hinanden på telefon, så titler ikke knækker.
  const groupColumns = wide ? S.setupCols4 : width >= 700 ? S.setupCols2 : S.setupCols1;
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

  // Topbjælken: tilbage ét trin til venstre og luk til højre. Luk gemmer kladden (se beforeRemove).
  const step = draft?.step;
  useEffect(() => {
    const goBackStep = () => {
      if (locked) return;
      setError(''); setTransitionNotice('');
      if (step > 0) setDraft((current) => goToStep(current, current.step - 1));
      else setIntro(true);
    };
    // Begge knapper er ens: et lille ikon uden baggrund, så de ikke fylder i topbjælken.
    const headerButton = (label, icon, onPress) => () => (
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: locked }} disabled={locked} hitSlop={12}
        onPress={onPress} style={({ pressed }) => [S.setupHeaderButton, (pressed || locked) && S.setupDisabled]}>
        <Ionicons name={icon} size={24} color={S.colors.text} />
      </Pressable>
    );
    navigation.setOptions({
      gestureEnabled: false, headerBackVisible: false,
      headerLeft: !intro && step !== undefined && success === null ? headerButton('Tilbage', 'chevron-back', goBackStep) : () => null,
      headerRight: success === null ? headerButton('Luk', 'close', () => navigation.goBack()) : () => null,
    });
  }, [navigation, locked, intro, step, success, setDraft]);

  // Rul feltet til egen kategori op over tastaturet. Måles i forhold til sidens indhold.
  function showCustomInput() {
    customInput.current?.measureLayout?.(shell.current, (x, y) => {
      outerScroll.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
    }, () => {});
  }

  // Den faste bundlinje skjules, mens tastaturet er fremme, så der er plads til at skrive.
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => { setKeyboardOpen(true); if (customFocused.current) showCustomInput(); });
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);

  function changeSession(changes, id = topic.id) {
    setDraft((current) => ({ ...current, sessions: { ...current.sessions, [id]: { ...current.sessions[id], ...changes } } }));
  }

  function changeBlocks(id, blocks) {
    setDraft((current) => ({ ...current, sessions: { ...current.sessions, [id]: withBlocks(current.sessions[id], blocks) } }));
  }

  useEffect(() => { outerScroll.current?.scrollTo({ y: 0, animated: true }); }, [draft?.step, draft?.currentTopicId, intro]);

  function changeStep(step) {
    if (locked) return;
    setError('');
    setDraft((current) => goToStep(current, step));
  }

  function chooseTopic(id) {
    if (locked) return;
    setError(''); setTransitionNotice('');
    setDraft((current) => goToStep({ ...current, currentTopicId: id }, 1));
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
    // Et tryk på knappen uden tekst åbner tastaturet i stedet for at gøre ingenting.
    if (!title) { customInput.current?.focus?.(); return; }
    if (draft.selectedIds.length >= MAX_CATEGORIES) { setError(`Vælg højst ${MAX_CATEGORIES} kategorier.`); return; }
    const existing = draft.categories.find((category) => category.title.toLocaleLowerCase('da') === title.toLocaleLowerCase('da'));
    if (existing) {
      if (!draft.selectedIds.includes(existing.id)) toggleCategory(existing.id);
    } else {
      const category = { id: `custom-${newBlockId()}`, title, icon: 'book-outline', custom: true };
      setDraft({ ...draft, categories: [...draft.categories, category], selectedIds: [...draft.selectedIds, category.id], sessions: { ...draft.sessions, [category.id]: makeSession(category) } });
    }
    setCustomTitle('');
    Keyboard.dismiss();
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

  async function restart() {
    if (lock.current) return;
    lock.current = true; setBusy('Henter en ny opsætning …');
    await load(true);
    lock.current = false;
    if (mounted.current) { setRestartConfirm(false); setError(''); setBusy(''); }
  }

  function renderRestartConfirm() {
    return (
      <View style={S.setupNotice}>
        <Text style={S.setupBody}>Vil du erstatte denne kladde med en ny opsætning? Din nuværende, publicerede guide bliver bevaret.</Text>
        <View style={S.setupActionWrap}><SmallButton title="Behold kladden" onPress={() => setRestartConfirm(false)} disabled={locked} />
          <SmallButton title="Erstat kladden" disabled={locked} onPress={restart} /></View>
      </View>
    );
  }

  // Ét kort i kategorivalget. Bruges både til kategorier og til wifi.
  function renderOption(option, selected, onPress) {
    return (
      <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={option.title}
        disabled={locked} onPress={onPress} style={({ pressed }) => [S.setupCategory, selected && S.setupCategorySelected, pressed && S.setupPressed]}>
        <Ionicons name={option.icon} size={26} color={S.colors.accent} /><Text style={S.setupCategoryText} numberOfLines={2}>{option.title}</Text>
        <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? S.colors.accent : S.colors.border} />
      </Pressable>
    );
  }

  function renderHouseFields() {
    return HOUSE_FIELDS.filter((key) => hasWifi(draft) || !WIFI_FIELDS.includes(key)).map((key) => (
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
  const started = setupStarted(draft);
  const allRecommended = recommendedIds(draft).every((id) => draft.selectedIds.includes(id));
  // Fejl og igangværende handling vises samme sted på startsiden og i trinnene.
  const errorNotice = (error || loadError || saveError) ? <View style={S.setupError} accessibilityLiveRegion="polite">
    <Text style={S.ownerError}>{error || loadError || `Kladden kunne ikke gemmes. ${saveError}`}</Text>
    {saveStatus === 'error' && <SmallButton title="Gem kladde igen" disabled={locked} onPress={() => flush().catch(() => {})} />}
  </View> : null;
  const notices = <>
    {errorNotice}
    {!!busy && <View style={S.setupBusy} accessibilityLiveRegion="polite"><ActivityIndicator color={S.colors.accent} /><Text style={S.setupBody}>{busy}</Text></View>}
  </>;

  const furthest = furthestStep(draft);
  const header = (
    <View style={S.setupHeader}>
      <View style={S.setupSteps}>
        {SETUP_STEPS.map((label, index) => {
          // Trin, udlejeren har været på før, kan vælges direkte – også fremad efter et hop tilbage.
          const reached = index <= furthest;
          const open = reached && (index === 0 || draft.selectedIds.length > 0);
          return <View key={label} style={S.setupStatus}>
            {wide && index > 0 && <View style={S.setupStepLine} />}
            <Pressable accessibilityRole="button" accessibilityLabel={`Trin ${index + 1}: ${label}`} accessibilityState={{ selected: draft.step === index, disabled: locked || !open }}
              disabled={locked || !open} onPress={() => changeStep(index)} style={[S.setupStep, draft.step === index && S.setupStepActive, width < 700 && draft.step !== index && S.setupStepCompact]}>
              <View style={[S.setupStepDot, reached && S.setupStepDotReached]}>
                {index !== draft.step && index < furthest ? <Ionicons name="checkmark" size={18} color={S.colors.surface} />
                  : <Text style={[S.setupStepNumber, reached && S.setupStepNumberReached]}>{index + 1}</Text>}
              </View>
              {(width >= 700 || draft.step === index) && <Text style={[S.setupStepText, reached && S.setupStepTextReached]}>{label}</Text>}
            </Pressable>
          </View>;
        })}
      </View>
      <View style={S.setupStatus} accessibilityLiveRegion="polite">
        <Ionicons name={(SAVE_STATUS[saveStatus] || { icon: 'cloud-upload-outline' }).icon} size={20} color={S.colors.textMuted} />
        <Text style={S.setupMuted}>{(SAVE_STATUS[saveStatus] || { text: 'Gemmer kladde …' }).text}</Text>
      </View>
    </View>
  );

  // Samtalen har sit eget layout: beskederne fylder skærmen, og skrivefeltet sidder fast i bunden.
  if (!intro && draft.step === 1) {
    const showChat = wide || chatView === 'chat';
    const showDraft = wide || chatView === 'draft';
    const turnsUsed = answers >= MAX_TURNS && editIndex === null;
    return (
      <KeyboardAvoidingView style={S.setupRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={S.chatTop}>
          {header}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={S.chatTopics}>
            {topics.map((item) => <SmallButton compact key={item.id} title={item.title} icon={draft.sessions[item.id].complete ? 'checkmark-circle' : item.icon}
              active={topic.id === item.id} disabled={locked} onPress={() => chooseTopic(item.id)} />)}
          </ScrollView>
          {!wide && <View style={S.chatTabs} accessibilityRole="tablist">
            {[['chat', 'Samtale'], ['draft', 'Udkast til gæsten']].map(([id, label]) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: chatView === id }}
              onPress={() => setChatView(id)} style={[S.chatTab, chatView === id && S.chatTabActive]}>
              <Text style={[S.chatTabText, chatView === id && S.chatTabTextActive]}>{label}</Text>
            </Pressable>)}
          </View>}
        </View>

        <View style={S.chatColumns}>
          {showChat && <ScrollView ref={chatScroll} style={S.chatColumn} contentContainerStyle={S.chatContent} keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => chatScroll.current?.scrollToEnd({ animated: true })}>
            <Text style={S.setupCaption}>Tale og svar behandles af OpenAI. Kun teksten gemmes i din kladde.</Text>
            {!!transitionNotice && <View style={S.setupNotice} accessibilityLiveRegion="polite"><Text style={S.setupMuted}>{transitionNotice}</Text></View>}
            {session.messages.map((message, index) => message.role === 'user' ? <View key={`${topic.id}-${index}`} style={S.chatRowUser}>
              <View style={[S.chatBubble, S.chatBubbleUser]}><Text style={S.setupBody} selectable>{message.content}</Text></View>
              <SmallButton compact title="Ret" icon="create-outline" disabled={locked} label={`Ret svar ${Math.ceil(index / 2)}`} onPress={() => changeSession({ input: message.content, editIndex: index })} />
            </View> : <View key={`${topic.id}-${index}`} style={S.chatRow}>
              <GuideAgentIcon />
              <View style={S.chatBubble}><Text style={S.setupBody} selectable>{message.content}</Text></View>
            </View>)}
            {!!pendingMessage && <View style={S.chatRowUser}><View style={[S.chatBubble, S.chatBubbleUser]}><Text style={S.setupBody}>{pendingMessage}</Text></View></View>}
            {!!busy && <View style={S.chatRow} accessibilityLiveRegion="polite">
              <GuideAgentIcon />
              <View style={[S.chatBubble, S.setupBusy]}><ActivityIndicator color={S.colors.accent} /><Text style={S.setupMuted}>{busy}</Text></View>
            </View>}
          </ScrollView>}
          {showDraft && <ScrollView style={[S.chatColumn, wide && S.chatDraftWide]} contentContainerStyle={S.chatContent} keyboardShouldPersistTaps="handled">
            <Text style={S.setupHeading}>Sådan ser gæsten det</Text>
            <Text style={S.setupMuted}>Et udkast, du kan tilpasse. Det bliver først synligt, når du godkender hele guiden.</Text>
            {topic.id === HOUSE_TOPIC_ID ? renderHouseFields() : <GuideBlocksEditor blocks={session.blocks} disabled={locked} onChange={(blocks) => changeBlocks(topic.id, blocks)} />}
          </ScrollView>}
        </View>

        {showChat && <SafeAreaView edges={['bottom']} style={S.setupBottomBar}>
          <View style={S.chatComposer}>
            {errorNotice}
            {editIndex !== null && <View style={S.setupNotice}><Text style={S.setupMuted}>Du retter et tidligere svar. Senere svar i dette emne erstattes, og forslaget skrives på ny.</Text><SmallButton compact title="Annuller rettelse" disabled={locked} onPress={() => changeSession({ input: '', editIndex: null })} /></View>}
            {inputTooLong && <Text style={S.ownerError}>Dit svar er for langt. Del det op i svar på højst {MAX_ANSWER_LENGTH} tegn.</Text>}
            {answers >= MAX_TURNS && <Text style={S.setupMuted}>Emnet er klar til gennemgang. Ret et tidligere svar, eller tilpas udkastet.</Text>}
            {/* Genvejene skjules, mens man skriver eller indtaler, så skrivefeltet har pladsen. */}
            {!keyboardOpen && !recording && <View style={S.chatPills}>
              {failedRecording?.topicId === topic.id && <SmallButton compact title="Prøv talesvaret igen" icon="refresh-outline" disabled={locked} onPress={() => stopRecording(failedRecording.uri)} />}
              {!session.complete && <SmallButton compact title="Spring over" label="Spring spørgsmål over" disabled={locked || !!session.input.trim()} onPress={() => sendAnswer({ skip: true })} />}
              {!session.complete && answers > 0 && <SmallButton compact title="Afslut emnet" label="Afslut med mine svar" disabled={locked || !!session.input.trim()} onPress={() => sendAnswer({ finish: true })} />}
              <SmallButton compact title="Næste emne" label="Spring resten af emnet over" icon="arrow-forward-outline" disabled={locked || !!session.input.trim() || editIndex !== null} onPress={nextTopic} />
            </View>}
            <View style={S.chatInputRow}>
              <RoundButton label={recording ? `Stop ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Indtal svar'} icon={recording ? 'stop' : 'mic-outline'}
                filled={recording} disabled={!!busy || turnsUsed} onPress={recording ? () => stopRecording() : startRecording} />
              {recording ? <View style={S.chatRecording} accessibilityLiveRegion="polite">
                <View style={S.chatRecordingDot} /><Text style={S.setupBody}>Optager {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} – tryk stop, når du er færdig</Text>
              </View> : <TextInput style={S.chatInput} accessibilityLabel="Dit svar til assistenten" placeholder="Fortæl med dine egne ord …" placeholderTextColor={S.colors.textMuted}
                value={session.input} onChangeText={(input) => changeSession({ input })} multiline editable={!locked} />}
              <RoundButton label={editIndex !== null ? 'Gem rettelse' : 'Send svar'} icon={editIndex !== null ? 'checkmark' : 'arrow-up'} filled
                disabled={locked || !session.input.trim() || inputTooLong || turnsUsed} onPress={() => sendAnswer()} />
            </View>
          </View>
        </SafeAreaView>}
        <StatusBar style="dark" />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={S.setupRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={outerScroll} keyboardShouldPersistTaps="handled" contentContainerStyle={S.setupScroll}>
        <View ref={shell} style={S.setupShell}>
          {intro ? <View style={S.setupIntro}>
            <GuideAgentComponent stacked={!wide}
              title={started ? 'Velkommen tilbage!' : AGENT_NAME ? `Hej! Jeg er ${AGENT_NAME}.` : 'Hej, og velkommen!'}
              text={started ? `Din kladde er gemt, og du er nået til trin ${draft.step + 1}: ${SETUP_STEPS[draft.step]}. Vi fortsætter, hvor du slap.`
                : 'Fortæl mig om sommerhuset med dine egne ord, så skriver jeg guiden til dine gæster. Sådan gør vi:'} />
            <View style={S.setupIntroSteps}>
              {SETUP_INTRO.map((item, index) => <View key={item.title} style={S.setupIntroStep}>
                <View style={S.setupIntroStepHead}>
                  <View style={S.setupIntroBadge}><Text style={S.setupIntroBadgeText}>{index + 1}</Text></View>
                  <Ionicons name={item.icon} size={26} color={S.colors.accent} />
                </View>
                <Text style={S.setupIntroStepTitle}>{item.title}</Text>
                <Text style={S.setupMuted}>{item.text}</Text>
              </View>)}
            </View>
            <View style={S.setupFacts}>
              {SETUP_FACTS.map((fact) => <View key={fact.text} style={S.setupFact}>
                <Ionicons name={fact.icon} size={20} color={S.colors.textMuted} /><Text style={S.setupMuted}>{fact.text}</Text>
              </View>)}
            </View>
            {notices}
            <View style={S.setupIntroActions}>
              <ButtonComponent title={started ? 'Fortsæt hvor du slap' : 'Kom i gang'} type="primary" height={64} width={300} disabled={locked}
                onPress={() => { setError(''); setRestartConfirm(false); setIntro(false); }} />
              {started && (restartConfirm ? renderRestartConfirm() : <SmallButton title="Start forfra" disabled={locked} onPress={() => setRestartConfirm(true)} />)}
            </View>
          </View> : <>
          {header}

          {notices}
          {!!transitionNotice && <View style={S.setupNotice} accessibilityLiveRegion="polite"><Text style={S.setupBody}>{transitionNotice}</Text></View>}

          {draft.step === 0 && <>
            {/* Hjælperen tilbyder selv at vælge; knappen er svaret på dens spørgsmål.
                De to tekster er lige lange, så boblen ikke skifter højde, og figuren står stille ved tryk. */}
            <GuideAgentComponent small title="Hvad skal gæsterne vide om?"
              text={allRecommended ? 'Så har jeg valgt det, de fleste huse har. Ret gerne til.' : 'Vælg selv – eller skal jeg vælge det, de fleste huse har?'}>
              <SmallButton compact title={allRecommended ? 'Fortryd' : 'Ja tak, vælg for mig'} label={allRecommended ? 'Fravælg de mest almindelige' : 'Vælg de mest almindelige'}
                icon={allRecommended ? 'arrow-undo-outline' : 'sparkles-outline'} disabled={locked} onPress={() => { setError(''); setDraft((current) => toggleRecommended(current)); }} />
            </GuideAgentComponent>
            <View style={S.setupFixed} accessible accessibilityLabel={`Husinfo er altid med: ${HOUSE_INFO_TEXT}`}>
              <Ionicons name="home-outline" size={26} color={S.colors.accent} />
              <View style={S.setupFixedBody}>
                <Text style={S.setupFixedTitle}>Husinfo</Text>
                <Text style={S.setupMuted}>{HOUSE_INFO_TEXT}</Text>
              </View>
              <Text style={S.setupFixedBadgeText}>Altid med</Text>
              <Ionicons name="checkmark-circle" size={24} color={S.colors.accent} />
            </View>
            <View style={S.setupGroups}>
              {groupCategories(draft.categories).map((group) => <View key={group.title} style={[S.setupGroup, groupColumns]}>
                <Text style={S.setupGroupTitle} accessibilityRole="header">{group.title}</Text>
                {group.wifi && renderOption(WIFI_OPTION, hasWifi(draft), () => { setError(''); setDraft((current) => toggleWifi(current)); })}
                {group.items.map((category) => renderOption(category, draft.selectedIds.includes(category.id), () => toggleCategory(category.id)))}
                {group.custom && <>
                  <Text style={S.setupMuted}>Mangler der noget? Skriv din egen kategori:</Text>
                  <View style={S.setupAddRow}>
                    <TextInput ref={customInput} style={S.setupCustomInput} placeholder="Fx pool" placeholderTextColor={S.colors.textMuted}
                      accessibilityLabel="Navn på egen kategori" value={customTitle} onChangeText={setCustomTitle} maxLength={60} editable={!locked}
                      returnKeyType="done" onSubmitEditing={addCategory}
                      onFocus={() => { customFocused.current = true; if (keyboardOpen) showCustomInput(); }} onBlur={() => { customFocused.current = false; }} />
                    <Pressable accessibilityRole="button" accessibilityLabel="Tilføj egen kategori" accessibilityState={{ disabled: locked }} disabled={locked}
                      onPress={addCategory} style={({ pressed }) => [S.setupAddButton, pressed && S.setupAddButtonPressed, locked && S.setupDisabled]}>
                      <Ionicons name="add" size={22} color={S.colors.surface} /><Text style={S.setupAddButtonText}>Tilføj</Text>
                    </Pressable>
                  </View>
                </>}
              </View>)}
            </View>
            <Text style={S.setupMuted}>Eksisterende sider uden for opsætningen bevares.</Text>
          </>}

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
            {restartConfirm ? renderRestartConfirm() : <SmallButton title="Start en ny opsætning" disabled={locked} onPress={() => setRestartConfirm(true)} />}
          </View>
          </>}
        </View>
      </ScrollView>
      {!intro && draft.step === 0 && !keyboardOpen && <SafeAreaView edges={['bottom']} style={S.setupBottomBar}>
        <View style={S.setupBottomInner}>
          <Text style={[S.setupBody, S.setupGrow]}>{draft.selectedIds.length} {draft.selectedIds.length === 1 ? 'kategori' : 'kategorier'} valgt</Text>
          <ButtonComponent title="Start samtalen" type="primary" height={60} width={220} disabled={locked || !draft.selectedIds.length}
            onPress={() => { setDraft(goToStep({ ...draft, currentTopicId: HOUSE_TOPIC_ID }, 1)); setError(''); }} />
        </View>
      </SafeAreaView>}
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
