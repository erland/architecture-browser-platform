# Browser Step 12 — Canvas interaction patterns

This step turns the local canvas from a static surface into a working analysis tool.

## What was added

- Multi-select for canvas entities
  - click entity node selects it
  - Shift/Cmd/Ctrl-click toggles additional entities into the current selection
- Analysis-oriented dependency expansion actions
  - who depends on this? (inbound)
  - what does this depend on? (outbound)
  - what is around this? (all directions)
- Selection actions
  - isolate selection
  - remove selection from canvas
- Layout actions
  - Arrange all performs a manual deterministic full-canvas arrange
  - Arrange around focus performs a manual focused arrange around the selected/focused entity
- Pinning
  - pin/unpin current scope or entity from the canvas or facts panel

## State added to Browser session

- `canvasLayoutMode` (now a lightweight record of the last arrange style, not a passive render-time layout source)
- reducer/actions for:
  - `selectCanvasEntity`
  - `isolateCanvasSelection`
  - `removeCanvasSelection`
  - `toggleCanvasNodePin`
  - `arrangeAllCanvasNodes`
  - `arrangeCanvasAroundFocus`

## User-visible result

A user can now start with one entity, expand inbound/outbound/all dependencies, multi-select the subset worth keeping, isolate that subset, pin key nodes, drag important nodes into place, pan/zoom around the canvas, and use explicit arrange commands when needed.

## Notes

- This is still a lightweight local graph surface, not a full diagram editor.
- The goal is to support common architecture-analysis questions before deeper graph tooling is introduced.

## Interactive-canvas update

The Browser canvas has since moved beyond the original Step 12 behavior:

- node positions are persisted in session state
- dragging updates node coordinates directly
- dragged nodes become `manuallyPlaced`
- viewport state now owns pan/zoom/fit-view behavior
- new nodes are placed incrementally near relevant context
- arrange commands preserve pinned and manually placed nodes

This document should now be read together with:

- `docs/browser-interactive-canvas.md`
- `docs/browser-interactive-canvas-continuation-notes.md`
