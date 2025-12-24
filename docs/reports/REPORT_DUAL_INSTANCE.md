Dual Instance Plan

Summary
- Replaced the single shared playback path with two persistent deck instances.
- Each deck is created lazily and reused for the session.

Refactors
- Instantiable runner: `website/src/repl/madamix/deckRunner.mjs`
  - Wraps `webaudioRepl` + shared preload (modules + prebake)
- Dual instance manager: `website/src/repl/madamix/deckInstances.mjs`
  - `ensureDeck`, `playDeck`, `stopDeck`, `stopAll`, `setGlobalBpm`

UI hooks
- REPL Play/Run uses `playDeck(activeDeck)` in `website/src/repl/useReplContext.jsx`
- New UI buttons in `website/src/repl/components/madamix/MadaMixBar.jsx`:
  - Play A / Stop A
  - Play B / Stop B

How it works
1) `ensureDeck("A"|"B")` creates a persistent runner on first use.
2) `playDeck(deckId, code)` stops only that deck, evaluates its code, and leaves the other deck untouched.
3) `stopAll()` stops both decks for the global STOP.
