# REPORT_SPRINT_B_UX_PROJECTS

## Changements
- Transport bar modernisee et centree (play/pause, run, BPM +/-), indicateurs audio + save, et acces Projects via le nom du projet.
  - `website/src/repl/components/Header.jsx`
- Panel Projects renforce: liste avec date de modif, feedback inline (import/export/select), erreurs IDB remontees.
  - `website/src/repl/components/panel/ProjectsTab.jsx`
- Navigation /game <-> / plus claire avec bouton de retour stylise.
  - `website/src/game/GamePage.jsx`

## Ou cliquer / comment tester
1) `pnpm -C website dev`
2) REPL (`/`):
   - Play/Pause en haut, Run (Ctrl/Cmd+Enter), BPM +/-.
   - Indicateur AUDIO (playing/stopped) et SAVE (saved/saving/error).
   - Cliquer le nom du projet ou le bouton Projects pour ouvrir le panel.
3) Projects panel:
   - New, Rename, Duplicate, Delete, Select.
   - Export JSON (projet courant) + Import JSON (cree une copie).
   - Verifier message inline de confirmation.
4) /game:
   - Bouton REPL pour revenir.
5) Refresh:
   - Le projet courant (code + BPM) est conserve.

## Known issues
- Les notifications sont inline (pas de toast global).
- L affichage de la date de modification depend de la locale du navigateur.
