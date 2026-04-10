# Frontend boundary rules

These are the enforced and intended boundary rules for the Browser frontend. They complement `apps/web/src/README.md` and the repo-level boundary script.

## Enforced rules

The current `npm run check:boundaries` script enforces the following rules.

### Rendering and page composition boundaries
- `components/` must not import transport/cache implementation modules directly.
- `browser-routing/`, `browser-auto-layout/`, and `browser-canvas-placement/` must not depend on `views/` or `components/`.
- Consumers outside `views/browser-view/` must not depend on BrowserView page-composition hooks; use the `views/browser-view` entrypoint or focused controller/application entrypoints instead.

### Graph-stage narrowing
- `browser-routing/` may consume projection only through `browser-projection/index.ts`.
- `browser-auto-layout/` may consume placement only through `browser-canvas-placement/stage.ts`.
- `browser-canvas-placement/` may consume auto-layout only through `browser-auto-layout/stage.ts`.
- `browser-canvas-placement/` and `browser-auto-layout/` may consume canvas sizing and placement-policy helpers only through `browser-graph/canvas/stage.ts`.
- `components/browser-graph-workspace/` must import auto-layout diagnostics through the `browser-auto-layout` entrypoint rather than internal debug files.

### Saved-canvas isolation
- `saved-canvas/domain` must not depend on `views`, `components`, `api`, `contexts`, or `hooks`.
- `saved-canvas/application` must not depend on `views`, `components`, `contexts`, or `hooks`.
- `saved-canvas/adapters` must not depend directly on `views` or `components`.

### Snapshot-cache runtime ownership
- `api/snapshot-cache/runtime.ts` has restricted runtime owners.
- `api/snapshot-cache/types.ts` must flow as type-only imports through approved ownership seams.

### Browser-session narrowing
- Consumers outside `browser-session/` must not use `browser-session/index.ts` or `browser-session/browserSessionStore.ts`.
- Consumers outside `browser-session/` must not use `browser-session/commands/index.ts`; they should use `browser-session/commands-api`.

## Intended dependency direction

These rules should continue guiding refactoring even when the script does not yet enforce every one of them directly.

- `views/` orchestrates the Browser page.
- `components/` renders UI.
- `browser-session/` owns Browser session state and commands.
- `browser-snapshot/` owns prepared snapshot indexing and queries.
- `browser-projection/` owns projection building.
- `browser-graph/workspace/` owns workspace normalization.
- `browser-canvas-placement/` owns initial/incremental placement.
- `browser-auto-layout/` owns layout engine orchestration.
- `browser-routing/` owns the generic routing engine.
- `browser-graph/routing/` owns browser-specific routing defaults.
- `saved-canvas/` owns saved-canvas rules and adapters.
- `api/` owns transport/runtime access.

## Preferred import policy

- Prefer canonical subsystem entrypoints over neighboring internals.
- Prefer stage entrypoints when graph ownership matters.
- Prefer browser-session category entrypoints over root compatibility facades.
- Prefer BrowserView application/controller hooks over page-shell orchestration.
- Prefer saved-canvas layered entrypoints over ad hoc page/component shortcuts.

## Refactoring guardrails

During consolidation:

- do not reintroduce retired root shims,
- do not add new broad compatibility files without a documented retirement step,
- keep algorithmic graph logic out of React component folders,
- keep transport details out of rendering and reducer code where ownership seams already exist.

## Verification

Run both of these after structural refactoring work:

- `npm run check:boundaries`
- `npm run verify:frontend-consolidation:stabilization`


### Tightened transitional guardrails

The boundary script now also forbids these transitional paths outside their owning subsystems:

- `browser-session/types.ts` outside `browser-session/*` and tests. Use one of:
  - `browser-session/session-state-types`
  - `browser-session/canvas-types`
  - `browser-session/focus-types`
  - `browser-session/viewpoint-types`
- graph/projection/rendering code must import class-presentation and relationship-visibility semantics from `browser-graph/semantics`, not from session-owned paths.
- any `browser-projection/* -> browser-session/*` import.
- any `browser-graph/* -> browser-session/*` import.

These rules preserve the final Browser frontend ownership model and prevent reintroducing removed migration shims.

## Retired migration shims
- `views/browser-view/useBrowserViewScreenController.ts` has been removed. Page composition now flows through `views/browser-view/application`.
- `browser-session/model/classPresentation.ts` has been removed. Import class-presentation semantics from `browser-graph/semantics`.
- `browser-session/canvas/relationships.ts` has been removed. Import relationship-visibility semantics from `browser-graph/semantics`.
- Identity graph-contract adapter helpers (`toBrowserGraphPipelineState`, `toBrowserGraphCanvasNodes`, `toBrowserGraphCanvasEdges`) have been removed from `browser-graph/contracts`; consumers should use the contracts directly.
