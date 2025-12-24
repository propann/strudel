# MadaMix UI - Deck Logic + Shortcuts

## Deck focus
- A single editor is shown.
- `activeDeck` controls which buffer is visible:
  - Deck A => editor shows `codeA`
  - Deck B => editor shows `codeB`
- The active deck is highlighted in the MadaMix bar and the editor badge.

## Mixer behavior
- Crossfader uses equal-power mixing:
  - gA = cos(x * PI/2) * volA
  - gB = sin(x * PI/2) * volB
- Volume A affects only Deck A.
- Volume B affects only Deck B.

## FX mapping
- Deck A FX affect only Deck A.
- Deck B FX affect only Deck B.
- Modes:
  - Hold: active while pressed.
  - Toggle: click to latch.

## Shortcuts
- `Alt+1` focus Deck A
- `Alt+2` focus Deck B
- `X` center crossfader
- `Q/W/E/R` FX Deck A (Echo / Filter / Disto / Reverb)
- `U/I/O/P` FX Deck B (Echo / Filter / Disto / Reverb)

Stop all audio using the REPL Stop button.
