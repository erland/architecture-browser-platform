# browser-session

This subsystem owns the live Browser session state for the frontend.

## Internal structure

The preferred internal organization is:

- `model/`
  - session state types
  - state cloning/creation helpers
  - low-level collection helpers
- `navigation/`
  - selected scope
  - search query and results
  - tree mode
  - invariants tied to snapshot/index validity
- `lifecycle/`
  - opening a snapshot session
  - hydration
  - persistence
- `facts-panel/`
  - facts-panel focus/open behavior
- `commands/`
  - command-oriented surface that composes canvas, viewpoint, and higher-level session commands
- `canvas/`
  - canvas node/edge insertion, mutation, relationships, and viewport behavior
- `viewpoints/`
  - viewpoint selection, apply mode, scope mode, and presentation preference behavior
- `ports/`
  - explicit cross-subsystem contracts, such as the saved-canvas boundary

## Consolidation notes

The grouped folders above now contain the primary implementation files.
The remaining `browserSessionStore.*` files are compatibility wrappers kept to
avoid a risky big-bang rename while consumers finish converging on the grouped
internal structure.


## Public API

The root `browser-session` entrypoint is now limited to stable consumer-facing
surfaces. Internal helpers such as low-level collection utilities, canvas helper
functions, and saved-canvas port contracts should be imported from precise
internal paths only when working inside the subsystem.
