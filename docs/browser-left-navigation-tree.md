# Browser Step 8 — Left navigation tree

Step 8 introduces a real scope navigation tree in the Browser left rail, driven entirely by the prepared local snapshot index.

## What changed

- Added `BrowserNavigationTree` as the primary left-rail navigation component.
- The tree reads from `BrowserSessionContext.state.index` instead of Browser-specific backend explorer endpoints.
- Selecting a scope now updates Browser session selection directly.
- The selected scope branch auto-expands on load and when the selection changes.
- Each scope row includes a lightweight "Add" action that seeds the future canvas workspace with that scope.
- The previous mode list remains available, but is explicitly demoted to a secondary tool switcher.

## Why this matches the plan

The step-by-step plan called for the Browser left side to become navigation-first, similar to a modeling/file-explorer tool. This step delivers the first concrete version of that by making scope hierarchy browsing the primary left-rail interaction.

## Current behavior

- Root scopes are expanded by default.
- Ancestors of the selected scope remain expanded.
- Users can:
  - expand/collapse branches
  - select a scope
  - add a scope to canvas
  - expand all scopes
  - collapse back to the currently selected branch
- Scope rows expose useful local facts inline:
  - scope kind
  - direct entity count
  - child scope count
  - selected-scope path summary
  - subtree entity count
  - diagnostic count

## Deferred to later steps

This step intentionally does **not** yet:

- replace the center area with the new canvas
- move search into the top bar
- replace the right rail with the new facts panel
- remove the old Browser mode content

Those changes belong to Steps 9–11.
