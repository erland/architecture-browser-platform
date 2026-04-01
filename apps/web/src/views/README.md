# Browser view orchestration

- `BrowserView.tsx` is the page composition layer.
- `useBrowserViewScreenController.ts` is now a thin composition layer over smaller controller hooks for startup gating, source-tree switching, repository actions, browser-session bootstrap, and view-level dialog state.
- `useBrowserViewStartup.ts` owns implicit-workspace selection and startup gate messaging.
- `useBrowserViewSourceTreeController.ts` owns source-tree launcher items and source-tree switching behavior.
- `useBrowserViewRepositoryActions.ts` owns repository/workspace dialog actions that mutate backend state.
- `useBrowserViewDerivedState.ts` owns Browser footer/header labels and selected snapshot/repository derivation.
- `useBrowserViewHandlers.ts` assembles the side-effectful action surface exposed to `BrowserView.tsx`.
- `useBrowserSavedCanvasController.ts` now composes smaller saved-canvas controller hooks for shared state, record/sync orchestration, and action-driven open/save/rebinding flows.
- Keep domain logic in subsystem modules rather than rebuilding it in React components.
- `browserViewWorkflows.ts` owns application-service style Browser commands for search-result handling and canvas analysis/open workflows.
- `savedCanvasWorkflows.ts` owns application-service style saved-canvas commands for dialog open, save, open, rebind-open, and delete workflows.
