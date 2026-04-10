# Frontend final architecture after Browser consolidation

This document records the intended end-state after Steps 1-10 of the Browser frontend refactor.

## Core ownership model

### Browser page orchestration
- `views/browser-view/application/` owns Browser screen composition.
- `views/browser-view/controllers/` owns focused Browser feature orchestration.
- `BrowserView.tsx` is a page shell that renders application-composed sections.

### Browser session and workflow state
- `browser-session/` owns session state, Browser commands, navigation state, lifecycle behavior, facts-panel state, and viewpoint workflow state.
- External consumers should import narrow session entrypoints rather than broad compatibility facades.

### Graph pipeline
- `browser-projection/` owns projection from Browser state to graph-stage inputs.
- `browser-graph/contracts/` owns shared graph-stage contracts.
- `browser-graph/semantics/` owns graph/projection-facing semantics such as class presentation and relationship visibility.
- `browser-graph/workspace/` owns workspace normalization and workspace model assembly.
- `browser-canvas-placement/` owns initial/incremental placement.
- `browser-auto-layout/` owns layout orchestration and layout modes.
- `browser-routing/` owns generic routing.
- `components/browser-graph-workspace/` owns React rendering only.

### Snapshot and saved-canvas
- `browser-snapshot/` owns imported snapshot indexing, lookup, and query helpers.
- `saved-canvas/` owns saved-canvas domain, application workflows, and adapters.

## Final dependency direction
- `views/` may orchestrate lower layers but should not own graph semantics, layout logic, or snapshot traversal rules.
- `components/` render and dispatch callbacks; they should not own Browser page orchestration or transport logic.
- `browser-session/` may depend on snapshot/query helpers and graph stage contracts, but graph stages should not depend back on session internals directly.
- Graph stages should depend on `browser-graph/contracts` and `browser-graph/semantics` rather than temporary session shims.

## Retired migration seams
- Browser page composition no longer uses `useBrowserViewScreenController.ts`.
- Graph and projection semantics no longer flow through `browser-session/model/classPresentation.ts` or `browser-session/canvas/relationships.ts`.
- Identity adapter helpers were removed from `browser-graph/contracts`; use the shared contracts directly.

## Ongoing guardrails
- Run `npm run check:boundaries` after structural work.
- Run `npm run verify:frontend-consolidation:stabilization` after changing frontend architecture docs or public entrypoints.
- Do not reintroduce broad compatibility barrels or page-composition shims without a documented migration step.
