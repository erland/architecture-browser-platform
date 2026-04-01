# Saved-canvas subsystem boundaries

This subsystem is organized by responsibility:

- `model/`: saved-canvas document types and constructors
- `browser-state/`: mapping between browser session state and saved-canvas documents
- `open/`: snapshot resolution and offline availability for opening canvases
- `rebinding/`: rebinding, accepted-target rewrites, stable references, and UI summaries
  - stable-reference creation, key building, lookup, and resolution are kept as separate modules under `rebinding/`
- `storage/`: local and remote persistence adapters
- `sync/`: sync workflow model, handlers, and coordinator service

Controllers under `views/` may orchestrate these modules, but saved-canvas rules should stay inside this subsystem.
  - fallback rebinding rules are evaluated in an explicit ordered pipeline so precedence is visible and testable
