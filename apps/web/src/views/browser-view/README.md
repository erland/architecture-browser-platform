# browser-view

Browser screen-composition files, BrowserView shell sections, and Browser-specific controller/workflow hooks.

## Screen application layer

- `application/useBrowserViewApplicationController.ts` is the preferred internal screen application layer.
- It composes the BrowserView feature controllers and exposes one application-facing controller object for the page shell.
- `BrowserView.tsx` now imports the application layer directly for page composition.

## Controller structure

- `controllers/useBrowserViewWorkspaceController.ts` owns workspace, repository, snapshot, and startup orchestration.
- `controllers/useBrowserViewCanvasController.ts` owns Browser canvas actions and top-search integration.
- `controllers/useBrowserViewDialogController.ts` owns saved-canvas and dialog composition.

## Screen application layer

`application/useBrowserViewApplicationController.ts` owns the screen-level
composition of BrowserView feature controllers.

`application/useBrowserViewPageSections.ts` maps that application state into the
section props consumed by `BrowserView.tsx`. Prefer adding new screen-level prop
assembly there instead of growing the page shell.

## Internal orchestration helpers

Most screen-orchestration helper hooks now live under `controllers/internal/`.
Use the application layer plus the internal controller helpers for BrowserView composition work. Top-level `useBrowserView*.ts` files should exist only when they are still canonical entrypoints for a focused controller.


Policy modules:
- `application/browserViewPageSectionPolicy.ts` owns the pure mapping from application controller state to page section props.
- `controllers/internal/browserViewDerivedStatePolicy.ts` owns deterministic BrowserView label/selection derivation.
- `controllers/internal/browserViewStartupPolicy.ts` owns startup gate and implicit-workspace decision rules.
- Hook files in `application/` and `controllers/internal/` should stay focused on orchestration, memoization, effects, and wiring.
