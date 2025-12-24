# REPORT_SPRINT_C_GAME_V1

## Changements
- Ajout d un moteur minimal de jeu (timeline, fenetres perfect/good/miss, etats idle/playing/success/fail).
  - `website/src/game/useGameEngine.mjs`
- Ajout d un fichier de niveaux (Level 1 complet, placeholders L2-L5).
  - `website/src/game/levels.mjs`
- Refonte Game Mode UI pour lane de tokens + HUD + feedback et ecriture de code Strudel via ProjectStore.
  - `website/src/game/GamePage.jsx`
- Projet mis a jour sur fin de niveau (snapshot level-completed).
  - `website/src/game/projectStore.mjs`

## Comment tester
1) `pnpm -C website dev`
2) Ouvrir `/game`.
3) Cliquer Start.
4) Appuyer sur Space quand les tokens atteignent la hit line.
5) Observer:
   - Feedback perfect/good/miss.
   - Score + combo.
   - Code Strudel se construit (s("bd sn ...")).
6) Verifier que fin de niveau enregistre un snapshot level-completed.

## Notes
- Level 1 est jouable (percu simple).
- Niveaux 2-5 sont prepares (tokens a definir).
