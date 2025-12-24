# Sprint C3 Report - Audio First + Countdown

## Scope delivered
- Level schema now supports `baseCode`, `playerTargetCode`, `sections`, and optional `playerFx`.
- Game Mode runs a backing track plus player code combined audio.
- Countdown overlay (3-2-1-GO) synced to BPM before playback.
- Global Code panel shows Base/Player/Combined with "Apply to REPL".

## Key changes
- Added a lightweight game audio hook to run combined Strudel code and keep BPM in sync.
- Game play loop now builds player code from sections and re-evaluates audio on updates.
- Countdown and quantized start align engine timing with the audio start.
- Global Code UI added to /game for base + player visibility and REPL handoff.

## Files touched
- `website/src/game/GamePage.jsx`
- `website/src/game/useGameAudio.mjs`
- `website/src/game/levels/levels.mjs`
- `website/src/game/components/GlobalCodePanel.jsx`
- `website/src/game/components/CountdownOverlay.jsx`

## How to test
1) `pnpm -C website dev`
2) Open `/game`, select a level, click Play.
3) Observe countdown 3-2-1-GO, then hear the backing track.
4) Hit Space (or click Hit) on tokens to add sections; audio updates and Global Code changes.
5) Click "Apply to REPL" then navigate back to `/` and verify the combined code is present.

## Notes / known limits
- "Apply to REPL" stores the combined code; returning to /game will treat that as the player code.
- Section fragments are simple token strings to keep MVP deterministic.
