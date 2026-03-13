# Browser Step 11 — Facts/details panel

This step turns the right side of Browser into a dedicated local facts/details surface.

## What changed

- Added `BrowserFactsPanel` as the primary right-hand inspector.
- The panel is driven entirely by prepared local snapshot data and the Browser session state.
- Tree selection, canvas focus, and relationship focus now converge into one local detail surface.
- The older tab-specific tray remains in the center as a migration surface, but the right rail is now the canonical place for focused facts.

## Local facts now shown

### Scope focus

- scope kind and path
- child/direct-descendant counts
- local diagnostics for the scope
- source references
- a short list of direct entities with quick actions

### Entity focus

- entity kind, origin, and scope path
- inbound/outbound relationships
- local diagnostics for the entity
- source references aggregated from entity and directly connected relationships

### Relationship focus

- relationship label/kind
- from/to entities and scope paths
- related diagnostics from the connected entities
- source references aggregated from the relationship and its connected entities

## Current limitations

- The panel is currently placed on the right side only, even though the session model already supports alternate locations.
- Diagnostic hits from the top search do not yet have their own dedicated focus type; they still route indirectly through the broader Browser workflow.
- Rich fact cards, pinning, comparison, and note-taking remain future steps.
