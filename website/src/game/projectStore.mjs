import { atom } from 'nanostores';
import { nanoid } from 'nanoid';
import { settingsMap } from '../settings.mjs';

/**
 * @typedef {Object} ProjectSnapshot
 * @property {number} timestamp
 * @property {string} code
 * @property {number} bpm
 * @property {string} mode
 * @property {number} level
 * @property {string} event
 */

/**
 * @typedef {Object} StrudelProject
 * @property {number} schemaVersion
 * @property {string} id
 * @property {string} name
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {number} bpm
 * @property {string} code
 * @property {string} codeA
 * @property {string} codeB
 * @property {'A'|'B'} activeDeck
 * @property {{crossfader: number, volA: number, volB: number}} mixer
 * @property {Object} fx
 * @property {string} mode
 * @property {number} level
 * @property {string[]} tags
 * @property {ProjectSnapshot[]} history
 */

const DB_NAME = 'strudel-game';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';
const META_STORE = 'meta';
const META_CURRENT_ID = 'currentProjectId';
const AUTOSAVE_DELAY_MS = 1200;
const IDLE_SNAPSHOT_MS = 30000;
const MAX_HISTORY = 200;
const DEFAULT_MIXER = { crossfader: 0.5, volA: 1, volB: 1 };
const DEFAULT_FX = {
  A: {
    echo: { active: false, mode: 'momentary', amount: 0.6 },
    filter: { active: false, mode: 'momentary', amount: 0.5, kind: 'lpf' },
    disto: { active: false, mode: 'momentary', amount: 0.4 },
    reverb: { active: false, mode: 'momentary', amount: 0.5 },
  },
  B: {
    echo: { active: false, mode: 'momentary', amount: 0.6 },
    filter: { active: false, mode: 'momentary', amount: 0.5, kind: 'lpf' },
    disto: { active: false, mode: 'momentary', amount: 0.4 },
    reverb: { active: false, mode: 'momentary', amount: 0.5 },
  },
};

const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

export const $project = atom(/** @type {StrudelProject|null} */ (null));
export const $saveStatus = atom({ status: 'saved', error: null });

let initialized = false;
let dbPromise = null;
let saveTimer = null;
let idleTimer = null;
let lastSettingsCode = '';
let suppressSettingsWrite = false;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
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

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
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

function deleteFromStore(store, key) {
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createProject({ code = '', name = 'Untitled Project' } = {}) {
  const now = Date.now();
  return {
    schemaVersion: 1,
    id: nanoid(12),
    name,
    createdAt: now,
    updatedAt: now,
    bpm: 120,
    code,
    codeA: code,
    codeB: '',
    activeDeck: 'A',
    mixer: { ...DEFAULT_MIXER },
    fx: JSON.parse(JSON.stringify(DEFAULT_FX)),
    mode: 'repl',
    level: 0,
    tags: [],
    history: [],
  };
}

function normalizeProject(project) {
  if (!project) return project;
  const code = project.code ?? '';
  const codeA = project.codeA ?? code;
  const codeB = project.codeB ?? '';
  const activeDeck = project.activeDeck === 'B' ? 'B' : 'A';
  return {
    ...project,
    codeA,
    codeB,
    activeDeck,
    mixer: { ...DEFAULT_MIXER, ...(project.mixer ?? {}) },
    fx: {
      A: { ...DEFAULT_FX.A, ...(project.fx?.A ?? {}) },
      B: { ...DEFAULT_FX.B, ...(project.fx?.B ?? {}) },
    },
    code: activeDeck === 'B' ? codeB : codeA,
  };
}

function getActiveCode(project) {
  if (!project) return '';
  return project.activeDeck === 'B' ? project.codeB ?? '' : project.codeA ?? '';
}

function updateActiveCode(project, code) {
  if (!project) return project;
  if (project.activeDeck === 'B') {
    return { ...project, codeB: code, code };
  }
  return { ...project, codeA: code, code };
}

async function persistProject(project, { makeCurrent = true } = {}) {
  const db = getDb();
  if (!db) return;
  const database = await db;
  await putToStore(readStore(database, PROJECT_STORE, 'readwrite'), project);
  if (makeCurrent) {
    await putToStore(readStore(database, META_STORE, 'readwrite'), { key: META_CURRENT_ID, value: project.id });
  }
}

function setSaveStatus(status, error = null) {
  $saveStatus.set({ status, error });
}

async function persistProjectWithStatus(project, { makeCurrent = true } = {}) {
  setSaveStatus('saving');
  try {
    await persistProjectWithRetry(project, { makeCurrent });
    setSaveStatus('saved');
  } catch (err) {
    setSaveStatus('error', err);
    throw err;
  }
}

async function persistProjectWithRetry(project, { makeCurrent = true } = {}) {
  try {
    await persistProject(project, { makeCurrent });
  } catch (err) {
    await persistProject(project, { makeCurrent });
  }
}

function scheduleSave() {
  if (!isBrowser) return;
  setSaveStatus('saving');
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(async () => {
    const project = $project.get();
    if (!project) return;
    try {
      await persistProjectWithRetry(project);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error', err);
    }
  }, AUTOSAVE_DELAY_MS);
}

function updateProject(next, { shouldSave = true, shouldSyncSettings = true } = {}) {
  $project.set(next);
  if (shouldSyncSettings && isBrowser) {
    suppressSettingsWrite = true;
    settingsMap.setKey('latestCode', next.code);
    suppressSettingsWrite = false;
  }
  if (shouldSave) {
    scheduleSave();
  }
}

function applyCodeUpdate(code, { shouldSyncSettings = true } = {}) {
  const project = $project.get();
  if (!project || getActiveCode(project) === code) return;
  const next = { ...updateActiveCode(project, code), updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings });
}

export async function init() {
  if (initialized) return;
  initialized = true;

  if (!isBrowser) {
    $project.set(createProject());
    return;
  }

  const settingsCode = settingsMap.get().latestCode ?? '';
  lastSettingsCode = settingsCode;

  try {
    const db = await getDb();
    const database = await db;
    const metaStore = readStore(database, META_STORE);
    const meta = await getFromStore(metaStore, META_CURRENT_ID);
    let project = null;
    if (meta?.value) {
      const projectStore = readStore(database, PROJECT_STORE);
      project = normalizeProject(await getFromStore(projectStore, meta.value));
    }

    if (!project) {
      project = createProject({ code: settingsCode });
      updateProject(project, { shouldSave: false, shouldSyncSettings: false });
      await persistProject(project);
    } else if (settingsCode && project.code !== settingsCode) {
      project = updateActiveCode(project, settingsCode);
      project = { ...project, updatedAt: Date.now() };
      updateProject(project, { shouldSave: true, shouldSyncSettings: false });
    } else {
      updateProject(project, { shouldSave: false, shouldSyncSettings: false });
    }
  } catch (err) {
    setSaveStatus('error', err);
    $project.set(createProject({ code: settingsCode }));
  }

  settingsMap.listen((next) => {
    if (suppressSettingsWrite) return;
    const nextCode = next.latestCode ?? '';
    if (nextCode !== lastSettingsCode) {
      lastSettingsCode = nextCode;
      applyCodeUpdate(nextCode, { shouldSyncSettings: false });
      recordSnapshot('repl-eval');
    }
  });

  idleTimer = window.setInterval(() => {
    recordSnapshot('idle');
  }, IDLE_SNAPSHOT_MS);
}

async function loadProject(id) {
  const current = $project.get();
  if (current && current.id === id) {
    return current;
  }
  const db = getDb();
  if (!db) return null;
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE);
  return normalizeProject(await getFromStore(projectStore, id));
}

export function getCurrentProject() {
  return $project.get();
}

export async function setCurrentProject(id) {
  const db = getDb();
  if (!db) return;
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE);
  const project = normalizeProject(await getFromStore(projectStore, id));
  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }
  updateProject(project, { shouldSave: false, shouldSyncSettings: true });
  await persistProjectWithStatus(project, { makeCurrent: true });
}

export function setCode(code, reason = 'edit') {
  applyCodeUpdate(code);
  if (reason === 'level-end') {
    recordSnapshot('level-end');
  }
}

export function setDeckCode(deck, code, reason = 'edit') {
  const project = $project.get();
  if (!project) return;
  const targetDeck = deck === 'B' ? 'B' : 'A';
  if (targetDeck === 'A' && project.codeA === code) return;
  if (targetDeck === 'B' && project.codeB === code) return;
  const next =
    targetDeck === 'B'
      ? { ...project, codeB: code, updatedAt: Date.now() }
      : { ...project, codeA: code, updatedAt: Date.now() };
  const withActive = targetDeck === project.activeDeck ? { ...next, code } : next;
  updateProject(withActive, { shouldSave: true, shouldSyncSettings: targetDeck === project.activeDeck });
  if (reason === 'level-end') {
    recordSnapshot('level-end');
  }
}

export function setActiveDeck(deck) {
  const project = $project.get();
  if (!project) return;
  const nextDeck = deck === 'B' ? 'B' : 'A';
  if (project.activeDeck === nextDeck) return;
  const nextCode = nextDeck === 'B' ? project.codeB ?? '' : project.codeA ?? '';
  const next = { ...project, activeDeck: nextDeck, code: nextCode, updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings: true });
}

export function setMixer(patch) {
  const project = $project.get();
  if (!project) return;
  const next = { ...project, mixer: { ...project.mixer, ...patch }, updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings: false });
}

export function setFx(deck, effect, patch) {
  const project = $project.get();
  if (!project) return;
  const targetDeck = deck === 'B' ? 'B' : 'A';
  const currentFx = project.fx?.[targetDeck] ?? {};
  const currentEffect = currentFx[effect] ?? {};
  const nextDeckFx = { ...currentFx, [effect]: { ...currentEffect, ...patch } };
  const nextFx = { ...project.fx, [targetDeck]: nextDeckFx };
  const next = { ...project, fx: nextFx, updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings: false });
}

export function setBpm(bpm, reason = 'edit') {
  const project = $project.get();
  if (!project || project.bpm === bpm) return;
  const next = { ...project, bpm, updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings: false });
  if (reason === 'level-end') {
    recordSnapshot('level-end');
  }
}

export function setLevel(level, reason = 'edit') {
  const project = $project.get();
  if (!project || project.level === level) return;
  const next = { ...project, level, updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings: false });
  if (reason === 'level-completed') {
    recordSnapshot('level-completed');
  }
}

export function recordSnapshot(event = 'snapshot') {
  const project = $project.get();
  if (!project) return;
  const snapshot = {
    timestamp: Date.now(),
    code: project.code,
    bpm: project.bpm,
    mode: project.mode,
    level: project.level,
    event,
  };
  const history = project.history ? [...project.history, snapshot] : [snapshot];
  const trimmed = history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history;
  const next = { ...project, history: trimmed, updatedAt: Date.now() };
  updateProject(next, { shouldSave: true, shouldSyncSettings: false });
}

export async function listProjects() {
  const db = getDb();
  if (!db) return [];
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE);
  const projects = (await getAllFromStore(projectStore))?.map((project) => normalizeProject(project));
  return (projects ?? []).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function createNewProject({ name = 'Untitled Project', code = '', bpm } = {}) {
  const project = createProject({ name, code });
  if (Number.isFinite(bpm)) {
    project.bpm = bpm;
  }
  updateProject(project, { shouldSave: false, shouldSyncSettings: true });
  await persistProjectWithStatus(project, { makeCurrent: true });
  return project;
}

export async function renameProject(id, name) {
  const project = await loadProject(id);
  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Project name cannot be empty');
  }
  const next = { ...project, name: trimmed, updatedAt: Date.now() };
  if ($project.get()?.id === id) {
    updateProject(next, { shouldSave: false, shouldSyncSettings: true });
    await persistProjectWithStatus(next, { makeCurrent: true });
    return next;
  }
  await persistProjectWithStatus(next, { makeCurrent: false });
  return next;
}

export async function duplicateProject(id) {
  const source = await loadProject(id);
  if (!source) {
    throw new Error(`Project not found: ${id}`);
  }
  const now = Date.now();
  const project = {
    ...source,
    id: nanoid(12),
    name: `${source.name} Copy`,
    createdAt: now,
    updatedAt: now,
    history: [],
  };
  updateProject(project, { shouldSave: false, shouldSyncSettings: true });
  await persistProjectWithStatus(project, { makeCurrent: true });
  return project;
}

export async function deleteProject(id) {
  const db = getDb();
  if (!db) return;
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE, 'readwrite');
  await deleteFromStore(projectStore, id);

  const current = $project.get();
  if (current?.id !== id) {
    setSaveStatus('saved');
    return;
  }

  const remaining = await listProjects();
  if (remaining.length > 0) {
    const next = remaining[0];
    updateProject(next, { shouldSave: false, shouldSyncSettings: true });
    await persistProjectWithStatus(next, { makeCurrent: true });
    return;
  }

  const fallback = createProject();
  updateProject(fallback, { shouldSave: false, shouldSyncSettings: true });
  await persistProjectWithStatus(fallback, { makeCurrent: true });
}

export async function exportProject(id) {
  const current = $project.get();
  if (current && current.id === id) {
    return JSON.stringify(current);
  }
  const db = getDb();
  if (!db) return '';
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE);
  const project = await getFromStore(projectStore, id);
  return project ? JSON.stringify(project) : '';
}

export async function importProject(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error('Invalid project JSON');
  }
  const now = Date.now();
  const normalized = normalizeProject({ ...createProject(), ...parsed });
  const project = normalizeProject({
    ...normalized,
    id: nanoid(12),
    createdAt: now,
    updatedAt: now,
  });
  updateProject(project, { shouldSave: false, shouldSyncSettings: true });
  await persistProjectWithStatus(project, { makeCurrent: true });
  return project;
}
