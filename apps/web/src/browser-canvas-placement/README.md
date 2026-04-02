# Browser canvas placement entry point

- Public placement entry point: `index.ts`
- `initialPlacement.ts` handles first/default placement.
- `incrementalPlacement.ts` handles insertion relative to existing canvas content.
- `incrementalPlacementPhases.ts` aligns insertion planning with the layout pipeline (graph preparation, explicit-anchor placement, graph-aware placement, scope/peer fallback, append fallback).
- `incrementalPlacementStrategies.ts` owns reusable placement primitives used by insertion and relayout flows.
- `relayout.ts` handles grid/focus relayout flows.
- `collision.ts` owns sizing and overlap avoidance helpers.

Prefer adding new layout behavior to a scenario-specific module instead of rebuilding a monolithic placement file.
