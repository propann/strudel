# REPORT_SPRINT_C1_LEVELS_PROFILE

## Changements
- Niveaux v1 + API (list/get/next) avec lore, scoring, completion criteria.
  - `website/src/game/levels/levels.mjs`
- Selection de niveau (LevelSelect).
  - `website/src/game/components/LevelSelect.jsx`
  - `website/src/game/GamePage.jsx`
- PlayerStore offline (profil + stats + historique + leaderboard local).
  - `website/src/game/playerStore.mjs`
- Resultats de run avec score/accuracy/combo/grade/stars.
  - `website/src/game/components/ResultsScreen.jsx`
  - `website/src/game/useGameEngine.mjs`
- Ecran Profile (nom + stats + derniers runs).
  - `website/src/game/components/ProfileScreen.jsx`

## Comment tester
1) `pnpm -C website dev`
2) Ouvrir `/game`.
3) Choisir un niveau et Play.
4) Terminer la run: verifier Resultats (score, accuracy, grade, stars) et que recordRun est appele.
5) Ouvrir Profile: modifier le nom, verifier stats globales et derniers runs.
6) Refresh: le profil et les scores persistent.

## Notes
- Les commentaires pedagogiques restent en UI (CodeBuilder + Lore), pas d insertion dans le code.
- Leaderboard local base sur l historique, top 10 par niveau.
