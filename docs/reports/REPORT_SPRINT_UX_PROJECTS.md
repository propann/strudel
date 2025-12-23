# REPORT_SPRINT_UX_PROJECTS

## Modifs
- Transport REPL recentre avec Play/Stop/Run, BPM et etat de sauvegarde dans `website/src/repl/components/Header.jsx`.
- Raccourcis clavier (Space play/stop, Ctrl+Enter run) + sync ProjectStore/REPL dans `website/src/repl/useReplContext.jsx`.
- Projects UI (liste + actions) dans `website/src/repl/components/panel/ProjectsTab.jsx` et nouvel onglet dans `website/src/repl/components/panel/Panel.jsx`.
- ProjectStore etendu (liste, create/rename/duplicate/delete, selection, save status) dans `website/src/game/projectStore.mjs`.
- StrudelMirror expose `onChange` pour brancher l'autosave dans `packages/codemirror/codemirror.mjs`.

## Comment tester
1) `pnpm -C website dev`
2) Ouvrir `/` et verifier:
   - Barre transport centree avec Play/Stop/Run, BPM, indicateur saved/saving/error.
   - Space declenche play/stop (hors editeur), Ctrl+Enter lance run (hors editeur).
3) Ouvrir l'onglet Projects du panel:
   - New / Rename / Duplicate / Delete / Select.
   - Export JSON et Import JSON (import cree une copie).
4) Verifier `/game` accessible.
5) Refresh la page: le projet courant persiste (code + BPM).
