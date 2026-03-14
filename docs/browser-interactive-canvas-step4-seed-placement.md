# Browser Interactive Canvas — Step 4 Seed Placement and Incremental Placement

## What changed

Step 4 introduces a dedicated Browser canvas placement utility module and moves new-node placement decisions out of ad hoc session-store defaults.

## New placement helpers

The new `apps/web/src/browserCanvasPlacement.ts` module now provides reusable heuristics for:

- first insertion on an empty canvas
- appending a new cluster to the side of existing content
- radial neighbor placement around a focused entity
- contained placement near a visible scope container
- peer placement near existing entities in the same scope
- simple deterministic collision avoidance

## Browser session behavior after this step

The Browser session store now uses contextual placement when adding nodes:

- `addEntityToCanvas` places new entities near the current context instead of triggering a full relayout
- `addEntitiesToCanvas` incrementally places each newly added entity while preserving existing node positions
- `addScopeToCanvas` appends scope nodes without disturbing the existing canvas
- `addDependenciesToCanvas` keeps the focal entity stable and places inbound/outbound neighbors around it

## Intentional limitations

This is still a lightweight Browser analysis canvas, not a full modelling layout engine.
The heuristics are deterministic and good enough for incremental Browser exploration, but later steps still need:

- manual dragging
- viewport pan/zoom state
- explicit arrange commands
- pin/manual-placement-aware arrange logic

## Main files touched

- `apps/web/src/browserCanvasPlacement.ts`
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/__tests__/browserSessionStore.test.ts`
