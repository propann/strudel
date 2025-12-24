# ROADMAP

## Scope
This roadmap focuses on the Strudel Game Mode and REPL UX improvements while keeping ProjectStore as the single source of truth.

## Sprint 1: UX REPL + Projects foundation (done)
- Transport bar centered with Play/Stop/Run, BPM, save indicator.
- Shortcuts: Space (play/stop), Ctrl+Enter (run).
- Projects panel with CRUD + import/export + selection.
- Current project persists via ProjectStore.

## Sprint 2: Game Mode Level 1 (MVP loop)
- Level 1 spec and flow.
- Game state machine + scoring + feedback.
- Persist progress snapshots.

## Sprint 3: Controls/Sliders UX
- Standardized parameter control surface.
- Guardrails and reset.

## Sprint 4: Deck A/B
- A/B project slots, quick toggle, copy A->B / B->A.
- Persistent A/B state.

## Cross-cutting
- Keep REPL stable and audio untouched.
- Avoid large refactors; extend existing modules.
- Document how to test each milestone.
