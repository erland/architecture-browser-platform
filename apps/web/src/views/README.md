# Browser view orchestration

- `BrowserView.tsx` is the page composition layer.
- `useBrowserViewScreenController.ts` coordinates workspace selection, startup gating, browser-session bootstrap, and view-level dialog state.
- `useBrowserSavedCanvasController.ts` owns page-driven saved-canvas workflows and keeps those concerns out of the page component.
- Keep domain logic in subsystem modules rather than rebuilding it in React components.
