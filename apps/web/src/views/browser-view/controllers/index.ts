/**
 * Canonical feature-controller entrypoint for BrowserView orchestration.
 *
 * Import BrowserView controller hooks from `views/browser-view/controllers`.
 */

export { useBrowserViewWorkspaceController } from './useBrowserViewWorkspaceController';
export { useBrowserViewCanvasController } from './useBrowserViewCanvasController';
export { useBrowserViewDialogController } from './useBrowserViewDialogController';

export * from './internal';
