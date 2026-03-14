# Browser interactive canvas — Step 6: viewport state for pan, zoom, and fit view

This step moves viewport ownership into Browser session state.

## What changed

- Added persisted `canvasViewport` state with:
  - `zoom`
  - `offsetX`
  - `offsetY`
- Added store helpers for viewport updates:
  - `setCanvasViewport(...)`
  - `panCanvasViewport(...)`
- Refactored `BrowserGraphWorkspace` to consume session viewport state instead of local zoom-only component state.
- Added:
  - background pan gesture on the canvas viewport
  - zoom slider backed by session state
  - ctrl/cmd + wheel zoom around pointer position
  - fit-view behavior that computes zoom and offsets from viewport size and graph bounds
- Kept existing fit-view request flow, but the applied viewport is now persisted in Browser session state.

## Resulting seam after Step 6

- Session state now owns:
  - canvas node membership
  - node positions
  - viewport zoom/pan
- Workspace model still owns:
  - renderable node/edge frames
  - canvas bounds
- Workspace component owns:
  - pointer gestures and fit-view calculations

## Remaining future work

- Step 7 can replace passive layout-mode toggling with explicit arrange commands.
- Step 8 can make arrange operations respect manually placed and pinned nodes more deliberately.
