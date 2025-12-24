# Report - MadaMix Targets (Recon Phase)

## UI mixer bar
- `website/src/repl/components/madamix/MadaMixBar.jsx`: main DJ bar layout (decks + mixer).
- `website/src/repl/components/madamix/Crossfader.jsx`: crossfader control.
- `website/src/repl/components/madamix/DeckVolume.jsx`: deck volume slider.
- `website/src/repl/components/madamix/FxRack.jsx`: per-deck FX buttons/sliders.
- `website/src/repl/Repl.css`: MadaMix theme tokens + layout styling.
- `website/src/repl/components/ReplEditor.jsx`: mounts the bar below the editor.

## Project store / autosave
- `website/src/game/projectStore.mjs`: ProjectStore (CRUD + autosave + import/export).
- `website/src/repl/components/panel/ProjectsTab.jsx`: Projects UI wired to ProjectStore.

## Execution pipeline (runner)
- `website/src/repl/useReplContext.jsx`: REPL runtime (play/eval/stop, editor sync).
- `website/src/repl/madamix/madamixEngine.mjs`: combined code build + runtime mixer values.

## Editor (code input/output)
- `website/src/repl/components/Code.jsx`: editor container.
- `packages/codemirror/codemirror.mjs`: StrudelMirror implementation.

## Risks / limits
- Audio routing uses wrapper injection (`buildMadaMixCode`) rather than true dual repl runners; this depends on `$:` lines to apply deck-level gain/FX.
- FX controls map to Strudel controls (delay/lpf/hpf/distort/room); if a deck pattern omits `$:` lines, deck FX/gain will not be applied.
