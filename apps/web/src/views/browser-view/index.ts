/**
 * Canonical public entrypoint for BrowserView page composition.
 *
 * Import BrowserView page surfaces from `views/browser-view`.
 * Existing deep imports remain temporarily supported during migration,
 * but should be treated as internal unless explicitly re-exported here.
 */

export { BrowserView } from './BrowserView';
export { useBrowserViewScreenController } from './useBrowserViewScreenController';
export { useBrowserViewStartup } from './useBrowserViewStartup';
export { useBrowserViewSearchController } from './useBrowserViewSearchController';
export { useBrowserViewSourceTreeController } from './useBrowserViewSourceTreeController';
export { useBrowserViewRepositoryActions } from './useBrowserViewRepositoryActions';
export * from './browserView.shared';

export * from './controllers';

export * from './application';
