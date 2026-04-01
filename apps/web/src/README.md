# Web frontend module boundaries

This frontend is split into a few main subsystem boundaries. New code should normally be placed inside one of these boundaries instead of being added directly to page components.

## Browser page orchestration
- `views/`
- Owns page-level composition, startup gating, dialog wiring, and application-service style Browser commands.
- May orchestrate other subsystems, but should not reimplement domain rules from them.

## Browser session/domain state
- `browserSessionStore*.ts`
- `contexts/`
- Owns Browser session state wiring, grouped action surfaces, and persistence/hydration of the live Browser session.
- `contexts/browserSession.types.ts` defines the public grouped session surface, and `contexts/browserSessionActions.ts` builds those action groups so the provider stays wiring-focused.
- This is the main frontend domain layer for the Browser.

## Snapshot query/index model
- `browserSnapshotIndex*.ts`
- Owns in-memory indexing of imported snapshot payloads, scope/entity lookup, search, semantics, and viewpoint query helpers.
- Components and controllers should query this layer instead of rebuilding ad hoc traversal logic.

## Canvas rendering
- `components/BrowserGraphWorkspace*`
- Owns rendering of the graph workspace, menu shells, edge layer, node layer, and facts-panel presentation rendering.
- Rendering files should stay presentation-focused and delegate stateful workflows outward.

## Layout and routing algorithms
- `browser-auto-layout/`
- `browser-routing/`
- `browser-canvas-placement/`
- Own graph layout, route generation, anchor/geometry handling, and mapping algorithm output back onto canvas nodes.
- Avoid mixing JSX or Browser page concerns into these folders.

## Saved-canvas subsystem
- `saved-canvas/`
- Owns saved-canvas document model, browser-state mapping, rebinding, storage adapters, sync, and offline/open flows.
- Saved-canvas rules should remain here even when initiated from Browser page hooks.

## Data access and transport
- `platformApi.ts`
- `httpClient.ts`
- `snapshotCache.ts`
- Own HTTP access, snapshot transport concerns, and cache access.
- Keep transport details out of components and session-store reducers.

## Placement rules
- Put workflow orchestration in `views/` command/controller helpers.
- Put state transitions in the session-store modules.
- Put snapshot lookup/traversal in `browserSnapshotIndex*`.
- Put rendering-only concerns in `components/`.
- Put algorithmic graph behavior in layout/routing folders.
- Put saved-canvas rules in `saved-canvas/`.

## Dependency direction
- `views/` may depend on everything below.
- `components/` may depend on presentation models, session state, and command callbacks, but should avoid backend transport details.
- `browserSessionStore*` may depend on snapshot index, layout/routing, and saved-canvas mapping helpers.
- `saved-canvas/`, `browser-auto-layout/`, and `browser-routing/` should not depend on page components.
