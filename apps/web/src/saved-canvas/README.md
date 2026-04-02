# Saved-canvas subsystem boundaries

This subsystem is now organized into explicit layers:

- `domain/`: saved-canvas document types, constructors, stable references, and rebinding rules
- `application/`: browser-state mapping, opening workflows, and sync workflows
- `adapters/`: local/remote persistence and browser-session integration

Legacy implementation folders still exist underneath these facades:

- `model/`: document model implementation consumed by the domain layer
- `browser-state/`: mapping between browser session state and saved-canvas documents
- `open/`: snapshot resolution and offline availability for opening canvases
- `rebinding/`: accepted-target rewrites, stable references, fallback rules, and UI summaries
- `storage/`: local and remote persistence implementations
- `sync/`: sync workflow model, handlers, and coordinator service
- `ports/`: explicit browser-session boundary contracts

## Canonical public surfaces

- `saved-canvas/domain`: pure document and rebinding rules
- `saved-canvas/application`: browser-state, opening, and sync use-cases
- `saved-canvas/adapters`: storage and browser-session adapters
- `saved-canvas/index.ts`: top-level public facade for callers that do not need layer-specific imports

## Compatibility facades

These files remain as compatibility surfaces during the migration and now forward into the layered structure:

- `saved-canvas/browserState.ts`
- `saved-canvas/opening.ts`
- `saved-canvas/rebinding.ts`
- `saved-canvas/storage.ts`
- `saved-canvas/syncing.ts`

Controllers under `views/` should prefer the layered facades when it improves ownership clarity.
Saved-canvas rules should stay inside this subsystem.
Fallback rebinding rules are evaluated in an explicit ordered pipeline so precedence is visible and testable.
