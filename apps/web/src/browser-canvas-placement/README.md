# Browser canvas placement entry point

- Public placement entry point: `index.ts`
- `initialPlacement.ts` handles first/default placement.
- `incrementalPlacement.ts` handles insertion relative to existing canvas content.
- `incrementalPlacementContextBuilder.ts` builds normalized insertion context (visible graph facts, relationships, synthetic layout graph).
- `incrementalPlacementPlanner.ts` resolves which insertion strategy should apply (explicit anchor, graph anchor, scope, peer, append).
- `incrementalPlacementGraphAnchorPolicy.ts` owns graph-anchor candidate ranking and insertion-direction policy.
- `incrementalPlacementPhases.ts` is the shallow entry/orchestration seam over context building + planning + execution.
- `incrementalPlacementStrategies.ts` owns reusable geometric placement primitives used by insertion and relayout flows.
- `relayout.ts` handles grid/focus relayout flows.
- `collision.ts` owns sizing and overlap avoidance helpers.

Prefer adding new layout behavior to a scenario-specific module instead of rebuilding a monolithic placement file.
