import { atom } from 'nanostores';
import { nanoid } from 'nanoid';

const DB_NAME = 'strudel-game-player';
const DB_VERSION = 1;
const PROFILE_STORE = 'playerProfile';
const PROFILE_KEY = 'profile';
const MAX_HISTORY = 200;
const MAX_CREATIONS = 200;

const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

export const $playerProfile = atom(null);

let initialized = false;
let dbPromise = null;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getDb() {
  if (!isBrowser) return null;
  if (!dbPromise) {
    dbPromise = openDb();
  }
  return dbPromise;
}

function readStore(db, name, mode = 'readonly') {
  return db.transaction(name, mode).objectStore(name);
}

function getFromStore(store, key) {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putToStore(store, value) {
  return new Promise((resolve, reject) => {
    const request = store.put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createProfile() {
  const now = Date.now();
  return {
    playerId: nanoid(10),
    displayName: 'Player',
    createdAt: now,
    updatedAt: now,
    totalScore: 0,
    bestComboEver: 0,
    bestAccuracyEver: 0,
    levels: {},
    history: [],
    creations: [],
    latestCreationId: '',
    favorites: [],
  };
}

function normalizeProfile(profile) {
  if (!profile) return profile;
  return {
    ...profile,
    playerId: profile.playerId || nanoid(10),
    displayName: profile.displayName || 'Player',
    levels: profile.levels || {},
    history: Array.isArray(profile.history) ? profile.history : [],
    creations: Array.isArray(profile.creations) ? profile.creations : [],
    latestCreationId: profile.latestCreationId || '',
    favorites: Array.isArray(profile.favorites) ? profile.favorites : [],
  };
}

async function persistProfile(profile) {
  const db = getDb();
  if (!db) return;
  const database = await db;
  await putToStore(readStore(database, PROFILE_STORE, 'readwrite'), { key: PROFILE_KEY, value: profile });
}

export async function init() {
  if (initialized) return;
  initialized = true;
  if (!isBrowser) {
    $playerProfile.set(createProfile());
    return;
  }
  const db = await getDb();
  const database = await db;
  const store = readStore(database, PROFILE_STORE);
  const stored = await getFromStore(store, PROFILE_KEY);
  if (stored?.value) {
    $playerProfile.set(normalizeProfile(stored.value));
    return;
  }
  const profile = createProfile();
  const normalized = normalizeProfile(profile);
  $playerProfile.set(normalized);
  await persistProfile(normalized);
}

export function getProfile() {
  return $playerProfile.get();
}

export async function setDisplayName(name) {
  const profile = normalizeProfile($playerProfile.get());
  if (!profile) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const next = { ...profile, displayName: trimmed, updatedAt: Date.now() };
  $playerProfile.set(next);
  await persistProfile(next);
}

function gradeFromAccuracy(accuracy) {
  if (accuracy >= 0.95) return 'S';
  if (accuracy >= 0.9) return 'A';
  if (accuracy >= 0.8) return 'B';
  return 'C';
}

function starsFromAccuracy(accuracy) {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.85) return 2;
  if (accuracy >= 0.7) return 1;
  return 0;
}

export async function recordRun(result) {
  const profile = normalizeProfile($playerProfile.get());
  if (!profile || !result) return null;
  const now = Date.now();
  const accuracy = result.accuracy ?? 0;
  const grade = gradeFromAccuracy(accuracy);
  const stars = starsFromAccuracy(accuracy);
  const historyEntry = {
    timestamp: now,
    levelId: result.levelId,
    score: result.score ?? 0,
    accuracy,
    comboMax: result.comboMax ?? 0,
    durationMs: result.durationMs ?? 0,
    grade,
    stars,
  };

  const prevLevel = profile.levels[result.levelId] ?? {
    bestScore: 0,
    bestAccuracy: 0,
    bestCombo: 0,
    lastPlayedAt: 0,
    attempts: 0,
    stars: 0,
  };

  const nextLevel = {
    bestScore: Math.max(prevLevel.bestScore, historyEntry.score),
    bestAccuracy: Math.max(prevLevel.bestAccuracy, accuracy),
    bestCombo: Math.max(prevLevel.bestCombo, historyEntry.comboMax),
    lastPlayedAt: now,
    attempts: prevLevel.attempts + 1,
    stars: Math.max(prevLevel.stars, stars),
  };

  const history = [historyEntry, ...profile.history].slice(0, MAX_HISTORY);
  const next = {
    ...profile,
    totalScore: profile.totalScore + historyEntry.score,
    bestComboEver: Math.max(profile.bestComboEver, historyEntry.comboMax),
    bestAccuracyEver: Math.max(profile.bestAccuracyEver, accuracy),
    levels: { ...profile.levels, [result.levelId]: nextLevel },
    history,
    updatedAt: now,
  };

  $playerProfile.set(next);
  await persistProfile(next);
  return { ...historyEntry };
}

export function getLeaderboardLocal(levelId) {
  const profile = normalizeProfile($playerProfile.get());
  if (!profile) return [];
  return profile.history
    .filter((entry) => entry.levelId === levelId)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export async function addCreation(payload) {
  const profile = normalizeProfile($playerProfile.get());
  if (!profile) return null;
  const now = Date.now();
  const creation = {
    id: nanoid(12),
    title: payload?.title || 'Untitled Creation',
    type: payload?.type || 'pattern',
    codeA: payload?.codeA,
    codeB: payload?.codeB,
    code: payload?.code,
    bpm: payload?.bpm,
    mixer: payload?.mixer,
    fx: payload?.fx,
    createdAt: payload?.createdAt ?? now,
    updatedAt: now,
    source: payload?.source || 'repl',
    meta: payload?.meta || {},
  };
  const creations = [creation, ...profile.creations].slice(0, MAX_CREATIONS);
  const next = {
    ...profile,
    creations,
    latestCreationId: creation.id,
    updatedAt: now,
  };
  $playerProfile.set(next);
  await persistProfile(next);
  return creation;
}

export function exportProfile() {
  const profile = normalizeProfile($playerProfile.get());
  return profile ? JSON.stringify(profile) : '';
}

export async function importProfile(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error('Invalid profile JSON');
  }
  const normalized = normalizeProfile(parsed);
  $playerProfile.set(normalized);
  await persistProfile(normalized);
  return normalized;
}
