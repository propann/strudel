# MadaMix - Dual Deck Live Coding

## What it is
MadaMix adds two independent code decks (A/B) to the Strudel REPL with a DJ-style mixer.
Each deck has its own code, and both run together with a crossfader, per-deck volume, and quick FX.

## How to use
1) Click Deck A or Deck B in the MadaMix bar to choose which code you edit.
2) Write or paste code for each deck as usual.
3) Press Play or Eval in the REPL header to run both decks together.
4) Use the crossfader and per-deck volume to mix between A and B.
5) Trigger FX with the buttons or keyboard shortcuts.
6) Use the REPL Stop button to halt both decks.
7) Use **Save creation** to snapshot your current A/B mix.

## Keyboard shortcuts
- `Alt+1` Focus Deck A
- `Alt+2` Focus Deck B
- `X` Center crossfader
- `Q/W/E/R` FX Deck A (Echo / Filter / Disto / Reverb)
- `U/I/O/P` FX Deck B (Echo / Filter / Disto / Reverb)

Use the REPL Stop button to halt all audio.

Shortcuts ignore inputs and contenteditable fields to avoid typing collisions.

## FX behavior
- Each FX has Hold (momentary) and Toggle modes.
- Hold: activates while pressed.
- Toggle: click once to latch on, click again to release.
- The amount slider per FX controls intensity.

## Audio routing notes
MadaMix uses a wrapper injection strategy:
- Deck A/B code is executed together.
- Each `$:` line is wrapped with dynamic `.gain`, `.delay`, `.lpf/.hpf`, `.distort`, and `.room`.
- Mixer/FX values are driven live via `ref()` and a runtime state object.

If your deck code does not use `$:` lines, the wrapper will not be applied.

## Persistence
Projects store:
- `codeA`, `codeB`, `activeDeck`
- `mixer` settings
- `fx` state (per deck)

Old projects are upgraded by moving `code` into `codeA`.
