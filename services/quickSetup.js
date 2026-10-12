import { HOUSE_FIELDS, HOUSE_TOPIC, HOUSE_TOPIC_ID, RECOMMENDED_IDS, SETUP_CATEGORIES, SETUP_GROUPS, WIFI_FIELDS } from '../data/quickSetup';

export const MAX_CATEGORIES = 20;
export const MAX_ANSWER_LENGTH = 4000;
export const MAX_TURNS = 12;

export function pageSnapshot(page) {
  if (!page) return null;
  return {
    title: page.title, icon: page.icon, active: !!page.active,
    blocks: (page.blocks || []).map((block) => block.type === 'image'
      ? { id: block.id, type: 'image', url: block.url }
      : { id: block.id, type: 'text', text: block.text, ...(block.title ? { title: block.title } : {}) }),
    order: page.order ?? 0, custom: !!page.custom,
  };
}

// Gamle demonstrationsoplysninger må ikke blive brugt som fakta af AI'en.
export function createSetupDraft(house, pages, templateHouse, templatePages) {
  const houseInfo = Object.fromEntries(HOUSE_FIELDS.map((key) => [key,
    house[key] === templateHouse[key] && key !== 'name' ? '' : (house[key] || ''),
  ]));
  const categories = pages.map((page) => {
    const { oldTitle, ...standard } = SETUP_CATEGORIES.find((category) => category.id === page.id) || {};
    // Har siden stadig et udgået standardnavn, bruges kategoriens nye navn og ikon.
    const renamed = oldTitle !== undefined && page.title === oldTitle;
    return { id: page.id, custom: !!page.custom, ...standard, title: renamed ? standard.title : page.title, icon: renamed ? standard.icon : page.icon };
  });
  SETUP_CATEGORIES.forEach((category) => {
    const { oldTitle, ...standard } = category;
    if (!categories.some((item) => item.id === category.id)) categories.push({ ...standard, custom: true });
  });
  const sessions = {};
  categories.forEach((category) => {
    const page = pages.find((item) => item.id === category.id);
    const template = templatePages.find((item) => item.id === category.id);
    const text = blocksText(page?.blocks || []);
    const templateText = blocksText(template?.blocks || []);
    sessions[category.id] = makeSession(category, {
      basePage: pageSnapshot(page),
      guideText: text === templateText ? '' : text,
      images: (page?.blocks || []).filter((block) => block.type === 'image'),
    });
  });
  sessions[HOUSE_TOPIC_ID] = makeSession(HOUSE_TOPIC);
  return {
    version: 1, step: 0, currentTopicId: HOUSE_TOPIC_ID, wifi: true,
    newPageOrder: Math.max(-1, ...pages.map((page) => page.order ?? 0)) + 1,
    categories, selectedIds: pages.filter((page) => page.active && sessions[page.id].guideText).map((page) => page.id).slice(0, MAX_CATEGORIES),
    sessions, houseInfo, initialHouseInfo: { ...houseInfo },
    baseHouse: Object.fromEntries(HOUSE_FIELDS.map((key) => [key, house[key] || ''])),
  };
}

export function makeSession(topic, extra = {}) {
  const session = {
    messages: [{ role: 'assistant', content: topic.question || `Hvad skal gæsterne vide om ${topic.title.toLowerCase()}?` }],
    guideText: '', initialGuideText: extra.guideText || '', images: [], complete: false, input: '', editIndex: null, basePage: null,
    ...extra,
  };
  return withGuideBlocks(session, session.guideText, topic.id);
}

// Ét afsnit bliver én flytbar tekstblok. Billeder bruger samme format som den manuelle editor.
export function splitGuideText(text) {
  return text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

// Et afsnit fra AI'en starter med en kort overskrift på sin egen linje, fx "Gaskomfur".
// Overskriften gemmes som blokkens `title`, så både udlejer og gæst kan se, hvad afsnittet handler om.
export function splitTitle(part) {
  const [first, ...rest] = part.split('\n');
  const title = first.trim();
  const text = rest.join('\n').trim();
  return text && title.length <= 50 && !/[.!?:,;]$/.test(title) ? { title, text } : { text: part };
}

// Tekstblokkene som én tekst med overskrifterne på egen linje – samme form, som AI'en skriver og læser.
export function blocksText(blocks) {
  return blocks.filter((block) => block.type === 'text')
    .map((block) => block.title?.trim() ? `${block.title.trim()}\n${block.text}` : block.text).join('\n\n');
}

export function withBlocks(session, blocks) {
  return {
    ...session, blocks,
    guideText: blocksText(blocks),
    images: blocks.filter((block) => block.type === 'image'),
  };
}

export function withGuideBlocks(session, text, topicId) {
  const previous = session.blocks || session.basePage?.blocks || [];
  const paragraphs = splitGuideText(text);
  const blocks = [];
  let index = 0;
  const lastTextIndex = previous.reduce((last, block, i) => block.type === 'text' ? i : last, -1);
  const unchanged = text === blocksText(previous);
  const nextText = (id) => ({ id: id || `setup-text-${topicId}-${index}`, type: 'text', ...splitTitle(paragraphs[index++]) });
  if (lastTextIndex === -1) while (index < paragraphs.length) blocks.push(nextText());
  previous.forEach((block, i) => {
    if (block.type === 'image') {
      if ((session.images || []).some((image) => image.id === block.id)) blocks.push(block);
    } else if (unchanged) {
      // Del gamle lange tekstblokke uden at flytte billeder forbi deres oprindelige afsnit.
      splitGuideText(block.text).forEach((part, partIndex) => blocks.push({
        id: partIndex === 0 ? block.id : `${block.id}-part-${partIndex}`, type: 'text',
        ...(partIndex === 0 && block.title ? { title: block.title } : {}), text: part,
      }));
    } else {
      if (index < paragraphs.length) blocks.push(nextText(block.id));
      if (i === lastTextIndex) while (index < paragraphs.length) blocks.push(nextText());
    }
  });
  (session.images || []).forEach((image) => { if (!blocks.some((block) => block.id === image.id)) blocks.push(image); });
  // Gamle tekst-id'er kan overlappe nye. Hvert element skal have sit eget id.
  const ids = new Set();
  const unique = blocks.map((block, i) => {
    let id = block.id;
    while (ids.has(id)) id = `${id}-${i}`;
    ids.add(id);
    return { ...block, id };
  });
  return withBlocks(session, unique);
}

export function migrateSetupDraft(draft) {
  return { ...draft, sessions: Object.fromEntries(Object.entries(draft.sessions).map(([id, session]) =>
    [id, Array.isArray(session.blocks) ? withBlocks(session, session.blocks) : withGuideBlocks(session, session.guideText, id)])) };
}

export function advanceTopic(draft, topicId) {
  const topics = setupTopics(draft);
  const index = topics.findIndex((topic) => topic.id === topicId);
  // Find næste ufærdige emne, også hvis udlejeren er hoppet rundt i emnelisten.
  const candidates = [...topics.slice(index + 1), ...topics.slice(0, index)];
  const next = candidates.find((topic) => !draft.sessions[topic.id].complete || draft.sessions[topic.id].input.trim());
  return goToStep({ ...draft, currentTopicId: next?.id || topicId }, next ? 1 : 2);
}

// Det længste trin, udlejeren har været på. Ældre kladder har kun `step`.
export function furthestStep(draft) {
  return Math.max(draft.step, Number.isInteger(draft.maxStep) ? draft.maxStep : 0);
}

// Skifter trin og husker, hvor langt udlejeren er nået, så trinviseren kan hoppe frem igen.
export function goToStep(draft, step) {
  return { ...draft, step, maxStep: Math.max(furthestStep(draft), step) };
}

export function setupTopics(draft) {
  const { hintsNoWifi, ...house } = HOUSE_TOPIC;
  return [hasWifi(draft) ? house : { ...house, hints: hintsNoWifi }, ...draft.categories.filter((category) => draft.selectedIds.includes(category.id))];
}

export function isSetupDraft(value) {
  return value?.version === 1 && [0, 1, 2, 3].includes(value.step) &&
    (value.maxStep === undefined || [0, 1, 2, 3].includes(value.maxStep)) &&
    Number.isFinite(value.newPageOrder) && value.newPageOrder >= 0 &&
    Array.isArray(value.categories) && Array.isArray(value.selectedIds) &&
    value.categories.every((category) => category && typeof category.id === 'string' &&
      typeof category.title === 'string' && typeof category.icon === 'string') &&
    value.selectedIds.length <= MAX_CATEGORIES &&
    value.selectedIds.every((id) => value.categories.some((category) => category.id === id)) &&
    !!value.houseInfo && !!value.baseHouse &&
    HOUSE_FIELDS.every((key) => typeof value.houseInfo[key] === 'string' && typeof value.baseHouse[key] === 'string') &&
    [HOUSE_TOPIC_ID, ...value.categories.map((category) => category.id)].every((id) => {
      const session = value.sessions?.[id];
      return session && Array.isArray(session.messages) && session.messages.every((message) =>
        ['user', 'assistant'].includes(message.role) && typeof message.content === 'string') &&
        typeof session.guideText === 'string' && typeof session.input === 'string' && Array.isArray(session.images) &&
        session.images.every((image) => image?.type === 'image' && typeof image.id === 'string' && typeof image.url === 'string') &&
        (session.blocks === undefined || (Array.isArray(session.blocks) && session.blocks.every((block) =>
          block && typeof block.id === 'string' && (block.type === 'text' ? typeof block.text === 'string' && ['undefined', 'string'].includes(typeof block.title) :
            block.type === 'image' && typeof block.url === 'string')) &&
          new Set(session.blocks.map((block) => block.id)).size === session.blocks.length));
    });
}

// Fordeler kategorierne på grupperne. Kategorier uden fast gruppe (ejerens egne) havner i den sidste.
export function groupCategories(categories) {
  const known = SETUP_GROUPS.flatMap((group) => group.ids);
  return SETUP_GROUPS.map((group, index) => {
    const last = index === SETUP_GROUPS.length - 1;
    return {
      title: group.title, custom: last, wifi: !!group.wifi,
      items: [...group.ids.map((id) => categories.find((category) => category.id === id)).filter(Boolean),
        ...(last ? categories.filter((category) => !known.includes(category.id)) : [])],
    };
  });
}

// Wifi er slået til, medmindre ejeren har fravalgt det (ældre kladder har ikke feltet).
export function hasWifi(draft) {
  return draft.wifi !== false;
}

// Uden wifi tømmes wifi-felterne, så forsiden ikke viser dem. Slås wifi til igen, hentes de oprindelige værdier.
export function toggleWifi(draft) {
  const wifi = !hasWifi(draft);
  const source = wifi ? (draft.initialHouseInfo || draft.baseHouse) : {};
  return { ...draft, wifi, houseInfo: { ...draft.houseInfo, ...Object.fromEntries(WIFI_FIELDS.map((key) => [key, source[key] || ''])) } };
}

// Hjælperens knap: vælg de kategorier, næsten alle sommerhuse har – eller fravælg dem igen, hvis alle er valgt.
export function recommendedIds(draft) {
  return RECOMMENDED_IDS.filter((id) => draft.categories.some((category) => category.id === id));
}

export function toggleRecommended(draft) {
  const ids = recommendedIds(draft);
  const allSelected = ids.every((id) => draft.selectedIds.includes(id));
  return { ...draft, selectedIds: allSelected ? draft.selectedIds.filter((id) => !ids.includes(id))
    : [...draft.selectedIds, ...ids.filter((id) => !draft.selectedIds.includes(id))].slice(0, MAX_CATEGORIES) };
}

// Er ejeren begyndt på samtalen? Bruges til at byde velkommen tilbage på startsiden.
export function setupStarted(draft) {
  return draft.step > 0 || Object.values(draft.sessions).some((session) => session.messages.length > 1 || !!session.input.trim());
}

export function setupPages(draft) {
  return draft.categories.filter((category) => draft.selectedIds.includes(category.id)).map((category) => {
    const session = draft.sessions[category.id];
    return { ...category, ...session, publishable: !!session.guideText.trim() || session.images.length > 0 };
  });
}

export function validateAssistantResult(value) {
  if (!value || typeof value.reply !== 'string' || typeof value.question !== 'string' ||
      typeof value.guideText !== 'string' || typeof value.complete !== 'boolean' ||
      !value.houseInfo || HOUSE_FIELDS.some((key) => typeof value.houseInfo[key] !== 'string') ||
      value.guideText.length > 16000 || value.reply.length > 3000 || value.question.length > 1500 ||
      HOUSE_FIELDS.some((key) => value.houseInfo[key].length > 4000) ||
      (!value.complete && !value.question.trim())) {
    throw new Error('Assistentens svar kunne ikke læses. Prøv igen; dit svar er bevaret.');
  }
  return value;
}

export function applyAssistantResult(draft, topicId, messages, result) {
  validateAssistantResult(result);
  const content = [result.reply.trim(), result.question.trim()].filter(Boolean).join('\n\n');
  return {
    ...draft,
    houseInfo: topicId === HOUSE_TOPIC_ID ? { ...result.houseInfo } : draft.houseInfo,
    sessions: {
      ...draft.sessions,
      [topicId]: withGuideBlocks({
        ...draft.sessions[topicId], input: '', editIndex: null, guideText: result.guideText.trim(),
        complete: result.complete,
        messages: [...messages, { role: 'assistant', content: content || 'Tekstforslaget er klar til din gennemgang.' }],
      }, result.guideText, topicId),
    },
  };
}

// Gem nøjagtigt den blokrækkefølge, ejeren har valgt, også billeder midt i teksten.
export function buildPageBlocks(session, id) {
  const current = Array.isArray(session.blocks) ? session : withGuideBlocks(session, session.guideText, id);
  return current.blocks.filter((block) => block.type === 'image' || block.text.trim() || block.title?.trim())
    .map(({ title, ...block }) => title?.trim() ? { ...block, title: title.trim() } : block);
}
