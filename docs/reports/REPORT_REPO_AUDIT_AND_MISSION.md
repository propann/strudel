# REPORT_REPO_AUDIT_AND_MISSION

## Architecture (summary)
Monorepo pnpm with packages and website. REPL is React inside Astro. Audio pipeline runs through @strudel/core -> @strudel/webaudio. Game Mode is a separate route that uses the same ProjectStore.

ASCII map:

repo
|-- package.json (root scripts)
|-- pnpm-workspace.yaml
|-- packages/
|   |-- core (scheduler/repl engine)
|   |-- webaudio (audio output)
|   |-- codemirror (editor wrapper: StrudelMirror)
|   `-- ...
`-- website/
    |-- astro.config.mjs (site/base for GH Pages)
    |-- src/pages/index.astro (REPL)
    |-- src/pages/game.astro (/game)
    |-- src/repl (REPL UI + state)
    `-- src/game (ProjectStore + GamePage)

Key entry points
- Website entry: `website/src/pages/index.astro` -> `website/src/repl/Repl.jsx` -> `website/src/repl/useReplContext.jsx`.
- REPL editor: `packages/codemirror/codemirror.mjs` (StrudelMirror).
- Audio: `packages/core/repl.mjs` (scheduler) + `packages/webaudio/webaudio.mjs` (output).
- Routing: Astro pages in `website/src/pages/*`.
- Save system:
  - `website/src/settings.mjs` (settingsMap, localStorage, includes latestCode).
  - `website/src/game/projectStore.mjs` (IndexedDB, ProjectStore, save status, currentProjectId).
  - `website/src/repl/useReplContext.jsx` wires ProjectStore <-> REPL.

## Points of pain (observed)
1) Astro base/site split (GH Pages vs prod) risks broken links or asset paths if env vars not set.
2) Save system is split between settingsMap and ProjectStore; ownership boundaries need to stay clear to avoid loops.
3) REPL UI and /game UI are separate with minimal shared navigation; can feel like two apps.
4) Autosave in ProjectStore relies on IDB and timers; no visible retry/backoff in UI.
5) Dev server can fail on restricted host/port (e.g. 0.0.0.0) in sandboxed environments.
6) Native deps in workspace (sharp, tree-sitter) can break installs on CI or new machines.
7) Lint/test exist but not consistently used in docs; no single quick-start workflow for game mode.
8) Controls/Sliders are editor-centric; no unified UX for parameters in Game Mode.
9) No explicit Level 1 game loop spec (states, win conditions, progression) in repo.
10) No explicit plan for multi-project workflows (templates, examples, import/export UX).

## Improvements (prioritized)
P0
- Stabilize ProjectStore as single source of truth for code/bpm + current project selection.
- REPL transport UX and save feedback (already partially delivered).
- Projects UI baseline (list + CRUD + import/export) in panel.
- /game uses ProjectStore and persists on refresh.

P1
- Game Mode Level 1: minimal loop, scoring, feedback, clear win/lose criteria.
- Controls/Sliders UX: consistent controls for code params with guardrails.
- Deck A/B: fast toggle between two project states (A/B compare) using ProjectStore.
- Improve /game <-> / link discoverability and context (breadcrumbs, return actions).

P2
- Onboarding and docs alignment: quickstart for REPL + Game Mode with screenshots.
- DevEx: make lint/test steps visible in docs and update root scripts or doc references.
- Save/import UX polish: validation, warnings, and success toast feedback.

## Mission plan (sprints)
Sprint 1: UX REPL + Projects foundation
Objectives
- Compact transport bar + shortcuts + save indicator.
- Minimal Projects UI with CRUD + import/export + selection.
- Persist currentProjectId via ProjectStore.

Tasks
- REPL header transport (centered controls, BPM input, save status).
- Keyboard shortcuts for play/stop and run.
- Projects panel (list + New/Rename/Duplicate/Delete/Select).
- Import/export JSON for current project.

Files/modules
- `website/src/repl/components/Header.jsx`
- `website/src/repl/useReplContext.jsx`
- `website/src/repl/components/panel/Panel.jsx`
- `website/src/repl/components/panel/ProjectsTab.jsx`
- `website/src/game/projectStore.mjs`
- `packages/codemirror/codemirror.mjs`

Acceptance criteria (testable)
- Space toggles play/stop; Ctrl+Enter runs.
- Save indicator shows saved/saving/error based on ProjectStore.
- Projects CRUD works; import creates a copy.
- Refresh keeps current project code + BPM.
- `/game` route remains reachable.

Risks + mitigations
- Risk: sync loops between settingsMap and ProjectStore. Mitigation: guard via suppress flags.
- Risk: BPM desync. Mitigation: write-through on change, read-back on load.

Sprint 2: Game Mode Level 1 (MVP loop)
Objectives
- Define Level 1 spec and implement loop in /game.
- Score/progress UI and completion criteria.

Tasks
- Level 1 content spec (patterns, goals, failure conditions).
- Game state machine (idle -> playing -> success/fail).
- Basic scoring + feedback (visual, audio optional).
- Save progress in ProjectStore snapshots.

Files/modules
- `website/src/game/GamePage.jsx`
- `website/src/game/projectStore.mjs`
- `website/src/pages/game.astro`

Acceptance criteria
- Level 1 playable end-to-end.
- Score/progress visible and persists in ProjectStore snapshots.
- No regressions to REPL or audio output.

Risks + mitigations
- Risk: audio engine conflicts with REPL. Mitigation: keep game audio isolated, no global resets.
- Risk: scope creep on game UI. Mitigation: lock level spec and keep visuals minimal.

Sprint 3: Controls/Sliders UX
Objectives
- Make parameter control discoverable and safe in REPL and Game Mode.

Tasks
- Inventory existing slider widgets.
- Add consistent control surface (panel) for active params.
- Guardrails (min/max, reset to default).

Files/modules
- `packages/codemirror/slider.mjs`
- `website/src/repl/components/panel/*`
- `website/src/repl/useReplContext.jsx`

Acceptance criteria
- Sliders render consistently across REPL.
- Parameter changes reflect in audio without errors.

Risks + mitigations
- Risk: CodeMirror widget conflicts. Mitigation: keep to existing widget API and minimal UI.

Sprint 4: Deck A/B
Objectives
- Fast A/B switch between two project states.

Tasks
- Add two project slots per user session (A/B).
- Quick toggle + copy A->B / B->A.
- Persist both in ProjectStore.

Files/modules
- `website/src/game/projectStore.mjs`
- `website/src/repl/components/Header.jsx`
- `website/src/repl/components/panel/ProjectsTab.jsx`

Acceptance criteria
- Toggle between A/B changes code + bpm instantly.
- A/B persists after refresh.

Risks + mitigations
- Risk: confusing UX. Mitigation: add clear labels and reset flows.

## Next actions (1 week checklist)
- [ ] Confirm Sprint 2 Level 1 spec (goals + win/lose).
- [ ] Define scoring rules and snapshot events.
- [ ] Draft minimal UI mock for /game Level 1.
- [ ] Align /game navigation link in REPL and docs.
- [ ] Add a quick-start doc section for game mode.
