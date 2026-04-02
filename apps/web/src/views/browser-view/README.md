# browser-view

Browser screen-composition files, BrowserView shell sections, and Browser-specific controller/workflow hooks.

## Screen application layer

- `application/useBrowserViewApplicationController.ts` is the preferred internal screen application layer.
- It composes the BrowserView feature controllers and exposes one application-facing controller object for the page shell.
- `useBrowserViewScreenController.ts` remains as a compatibility facade over the application layer for page-level composition.

## Controller structure

- `controllers/useBrowserViewWorkspaceController.ts` owns workspace, repository, snapshot, and startup orchestration.
- `controllers/useBrowserViewCanvasController.ts` owns Browser canvas actions and top-search integration.
- `controllers/useBrowserViewDialogController.ts` owns saved-canvas and dialog composition.
- `useBrowserViewScreenController.ts` now delegates to the BrowserView application layer instead of composing feature controllers directly.

## Screen application layer

`application/useBrowserViewApplicationController.ts` owns the screen-level
composition of BrowserView feature controllers.

`application/useBrowserViewPageSections.ts` maps that application state into the
section props consumed by `BrowserView.tsx`. Prefer adding new screen-level prop
assembly there instead of growing the page shell.

## Internal orchestration helpers

Most screen-orchestration helper hooks now live under `controllers/internal/`.
The top-level `useBrowserView*.ts` files remain only as compatibility facades for
existing imports and test mocks. Prefer the internal controller helpers for new
BrowserView composition work.
