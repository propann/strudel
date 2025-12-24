# Profile & Creations

## Profile data
Stored locally with:
- player id + display name
- run history + stats
- creations (snapshots)

## Creations
Creations are snapshots of playable work, not the same as Projects:
- Projects = working files
- Creations = saved “works” tied to the player

Each creation can store:
- `codeA`/`codeB` for MadaMix
- `code` for mono
- `bpm`, `mixer`, `fx`
- `type`, `source`, `meta`

## How to save a creation
- In the REPL MadaMix bar, click **Save creation**.
- In Game Mode results, click **Save creation**.

## Import / Export
- Open Profile in Game Mode.
- Use **Export profile** or **Import profile**.

## Manual checks
- Save a creation, refresh, verify it persists.
- Load a creation, confirm codeA/codeB + mixer/fx restored.
- Export/import profile JSON and confirm creations list is preserved.
