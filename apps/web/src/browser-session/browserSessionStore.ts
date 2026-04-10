/**
 * Legacy compatibility facade for browser-session.
 *
 * Keep this file intentionally small while remaining source-compatible for
 * older imports. New consumers should prefer the narrow entrypoints in this
 * folder instead of importing the entire browser-session surface here.
 */

export type {
  BrowserSessionSnapshot,
  BrowserSessionState,
  PersistedBrowserSessionState,
} from './session-state-types';

export {
  createEmptyBrowserNavigationTreeViewState,
  createEmptyBrowserSessionState,
  createPersistedBrowserSessionState,
  hydrateBrowserSessionState,
  normalizeBrowserNavigationTreeViewState,
} from './state';

export {
  readPersistedBrowserSession,
  persistBrowserSession,
  openSnapshotSession,
} from './lifecycle-api';

export {
  createBoundBrowserSessionActionGroups,
  applyBrowserSessionMutation,
  bindBrowserSessionMutationGroup,
  browserSessionCanvasCommands,
  browserSessionCanvasMutations,
  browserSessionFactsPanelCommands,
  browserSessionFactsPanelMutations,
  browserSessionLifecycleCommands,
  browserSessionLifecycleMutations,
  browserSessionNavigationCommands,
  browserSessionNavigationMutations,
  browserSessionViewpointCommands,
  browserSessionViewpointMutations,
} from './commands-api';

export type {
  BoundBrowserSessionMutationGroup,
  BrowserSessionMutation,
  BrowserSessionMutationGroup,
} from './commands-api';
