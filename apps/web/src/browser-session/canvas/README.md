# Browser session canvas subsystem

This folder is split into focused seams.

## Public barrels

- `index.ts` — public canvas command barrel for broader browser-session usage.
- 
## Focused modules

- `commands.ts` — add/merge canvas commands and command orchestration.
- `mutations.graph.ts` — remove/isolate graph pruning mutations.
- `mutations.selection.ts` — focus and selection mutations.
- `mutations.nodes.ts` — node movement, pinning, and position reconciliation.
- `mutations.presentation.ts` — class presentation mutations.
- `mutations.factsPanel.ts` — facts panel opening.
- `graphPruning.ts` — pure removal/isolation pruning.
- `canvasContentAssembly.ts` — compatibility barrel for add/merge graph assembly use cases.
- `assembly/assembleEntityAddition.ts` — single-entity canvas assembly.
- `assembly/assembleEntitiesAddition.ts` — multi-entity canvas assembly.
- `assembly/assembleScopeAddition.ts` — scope canvas assembly.
- `assembly/assembleDependencyExpansion.ts` — dependency-neighborhood expansion assembly.
- `assembly/shared.ts` — shared pure assembly helpers.
- `canvasMutationApplication.ts` — browser-session state application wiring.
- `canvasNodeTransforms.ts` — pure node/presentation transforms.
- `postMutation.ts` — shared post-mutation normalization/invalidation helpers.
- `canvasMutationResult.ts` — explicit internal mutation result models.

## Working rules

- New mutation behavior should go into the focused module that owns that responsibility.
- Import canvas mutations from focused `mutations.*` modules or from `browser-session/canvas/index.ts` where re-exported intentionally.
- Internal code should prefer importing focused modules directly.
- Keep pure graph/data transforms separate from browser-session state application.
