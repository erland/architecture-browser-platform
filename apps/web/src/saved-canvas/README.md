# Saved-canvas subsystem boundaries

This subsystem is now physically organized into explicit layers:

- `domain/`: saved-canvas document types, constructors, stable references, and rebinding rules
- `application/`: browser-state mapping, opening workflows, and sync workflows
- `adapters/`: local/remote persistence and browser-session integration

The main implementation families now live under those layers:

- `domain/model/*`: document model implementation owned by the domain layer
- `domain/rebinding-impl/*`: stable reference and rebinding implementation owned by the domain layer
- `application/browser-state/*`: mapping between browser session state and saved-canvas documents
- `application/opening-impl/*`: snapshot resolution and offline availability for opening canvases
- `application/sync-impl/*`: sync workflow model, handlers, and coordinator service
- `adapters/storage-impl/*`: local and remote persistence implementations
- `adapters/browser-session-impl/*`: explicit browser-session boundary contracts and adapters

## Canonical public surfaces

- `saved-canvas/domain`: pure document and rebinding rules
- `saved-canvas/application`: browser-state, opening, and sync use-cases
- `saved-canvas/adapters`: storage and browser-session adapters
- `saved-canvas/index.ts`: top-level public facade for callers that do not need layer-specific imports

## Layer ownership guidance

External non-test consumers should prefer layer-specific imports:

- use `saved-canvas/domain` for document types, stable references, rebinding results, and rebinding UI summaries/messages
- use `saved-canvas/application` for browser-state mapping, opening flows, and sync use-cases
- use `saved-canvas/adapters` for local/remote stores and browser-session integration

The older top-level implementation families have been re-homed under the layers above and should no longer be used as cross-subsystem import targets.

## Facade retirement status

The older top-level saved-canvas compatibility facades (`browserState.ts`, `opening.ts`, `rebinding.ts`, `storage.ts`, `syncing.ts`) have been retired.

Use these public surfaces instead:

- `saved-canvas/domain`
- `saved-canvas/application`
- `saved-canvas/adapters`
- `saved-canvas`

Controllers under `views/` should prefer the layered entrypoints when it improves ownership clarity.
Saved-canvas rules should stay inside this subsystem.
Fallback rebinding rules are evaluated in an explicit ordered pipeline so precedence is visible and testable.


## Facade cleanup

The layer entrypoints (`saved-canvas/domain`, `saved-canvas/application`, and `saved-canvas/adapters`) now export directly from their owned implementation locations. The older layer-local facade files such as `domain/document.ts`, `application/opening.ts`, and `adapters/storage/localStore.ts` have been retired to reduce duplication inside the layers.
