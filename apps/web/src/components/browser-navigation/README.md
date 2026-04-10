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
  - Thin composition hook for the navigation tree subsystem.
  - Delegates query derivation and expansion orchestration to focused hooks.
- `browserNavigationTree.derivedState.ts`
  - React-facing query derivation hook for roots, summary, and search visibility.
- `browserNavigationTree.derivedStatePolicy.ts`
  - Pure derived-state assembly policy used by the query hook.
- `browserNavigationTree.expansionState.ts`
  - React state, hydration, persistence callbacks, and UI command handlers for expansion state.
- `browserNavigationTree.expansionStatePolicy.ts`
  - Pure expansion-state transitions and persistence mapping.
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
  - Recursive tree-node rendering and mode buttons.
  - Delegates row markup and child-list/overflow rendering to focused presentation modules.
- `browserNavigationTree.scopeRow.tsx`
  - Scope-row markup and scope-row button interactions.
- `browserNavigationTree.entityRow.tsx`
  - Entity-row markup, entity drag payload wiring, and entity-row button interactions.
- `browserNavigationTree.childList.tsx`
  - Child-list wrapper and show-more/show-less integration.
- `browserNavigationTree.overflowControls.tsx`
  - Show-more/show-less overflow control markup.
- `browserNavigationTree.kindLabels.ts`
  - Presentation-only node kind label mapping.

### Compatibility surface
  - New internal code should prefer importing from the focused modules above.

## Working rules

- Keep the controller as a thin composition layer only.
- Keep React effects and persistence inside the focused state hooks.
- Keep expansion/focus/collapse/root/query rules in pure helpers.
- Keep recursive rendering and DOM event markup inside the presentation module.
- Prefer adding new logic to a focused module and export only what the component shell needs.
