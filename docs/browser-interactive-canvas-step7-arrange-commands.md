# Browser interactive canvas — Step 7: explicit arrange commands

This step removes the old passive "Re-layout" toolbar behavior and replaces it with explicit user-invoked arrange commands.

## What changed

- The canvas toolbar now exposes:
  - `Arrange all`
  - `Arrange around focus`
  - `Fit view`
- `Arrange all` rewrites current canvas node positions into a deterministic grid-style layout.
- `Arrange around focus` rewrites current canvas node positions around the focused entity:
  - focused entity is placed centrally
  - inbound neighbors are placed to the left
  - outbound neighbors are placed to the right
  - mixed neighbors are placed around the focus
  - remaining nodes are appended without disturbing edge semantics
- Arrange commands are explicit state transitions in the Browser session store.

## Notes

- `canvasLayoutMode` is still retained in session state as a lightweight record of the last arrange style (`grid` / `radial`) for compatibility with earlier steps.
- Pin/manual placement protection is not the goal of this step yet. Step 8 should make arrange operations selectively preserve pinned and manually placed nodes.
