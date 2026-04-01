# Saved-canvas subsystem boundaries

This subsystem is organized by responsibility:

- `model/`: saved-canvas document types and constructors
- `browser-state/`: mapping between browser session state and saved-canvas documents
- `open/`: snapshot resolution and offline availability for opening canvases
- `rebinding/`: rebinding, accepted-target rewrites, stable references, and UI summaries
  - stable-reference creation, key building, lookup, exact resolution, and fallback rule evaluation are kept as separate modules under `rebinding/`
- `storage/`: local and remote persistence adapters
- `sync/`: sync workflow model, handlers, and coordinator service

Public boundary facades:

- `saved-canvas/index.ts`: top-level public surface for document types and saved-canvas workflows
- `saved-canvas/browserState.ts`: browser-state mapping and edit-tracking helpers
- `saved-canvas/opening.ts`: snapshot loading and offline-availability helpers
- `saved-canvas/rebinding.ts`: rebinding APIs, UI summaries, and stable-reference exports
- `saved-canvas/storage.ts`: local/remote persistence adapters
- `saved-canvas/syncing.ts`: sync service creation and sync-state helpers

Controllers under `views/` should prefer these facade modules instead of reaching into deep implementation paths.
Saved-canvas rules should stay inside this subsystem.
Fallback rebinding rules are evaluated in an explicit ordered pipeline so precedence is visible and testable.
