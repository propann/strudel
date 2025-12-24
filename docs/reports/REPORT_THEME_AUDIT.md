# Theme Audit - Team Mada

## Existing token sources
- `website/src/components/HeadCommon.astro`: fallback `:root` vars (`--background`, `--lineBackground`, `--foreground`, etc.).
- `website/src/components/HeadCommonNext.astro`: same fallback `:root` vars.
- `website/src/repl/Repl.css`: REPL tokens + MadaMix tokens (`--mada-*`, `--mada-deck-a/b`).
- `website/src/styles/index.css`: global layout vars (`--app-height`, `--app-width`).

## Palette inventory (current)
- Core: `--background`, `--lineBackground`, `--foreground`, `--caret`, `--selection`, `--selectionMatch`, `--lineHighlight`, `--gutterBackground`, `--gutterForeground`.
- MadaMix: `--mada-bg`, `--mada-surface`, `--mada-glow`, `--mada-accent`, `--mada-accent-2`, `--mada-border`, `--mada-deck-a`, `--mada-deck-b`.

## Hardcoded color usage (examples)
- `website/src/repl/components/StatusBar.jsx`: `border-red-400/40` and red text classes.
- `website/src/repl/components/Header.jsx`: shadow uses `rgba(0,0,0,0.18)`.
- `website/src/repl/Repl.css`: multiple `rgba(...)` values for surfaces/glows and `linear-gradient(...)` colors.
- `website/src/repl/tunes.mjs`, `website/src/repl/drawings.mjs`: literal hex values for pattern colors.

## Inconsistencies / risks
- Team Mada tokens live only in `website/src/repl/Repl.css`, not centralized.
- Fallback tokens in `HeadCommon*.astro` do not include MadaMix or Team Mada palette.
- Some UI components rely on Tailwind utility colors (red/green/yellow) rather than theme tokens.
- Multiple sources define background/foreground defaults (HeadCommon vs Repl.css).

## Components likely needing normalization
- `website/src/repl/components/madamix/MadaMixBar.jsx`
- `website/src/repl/components/madamix/FxRack.jsx`
- `website/src/repl/components/madamix/DeckVolume.jsx`
- `website/src/repl/components/StatusBar.jsx`
- `website/src/repl/components/Header.jsx`
- `website/src/repl/Repl.css`
