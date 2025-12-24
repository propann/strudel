# Report - Deck Code Bug Root Cause

## Symptom
- Deck A and Deck B end up sharing the same code.

## Cause
- The editor binding uses a single `project.code` field and `setCode()` in `website/src/repl/useReplContext.jsx`.
- `activeDeck` switches update `project.code`, but edits always go through the same path, so `codeA`/`codeB` do not stay isolated.
- This makes deck switching largely cosmetic because the editor keeps writing into the shared field and can overwrite both decks via sync.

## Files involved
- `website/src/repl/useReplContext.jsx`: editor source-of-truth and onChange handler.
- `website/src/game/projectStore.mjs`: dual-code fields exist (`codeA`, `codeB`), but editor writes through `setCode()`.
- `website/src/repl/components/madamix/MadaMixBar.jsx`: toggles `activeDeck`, but editor doesn’t bind to per-deck buffers.

## Fix strategy
- Bind editor value to `codeA` or `codeB` based on `activeDeck`.
- On change, call `setDeckCode(activeDeck, value)` instead of `setCode()`.
