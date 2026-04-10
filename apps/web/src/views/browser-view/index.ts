/**
 * Canonical public entrypoint for BrowserView page composition.
 *
 * Import BrowserView page surfaces from `views/browser-view`.
 * Import from this entrypoint or the application/controller sub-entrypoints documented below.
 */

export { BrowserView } from './BrowserView';
export { useBrowserViewStartup } from './useBrowserViewStartup';
export { useBrowserViewSearchController } from './useBrowserViewSearchController';
export { useBrowserViewSourceTreeController } from './useBrowserViewSourceTreeController';
export { useBrowserViewRepositoryActions } from './useBrowserViewRepositoryActions';
export * from './browserView.shared';

export * from './controllers';

export * from './application';
