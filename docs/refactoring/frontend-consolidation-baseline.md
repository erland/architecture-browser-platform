# Frontend consolidation baseline

This document is the stabilization baseline for the Browser frontend consolidation work. It records the package ownership and the transitional seams that are allowed to exist while the remaining cleanup steps are implemented.

## Goal

Keep the Browser frontend moving toward a structure where:

- `views/` owns Browser page orchestration.
- `components/` owns rendering.
- `browser-session/` owns Browser session state, commands, and domain-facing state transitions.
- `browser-snapshot/` owns prepared snapshot indexing and query helpers.
- `browser-projection/`, `browser-graph/`, `browser-canvas-placement/`, `browser-auto-layout/`, and `browser-routing/` form the graph pipeline.
- `saved-canvas/` owns saved-canvas rules, persistence mapping, and sync/open workflows.
- `api/` owns transport and snapshot-cache runtime access.

## Current canonical subsystem boundaries

### Browser page orchestration
- `apps/web/src/views/`
- `apps/web/src/views/browser-view/`
- `apps/web/src/views/saved-canvas-controller/`

Owns Browser page-level composition, startup gating, dialog wiring, and controller-driven screen orchestration.

### Browser session/domain state
- `apps/web/src/browser-session/types`
- `apps/web/src/browser-session/state`
- `apps/web/src/browser-session/lifecycle-api`
- `apps/web/src/browser-session/navigation-api`
- `apps/web/src/browser-session/canvas-api`
- `apps/web/src/browser-session/viewpoints-api`
- `apps/web/src/browser-session/facts-panel-api`
- `apps/web/src/browser-session/commands-api`
- `apps/web/src/browser-session/model/`
- `apps/web/src/browser-session/navigation/`
- `apps/web/src/browser-session/lifecycle/`
- `apps/web/src/browser-session/facts-panel/`
- `apps/web/src/browser-session/canvas/`
- `apps/web/src/browser-session/viewpoints/`
- `apps/web/src/browser-session/commands/`
- `apps/web/src/contexts/`
- `apps/web/src/contexts/app-selection/`

Owns Browser session state wiring and state transitions.

### Snapshot query/index model
- `apps/web/src/browser-snapshot/`
- `apps/web/src/browser-snapshot/application/`
- `apps/web/src/browser-snapshot/model/`
- `apps/web/src/browser-snapshot/query/`
- `apps/web/src/browser-snapshot/support/`
- `apps/web/src/browser-snapshot/viewpoints/`

Owns in-memory prepared snapshot indexing and lookup/query helpers.

### Graph pipeline
- `apps/web/src/browser-projection/`
- `apps/web/src/browser-graph/`
- `apps/web/src/browser-graph/canvas/`
- `apps/web/src/browser-graph/presentation/`
- `apps/web/src/browser-graph/routing/`
- `apps/web/src/browser-graph/workspace/`
- `apps/web/src/browser-canvas-placement/`
- `apps/web/src/browser-auto-layout/`
- `apps/web/src/browser-routing/`

Owns projection building, workspace shaping, placement, layout, and routing.

### Rendering
- `apps/web/src/components/browser-graph-workspace/`
- `apps/web/src/components/browser-facts-panel/`
- `apps/web/src/components/browser-navigation/`
- `apps/web/src/components/browser-search/`
- `apps/web/src/components/browser-source-tree/`
- `apps/web/src/components/browser-source-view/`
- `apps/web/src/components/browser-viewpoints/`
- `apps/web/src/components/saved-canvas/`

Owns React rendering and presentation composition only.

### Saved-canvas subsystem
- `apps/web/src/saved-canvas/domain/`
- `apps/web/src/saved-canvas/application/`
- `apps/web/src/saved-canvas/adapters/`

Owns saved-canvas document model, browser-state mapping, rebinding, sync, and storage adapters.

### Transport/cache
- `apps/web/src/api/`
- `apps/web/src/api/snapshot-cache/`

Owns HTTP access and snapshot-cache runtime ownership.

## Canonical public entrypoints

Prefer subsystem entrypoints over broad or legacy roots:

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
- `browser-session/types`
- `browser-session/state`
- `browser-session/lifecycle-api`
- `browser-session/navigation-api`
- `browser-session/canvas-api`
- `browser-session/viewpoints-api`
- `browser-session/facts-panel-api`
- `browser-session/commands-api`
- `browser-snapshot/`
- `components/browser-graph-workspace/`
- `saved-canvas/`
- `views/browser-view/`
- `views/saved-canvas-controller/`

## Transitional seams still allowed during consolidation

These exist to support the current migration and should shrink over time rather than grow:

- `browser-session/browserSessionStore.ts` as a narrowed legacy bootstrap facade that should not grow again.
- Stage entrypoints such as `browser-canvas-placement/stage.ts`, `browser-auto-layout/stage.ts`, and `browser-graph/canvas/stage.ts` that narrow graph-stage imports without forcing a larger re-home in one step.

## Stabilization rules

- Do not add new top-level compatibility shims.
- Prefer moving consumers to canonical subsystem entrypoints over adding forwarding files.
- Keep `views/` as the Browser orchestration layer.
- Keep `components/` presentation-focused.
- Keep algorithmic logic out of React rendering folders.
- Run `npm run check:boundaries` after structural changes.
- Run `npm run verify:frontend-consolidation:stabilization` after refactoring steps that change boundaries or introduce/remove adapters.


## Step 8 stabilization delta

After Step 7, the remaining high-risk drift was continued use of transitional compatibility paths. Step 8 tightens the stabilization guardrails by:

- forbidding broad `browser-session/types` imports outside `browser-session/*` and tests,
- forbidding session-shim replacements for graph semantics and requiring `browser-graph/semantics` instead,
- forbidding direct `browser-projection/* -> browser-session/*` imports,
- forbidding direct `browser-graph/* -> browser-session/*` imports.

This makes the graph pipeline ownership rules enforceable rather than only documented.


## Step 10 finalization delta

Step 10 removes the remaining temporary adapters introduced during the migration:

- `views/browser-view/useBrowserViewScreenController.ts` is retired; Browser page composition now flows through `views/browser-view/application`.
- `browser-session/model/classPresentation.ts` and `browser-session/canvas/relationships.ts` are retired; graph semantics now come directly from `browser-graph/semantics`.
- Identity adapters were removed from `browser-graph/contracts`; graph stages consume the shared contracts directly.

The final ownership model is documented in `docs/refactoring/frontend-final-architecture.md`.
