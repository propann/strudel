Sprint C — Game Mode v1 (engine + levels)

Scope coverage (already in repo)
- Engine core: `website/src/game/useGameEngine.mjs`
  - States: idle → playing → success/fail
  - Timing windows: perfect/good/miss (ms)
  - Token timeline + hit validation
- Level system: `website/src/game/levels/levels.mjs`
  - Level 1..5 data (tokens, bpm, target code, completion rules)
- UI game mode: `website/src/game/GamePage.jsx`
  - Lane, hit line, token fall, HUD (score/combo/state)
  - Input: Space or button “Hit”
  - Lore + Code Builder panels
  - Back to REPL link
- ProjectStore integration:
  - Token hits append player code via `setCode(...)`
  - Level completion snapshots via `setLevel(..., 'level-completed')`

Level 1 (Percu simple)
- Data: `website/src/game/levels/levels.mjs` (id "1")
- Tokens: bd/sn on beats 0..3
- Target code: `$: s("bd sn bd sn")`
- Completion: minAccuracy 0.8 + minCombo 1

How to test (manual)
1) Run `pnpm -C website dev`
2) Open `/game`
3) Select “Percu simple” and click Play
4) Use Space or “Hit” to match falling tokens
5) Verify:
   - Perfect/Good/Miss feedback colors
   - Code builder updates after hits
   - Success screen appears when criteria met
6) Refresh page and confirm last project code persists

Notes
- Engine + levels already implemented; no additional code changes were required for Sprint C in this pass.
