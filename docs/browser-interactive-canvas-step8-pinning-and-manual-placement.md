# Browser Interactive Canvas — Step 8: Respect pinning and manual placement during arrange operations

This step changes arrange behavior so explicit arrange commands no longer overwrite anchored user intent.

## What changed

- Pinned nodes keep their existing coordinates during `Arrange all` and `Arrange around focus`.
- Manually placed nodes keep their existing coordinates during arrange operations.
- If the focused entity was manually placed or pinned, focused arrange uses its current position as the anchor instead of moving it to a canonical center point.
- Only eligible non-anchored nodes are repositioned by arrange helpers.

## Main implementation seam

- `apps/web/src/browserCanvasPlacement.ts` now treats `pinned` and `manuallyPlaced` nodes as anchored nodes during arrangement.
- `apps/web/src/browserSessionStore.ts` continues to call explicit arrange commands, but the placement helpers now preserve anchored node coordinates.

## Expected end state after this step

The Browser canvas behaves more like an analysis tool with a stable mental map:

- drag a node → it stays where the user placed it
- pin a node → arrange commands do not move it
- arrange commands still help clean up the rest of the graph
