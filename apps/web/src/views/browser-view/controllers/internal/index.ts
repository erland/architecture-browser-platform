/**
 * Internal BrowserView orchestration hooks.
 *
 * These hooks support the BrowserView feature controllers and application layer.
 * They are intentionally grouped here so screen-orchestration helpers do not
 * accumulate beside the page shell at the top level of `views/browser-view`.
 */
export * from './useBrowserViewActions';
export * from './useBrowserViewSearchController';
export * from './useBrowserViewDialogState';
export * from './useBrowserViewDerivedState';
export * from './useBrowserViewHandlers';
export * from './useBrowserViewLayout';
export * from './useBrowserViewRepositoryActions';
export * from './useBrowserViewSourceTreeController';
export * from './useBrowserViewStartup';

export { useBrowserViewWorkspaceState } from './useBrowserViewWorkspaceState';
export type { BrowserViewWorkspaceState } from './useBrowserViewWorkspaceState';
export { useBrowserViewWorkspaceComposition } from './useBrowserViewWorkspaceComposition';
export type { BrowserViewWorkspaceComposition } from './useBrowserViewWorkspaceComposition';
