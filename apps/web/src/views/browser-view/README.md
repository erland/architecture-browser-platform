# browser-view

Browser screen-composition files, BrowserView shell sections, and Browser-specific controller/workflow hooks.


## Controller structure

- `controllers/useBrowserViewWorkspaceController.ts` owns workspace, repository, snapshot, and startup orchestration.
- `controllers/useBrowserViewCanvasController.ts` owns Browser canvas actions and top-search integration.
- `controllers/useBrowserViewDialogController.ts` owns saved-canvas and dialog composition.
- `useBrowserViewScreenController.ts` now acts as a thin composition boundary over those feature controllers.
