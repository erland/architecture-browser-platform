# Browser interactive canvas — Step 9 UI tests and regression coverage

This step strengthens the interactive-canvas safety net without changing Browser behavior.

## Added coverage

- viewport math is now covered with focused pure-unit tests:
  - drag movement is converted from screen space into canvas space using the current zoom
  - pan updates viewport offsets directly in screen space
  - ctrl/cmd zoom keeps the same world point under the pointer
  - fit view centers content and clamps zoom to supported min/max bounds
- BrowserGraphWorkspace static markup coverage now asserts that the interactive canvas toolbar exposes:
  - Arrange all
  - Arrange around focus
  - Fit view
  - zoom status
  - pinned-node count

## Supporting refactor

A small pure helper module (`browserCanvasViewport.ts`) now owns the interaction math previously embedded directly in `BrowserGraphWorkspace.tsx`.
This keeps the runtime behavior the same while making the interactive rules easy to test in the Node/Jest environment already used by the repo.

## Why this matters

The Browser canvas is now driven by persisted node coordinates and viewport state. That makes interaction correctness more important than before:
- dragging must not drift at different zoom levels
- pointer-centered zoom must preserve the user’s mental position
- fit view must stay bounded and predictable
- toolbar affordances should remain visible as future Browser refactors continue
