Deck Playback Bug — Root Cause

Summary
- Deck A and Deck B playback share the same Strudel REPL scheduler.
- Playback is driven by a single `StrudelMirror` instance, so any new `evaluate()` replaces the previous pattern.
- Result: running A then B overwrites A (no true parallel playback).

Key files
- Runner / playback: `website/src/repl/useReplContext.jsx`
  - `handleTogglePlay()` calls `editor.repl.evaluate(...)`
  - Single scheduler instance: `editor.repl.scheduler`
- Code build: `website/src/repl/madamix/madamixEngine.mjs`
  - `buildMadaMixCode()` concatenates deck A + deck B
- State: `website/src/game/projectStore.mjs`
  - `codeA`, `codeB`, `activeDeck`, `mixer`, `fx`

Pipeline (current)
UI (MadaMixBar) -> ProjectStore -> useReplContext -> StrudelMirror.repl -> WebAudio

Why A/B overwrite
- There is only one REPL / scheduler instance.
- Any playback call is `evaluate()` on the same instance, which replaces the current pattern graph.
- There is no per-deck engine or per-deck output bus.

Recommendation
- Introduce a per-deck audio engine (two `webaudioRepl` instances or equivalent).
- Each deck gets its own scheduler/output chain and is mixed via gainA/gainB.
- STOP must stop both engines.
