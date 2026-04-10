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
  - pure mutation bundles for lifecycle/navigation/viewpoint/canvas/facts-panel changes
  - binding helpers that adapt those mutations to a `setState` boundary
- `canvas/`
  - canvas node/edge insertion, mutation, relationships, and viewport behavior
- `viewpoints/`
  - viewpoint selection, apply mode, scope mode, and presentation preference behavior
- `ports/`
  - explicit cross-subsystem contracts, such as the saved-canvas boundary

## Consolidation notes

The grouped folders above now contain the primary implementation files. The old
`browserSessionStore.*` compatibility wrappers have now been retired, so new
imports should target the narrow category entrypoints (`browser-session/types`, `state`, `lifecycle-api`, `navigation-api`, `canvas-api`, `viewpoints-api`, `facts-panel-api`, `commands-api`) or the owning grouped folder directly when working inside the subsystem. The root `browser-session` entrypoint remains a broad compatibility facade only.

## Public API

Consumers outside `browser-session/` should prefer the narrow category entrypoints instead of the root `browser-session` or `browserSessionStore.ts` compatibility facades. Internal helpers such as low-level collection utilities, canvas helper functions, and saved-canvas port contracts should be imported from precise internal paths only when working inside the subsystem.
