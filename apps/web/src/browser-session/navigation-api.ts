/**
 * Narrow navigation entrypoint for browser-session consumers.
 */

export {
  deriveFactsPanelModeFromFocus,
  normalizeFocusedBrowserContext,
  normalizeFocusedElement,
  normalizeSearchScopeId,
  normalizeSelectedEntityIds,
  recomputeBrowserSearchState,
} from './navigation/invariants';

export {
  selectBrowserScope,
  setBrowserNavigationTreeState,
  setBrowserSearch,
  setBrowserTreeMode,
} from './navigation/navigation';
