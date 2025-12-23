# REPORT_MVP1_FOUNDATIONS

## 1) Resume audit

- Entree REPL: `website/src/pages/index.astro` rend `<Repl client:only="react" />`, implementation principale dans `website/src/repl/Repl.jsx`.
- Point d'entree UI REPL: `website/src/repl/useReplContext.jsx` (creation StrudelMirror, lifecycle, actions et handlers).
- Persistance actuelle du code: `settingsMap` via `persistentMap` (nanostores) dans `website/src/settings.mjs`, utilise `latestCode` (localStorage) et hash URL via `code2hash` dans `useReplContext.jsx`. Donnees de session (pattern actif/visu) en `sessionStorage` via `website/src/user_pattern_utils.mjs`.

## 2) Architecture ajoutee

- `website/src/game/projectStore.mjs`: module core ProjectStore + types JSDoc.
- `website/src/game/GamePage.jsx`: UI Game Mode MVP.
- `website/src/pages/game.astro`: nouvelle route /game.
- `website/src/repl/components/Header.jsx`: lien vers /game.

## 3) API ProjectStore

- `init()`
- `getCurrentProject()`
- `setCurrentProject(id)`
- `setCode(code, reason)`
- `setBpm(bpm, reason)`
- `recordSnapshot(event)`
- `exportProject(id)`
- `importProject(json)`
- Stores: `$project`, `$saveStatus`

## 4) Persistance / autosave

- IndexedDB: DB `strudel-game`, stores `projects` + `meta`.
- Hydratation: charge le projet courant ou cree un projet par defaut (code = `latestCode` si present).
- Autosave: debounce 1200ms sur modifications (code/bpm/snapshots).
- Snapshots: `repl-eval` sur changement de `latestCode`, `idle` toutes les 30s max, `level-end` reserve pour futur.
- Historique borne: 200 snapshots max.
- Etat sauvegarde: `$saveStatus` (saving/saved/error).

## 5) Lancer et tester localement

- Dev: `pnpm -C website dev`
- Build: `pnpm -C website build`
- Verif manuelle: ouvrir `/` (REPL), puis `/game` pour voir le code et tester "Ajouter token demo".

## 6) Reste a faire pour MVP1

- Logique de gameplay: tokens qui tombent + boucle de progression.
- 10 exercices fixes (contenu + verification).
- UI/UX du Game Mode (feedback visuel/audio, scoring, niveau).
- Hook explicite "fin de niveau" pour `recordSnapshot('level-end')`.
