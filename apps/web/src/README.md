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
- Put snapshot index types/build helpers in `browser-snapshot/model/` and snapshot lookup/traversal in `browser-snapshot/query/`.
- Put rendering-only concerns in `components/`.
- Put algorithmic graph behavior in layout/routing folders.
- Put saved-canvas rules in `saved-canvas/`.

## Dependency direction
- `views/` may depend on everything below.
- `components/` may depend on presentation models, session state, and command callbacks, but should avoid backend transport details.
- `browserSessionStore*` may depend on snapshot index, layout/routing, and saved-canvas mapping helpers.
- `saved-canvas/`, `browser-auto-layout/`, and `browser-routing/` should not depend on page components.


## Graph pipeline ownership
- `browser-projection/` owns projection building from browser/session state.
- `browser-graph/workspace/` owns projection-to-workspace normalization and browser workspace model assembly.
- `browser-canvas-placement/` owns initial and incremental placement plus post-layout cleanup.
- `browser-auto-layout/` owns layout engine orchestration and layout mode implementations.
- `browser-routing/` owns the generic routing engine and route extraction.
- `browser-graph/routing/` owns browser-specific routing defaults only.
- `browser-graph/presentation/` owns browser-facing display semantics and viewpoint presentation policy.
- `browser-graph/canvas/` owns browser-facing node sizing, viewport helpers, and placement-policy constants.
- `components/browser-graph-workspace/` owns React rendering only.

## Strict graph ownership notes
- The strict graph ownership model is documented in `docs/refactoring/browser-graph-pipeline.md`.
- Prefer stage-specific imports when ownership matters.
- Do not place generic routing engine logic in `browser-graph/routing/`; keep it in `browser-routing/`.
- Do not place layout mode orchestration in `browser-canvas-placement/`; keep it in `browser-auto-layout/`.
- Do not place low-level graph algorithms in `components/browser-graph-workspace/`.

## Canonical public entrypoints
- `api/`
- `browser-auto-layout/`
- `browser-canvas-placement/`
- `browser-graph/`
- `browser-graph/canvas/`
- `browser-graph/presentation/`
- `browser-graph/routing/`
- `browser-graph/workspace/`
- `browser-projection/`
- `browser-routing/`
- `browser-session/`
- `browser-snapshot/`
- `components/browser-graph-workspace/`
- `saved-canvas/`
- `views/browser-view/`
- `views/saved-canvas-controller/`

Prefer importing from these subsystem entrypoints rather than from transitional compatibility shims. Root-level frontend compatibility files have been retired; use subsystem entrypoints or stage-owned modules directly.

- `views/browser-view/controllers/` groups BrowserView feature-controller hooks for workspace/startup, canvas/search, and dialogs/saved-canvas orchestration.


## Consolidation baseline notes
- The consolidation baseline is documented in `docs/refactoring/frontend-consolidation-baseline.md`.
- During consolidation, keep canonical public entrypoints stable unless a later refactoring step explicitly replaces them.
- Use `docs/refactoring/frontend-duplication-retirement-map.md` as the detailed inventory of canonical structures, transitional facades, compatibility shims, and retirement candidates.
- Do not add new compatibility or forwarding files unless the migration need is concrete and the retirement step is documented.
- Prefer moving consumers to canonical subsystem entrypoints over introducing fresh shim layers.


## Browser-session consolidation notes
- `browser-session/model/` is the preferred internal home for core state/types/helpers.
- `browser-session/navigation/` is the preferred internal home for search, scope selection, tree mode, and invariants.
- `browser-session/lifecycle/` is the preferred internal home for hydration/persistence/opening behavior.
- `browser-session/facts-panel/` is the preferred internal home for facts-panel focus/open behavior.
- `browser-session/commands/` is the preferred internal command-oriented surface over adding more flat `browserSessionStore.*` entrypoints.

## BrowserView application-layer notes
- `views/browser-view/application/` is the preferred internal home for Browser screen-level composition.
- `views/browser-view/controllers/` should keep owning feature-specific orchestration beneath that application layer.
- `useBrowserViewScreenController` remains the page-facing compatibility facade; new internal composition should prefer the application layer.

## Final stabilization notes
- Keep `useBrowserViewScreenController` as a composition boundary and add new Browser page behavior through feature controllers under `views/browser-view/controllers/`.
- Prefer `saved-canvas/domain`, `saved-canvas/application`, and `saved-canvas/adapters` when choosing where new saved-canvas code belongs.
- Keep React rendering concerns in `components/browser-graph-workspace/`; do not move layout, routing, or placement logic there.
- Prefer canonical subsystem entrypoints for imports and avoid reintroducing root-level compatibility shims.
- Run `npm run check:boundaries` after structural cleanup; it enforces the current cross-layer import rules around browser-session wrappers, saved-canvas adapters, and snapshot-cache runtime ownership.


## Browser-snapshot consolidation notes
- `browser-snapshot/model/` is the preferred internal home for snapshot index types and build/cache helpers.
- `browser-snapshot/query/` is the preferred internal home for scope/entity/dependency/search queries.
- `browser-snapshot/support/` is the preferred internal home for semantic/display/sort/source-ref helpers.
- `browser-snapshot/viewpoints/` is the preferred internal home for viewpoint availability and graph resolution helpers.
- Keep `browser-snapshot/` as the canonical public entrypoint. The old `browserSnapshotIndex*.ts` compatibility family has been retired; use `browser-snapshot/model`, `query`, `support`, and `viewpoints` for the internal stage surfaces.


## Consolidation stabilization notes
- The final consolidation review is documented in `docs/refactoring/platform-consolidation-review.md`.
- Use `npm run verify:frontend-consolidation:stabilization` after structural cleanup to catch architecture-regression signals.
- Do not reintroduce retired root shims or top-level saved-canvas facades.
- Prefer the BrowserView application layer, browser-session category entrypoints, browser-snapshot model/query/support/viewpoints split, and saved-canvas layered entrypoints for new work.


- Graph algorithm and projection code should prefer stage-specific imports such as `browser-graph/canvas` and `browser-graph/presentation` instead of the broad `browser-graph` root when ownership matters. See `docs/refactoring/graph-complexity-reduction-step3.md`.


- BrowserView screen application layering was tightened further in `docs/refactoring/browser-view-application-consolidation-step4.md`.
- auto-layout shared decision helpers live under `browser-auto-layout/shared/` and should be preferred over repeating mode-selection logic in each mode


BrowserView orchestration helpers now live primarily under `views/browser-view/controllers/internal/`; top-level `useBrowserView*.ts` hooks are compatibility facades where they still exist.
