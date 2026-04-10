/**
 * Narrow state entrypoint for browser-session consumers.
 */

export {
  createEmptyBrowserNavigationTreeViewState,
  createEmptyBrowserSessionState,
  createPersistedBrowserSessionState,
  hydrateBrowserSessionState,
  normalizeBrowserNavigationTreeViewState,
} from './model/state';
