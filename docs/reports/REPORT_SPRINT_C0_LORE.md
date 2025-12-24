# REPORT_SPRINT_C0_LORE

## Changements
- Ajout d un lexique deterministic pour tokens -> explications.
  - `website/src/game/lore.mjs`
- Ajout des templates de lore par niveau.
  - `website/src/game/levels.mjs`
- Nouveau panneau Lore (style matrix) et Code Builder avec commentaire final.
  - `website/src/game/components/LorePanel.jsx`
  - `website/src/game/components/CodeBuilder.jsx`
- Game Mode branche les lore lines live et le commentaire final en fin d exercice.
  - `website/src/game/GamePage.jsx`

## Comment tester
1) `pnpm -C website dev`
2) Ouvrir `/game`
3) Start puis hit (Space ou bouton Hit)
4) Verifier:
   - Lore panel affiche des lignes pour bd/sn
   - Code Builder montre le code en cours
   - Fin de sequence affiche un commentaire final sous le code

## Notes
- Les annotations sont deterministes, sans parsing AST.
- Le code reste la source de verite via ProjectStore.
