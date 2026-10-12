import { useCallback, useEffect, useRef, useState } from 'react';
import { getHouse, getPages, saveQuickSetupDraft } from '../database/database';
import { HOUSE, PAGES } from '../data/const';
import { createSetupDraft, isSetupDraft, migrateSetupDraft } from './quickSetup';

// Gemninger køres i rækkefølge, så et langsomt gammelt kald ikke erstatter et nyt.
export default function useQuickSetupDraft(houseId) {
  const [draft, setDraftState] = useState(null);
  const [saveStatus, setSaveStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const current = useRef(null);
  const queue = useRef(Promise.resolve());
  const timer = useRef(null);
  const alive = useRef(true);
  const completed = useRef(false);
  const saved = useRef('');

  const setDraft = useCallback((change) => {
    const next = typeof change === 'function' ? change(current.current) : change;
    current.current = next;
    setDraftState(next);
    setSaveStatus('pending');
  }, []);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const snapshot = current.current;
    if (!snapshot || completed.current) return;
    const serialized = JSON.stringify(snapshot);
    const operation = queue.current.catch(() => {}).then(async () => {
      if (serialized === saved.current || completed.current) return;
      if (alive.current) { setSaveStatus('saving'); setSaveError(''); }
      await saveQuickSetupDraft(houseId, snapshot);
      saved.current = serialized;
    });
    queue.current = operation;
    try {
      await operation;
      if (alive.current && !completed.current) setSaveStatus(JSON.stringify(current.current) === saved.current ? 'saved' : 'pending');
    } catch (error) {
      if (alive.current) { setSaveStatus('error'); setSaveError(error.message); }
      throw error;
    }
  }, [houseId]);

  const load = useCallback(async (restart = false) => {
    setLoadError('');
    try {
      if (restart) { clearTimeout(timer.current); await queue.current.catch(() => {}); }
      const [house, pages] = await Promise.all([getHouse(houseId), getPages(houseId)]);
      if (!alive.current) return;
      const stored = house.quickSetupDraft;
      if (stored && !restart && !isSetupDraft(stored)) throw new Error('Kladden kunne ikke læses. Du kan starte en ny opsætning; den publicerede guide bliver bevaret.');
      const next = !restart && stored ? migrateSetupDraft(stored) : createSetupDraft(house, pages, HOUSE, PAGES);
      saved.current = !restart && stored ? JSON.stringify(stored) : '';
      current.current = next;
      setDraftState(next);
      setSaveStatus(saved.current ? 'saved' : 'pending');
    } catch (error) {
      if (alive.current) setLoadError('Kunne ikke hente opsætningen. ' + error.message);
    }
  }, [houseId]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; clearTimeout(timer.current); };
  }, [load]);

  useEffect(() => {
    if (draft && !completed.current) timer.current = setTimeout(() => { flush().catch(() => {}); }, 800);
    return () => clearTimeout(timer.current);
  }, [draft, flush]);

  return { draft, setDraft, flush, load, loadError, saveError, saveStatus, completed };
}
