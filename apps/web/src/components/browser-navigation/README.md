# Browser navigation tree subsystem

This directory contains the Browser left-rail navigation tree.

## Current seams

### Container
- `BrowserNavigationTree.tsx`
  - Composes the navigation tree UI.
  - Owns header/status/footer layout.
  - Wires controller output into the presentational tree renderer.

### Controller / side-effect wiring
- `browserNavigationTree.controller.ts`
  - Owns React state, hydration, persistence callbacks, and UI command handlers.
  - Delegates tree shaping and policy decisions to pure helpers.
- `browserNavigationTree.state.ts`
  - Compatibility wrapper around the controller hook.

### Pure derivation and policy
- `browserNavigationTree.nodes.ts`
  - Builds scope/entity child nodes for rendering.
- `browserNavigationTree.search.ts`
  - Computes search visibility and root filtering for search mode.
- `browserNavigationTree.summary.ts`
  - Builds tree summaries from the snapshot index.
- `browserNavigationTree.expansion.ts`
  - Shared expansion helpers and default expansion state.
- `browserNavigationTree.focusPolicy.ts`
  - Focus-reveal policy.
- `browserNavigationTree.collapsePolicy.ts`
  - Collapse and collapse-to-selection policy.
- `browserNavigationTree.autoExpandTraversal.ts`
  - Deterministic single-child traversal used by auto-expand behavior.
- `browserNavigationTree.rootPresentation.ts`
  - Top-level browsing mode normalization and root presentation rules.
- `browserNavigationTree.shared.ts`
  - Shared types and tree-mode metadata.

### Presentation
- `browserNavigationTree.presentation.tsx`
  - Recursive tree-node rendering.
  - Mode buttons, rows, overflow controls, drag wiring.

### Compatibility surface
- `browserNavigationTree.model.ts`
  - Thin compatibility barrel re-exporting the legacy helper surface.
  - New internal code should prefer importing from the focused modules above.

## Working rules

- Keep React effects and persistence inside the controller.
- Keep expansion/focus/collapse/root rules in pure helpers.
- Keep recursive rendering and DOM event markup inside the presentation module.
- Prefer adding new logic to a focused module instead of growing the compatibility barrel.
