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

function putToStore(store, value) {
  return new Promise((resolve, reject) => {
    const request = store.put(value);
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
    mode: 'repl',
    level: 0,
    tags: [],
    history: [],
  };
}

async function persistProject(project) {
  const db = getDb();
  if (!db) return;
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE, 'readwrite');
  const metaStore = readStore(database, META_STORE, 'readwrite');
  await putToStore(projectStore, project);
  await putToStore(metaStore, { key: META_CURRENT_ID, value: project.id });
}

function setSaveStatus(status, error = null) {
  $saveStatus.set({ status, error });
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
      await persistProject(project);
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
  if (!project || project.code === code) return;
  const next = { ...project, code, updatedAt: Date.now() };
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
      project = await getFromStore(projectStore, meta.value);
    }

    if (!project) {
      project = createProject({ code: settingsCode });
      updateProject(project, { shouldSave: false, shouldSyncSettings: false });
      await persistProject(project);
    } else if (settingsCode && project.code !== settingsCode) {
      project = { ...project, code: settingsCode, updatedAt: Date.now() };
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

export function getCurrentProject() {
  return $project.get();
}

export async function setCurrentProject(id) {
  const db = getDb();
  if (!db) return;
  const database = await db;
  const projectStore = readStore(database, PROJECT_STORE);
  const project = await getFromStore(projectStore, id);
  if (!project) {
    throw new Error(`Project not found: ${id}`);
  }
  updateProject(project, { shouldSave: false, shouldSyncSettings: true });
  await persistProject(project);
}

export function setCode(code, reason = 'edit') {
  applyCodeUpdate(code);
  if (reason === 'level-end') {
    recordSnapshot('level-end');
  }
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
  const project = {
    ...createProject(),
    ...parsed,
    id: nanoid(12),
    createdAt: now,
    updatedAt: now,
  };
  updateProject(project, { shouldSave: false, shouldSyncSettings: true });
  await persistProject(project);
  return project;
}
