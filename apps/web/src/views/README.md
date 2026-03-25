# Browser view orchestration

- `BrowserView.tsx` is the page composition layer.
- `useBrowserViewScreenController.ts` coordinates workspace selection, startup gating, browser-session bootstrap, and view-level dialog state.
- `useBrowserSavedCanvasController.ts` now composes smaller saved-canvas controller hooks for shared state, record/sync orchestration, and action-driven open/save/rebinding flows.
- Keep domain logic in subsystem modules rather than rebuilding it in React components.
