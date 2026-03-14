# Browser interactive canvas — Step 3 baseline result

## What changed

Step 3 moves layout ownership fully into Browser session state for the graph workspace model layer.

The graph workspace model now:

- reads `x/y` directly from `state.canvasNodes`
- assigns only presentational node frames (`width/height`) by node kind
- derives edge endpoints from those persisted node frames
- keeps selection, focus, and pin metadata in the render model
- no longer computes fresh grid/radial coordinates on every render

## Resulting seam

After this step the responsibilities are separated like this:

- `browserSessionStore.ts`
  - source of truth for canvas membership
  - source of truth for node positions
  - still owns legacy `canvasLayoutMode` state for compatibility
- `browserGraphWorkspaceModel.ts`
  - pure render derivation from session state
  - no passive layout generation
- `BrowserGraphWorkspace.tsx`
  - renders whatever positions the session supplies

## Notes

`canvasLayoutMode` still exists after this step because later work will replace the current passive layout toggle with explicit arrange commands. At this point the flag is retained for UI compatibility, but it no longer causes the workspace model to invent new coordinates.
