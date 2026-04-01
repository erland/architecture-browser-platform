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
- `browserViewWorkflows.ts` is a compatibility barrel over focused Browser workflow modules.
- `browserViewFocusWorkflows.ts` owns canvas focus and scope/entity analysis workflows.
- `browserTopSearchWorkflows.ts` owns top-search action workflows.
- `savedCanvasWorkflows.ts` is a compatibility barrel over focused saved-canvas workflow modules.
- `savedCanvasDialogWorkflows.ts` owns dialog-open and record refresh workflows.
- `savedCanvasOpeningWorkflows.ts` owns open and rebind-open workflows.
- `savedCanvasPersistenceWorkflows.ts` owns save and delete workflows.
