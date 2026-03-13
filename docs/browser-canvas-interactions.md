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
- Layout action
  - re-layout toggles between grid and radial layout modes
- Pinning
  - pin/unpin current scope or entity from the canvas or facts panel

## State added to Browser session

- `canvasLayoutMode`
- reducer/actions for:
  - `selectCanvasEntity`
  - `isolateCanvasSelection`
  - `removeCanvasSelection`
  - `toggleCanvasNodePin`
  - `relayoutCanvas`

## User-visible result

A user can now start with one entity, expand inbound/outbound/all dependencies, multi-select the subset worth keeping, isolate that subset, pin key nodes, and re-layout the graph locally.

## Notes

- This is still a lightweight local graph surface, not a full diagram editor.
- The goal is to support common architecture-analysis questions before deeper graph tooling is introduced.
