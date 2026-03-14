# Browser interactive canvas — Step 5 manual dragging

This step adds manual node dragging to the Browser canvas.

## What changed

- Browser session state now exposes a `moveCanvasNode` action.
- Canvas nodes keep their persisted `x/y` positions as the user drags them.
- Dragging marks moved nodes as `manuallyPlaced: true` so later arrange logic can distinguish user-positioned nodes from auto-seeded nodes.
- `BrowserGraphWorkspace` now wires mouse-driven dragging directly to Browser session state.
- Existing click-to-focus/select behavior remains, with click suppression after a real drag gesture.

## Main files

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/__tests__/browserSessionStore.test.ts`

## Notes for next step

Step 5 keeps dragging intentionally local to node movement only.
It does not yet introduce a viewport transform model for pan/zoom/world coordinates.
That still belongs to Step 6.
