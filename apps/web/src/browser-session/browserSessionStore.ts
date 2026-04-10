/**
 * Legacy broad compatibility facade for browser-session.
 *
 * New consumers should prefer the narrow category entrypoints in this folder
 * rather than importing the entire session surface through one module.
 */

export type {
  BrowserCanvasEdge,
  BrowserCanvasLayoutMode,
  BrowserClassPresentationMode,
  BrowserClassPresentationPolicy,
  BrowserCanvasNode,
  BrowserCanvasViewport,
  BrowserNavigationTreeViewState,
  BrowserFactsPanelLocation,
  BrowserFactsPanelMode,
  BrowserFocusedElement,
  BrowserGraphExpansionAction,
  BrowserRoutingConservativeDefaults,
  BrowserRoutingFeatureFlags,
  BrowserRoutingLayoutConfig,
  BrowserSessionSnapshot,
  BrowserSessionState,
  BrowserViewpointApplyMode,
  BrowserViewpointPresentationPreference,
  BrowserViewpointSelection,
  PersistedBrowserSessionState,
} from './model/types';

export {
  createEmptyBrowserNavigationTreeViewState,
  createEmptyBrowserSessionState,
  createPersistedBrowserSessionState,
  hydrateBrowserSessionState,
  normalizeBrowserNavigationTreeViewState,
} from './model/state';

export {
  deriveFactsPanelModeFromFocus,
  normalizeFocusedBrowserContext,
  normalizeFocusedElement,
  normalizeSearchScopeId,
  normalizeSelectedEntityIds,
  recomputeBrowserSearchState,
} from './navigation/invariants';

export { openSnapshotSession } from './lifecycle/lifecycle';

export {
  selectBrowserScope,
  setBrowserNavigationTreeState,
  setBrowserSearch,
  setBrowserTreeMode,
} from './navigation/navigation';

export {
  readPersistedBrowserSession,
  persistBrowserSession,
} from './lifecycle/persistence';

export {
  setSelectedViewpoint,
  setViewpointApplyMode,
  setViewpointPresentationPreference,
  setViewpointScopeMode,
  setViewpointVariant,
  applySelectedViewpoint,
} from './viewpoints';

export {
  addDependenciesToCanvas,
  addEntitiesToCanvas,
  addEntityToCanvas,
  addPrimaryEntitiesForScope,
  addScopeToCanvas,
  arrangeAllCanvasNodes,
  arrangeAllCanvasNodesInteractive,
  arrangeCanvasNodesWithMode,
  arrangeCanvasNodesInteractivelyWithMode,
  arrangeCanvasAroundFocus,
  clearCanvas,
  isolateCanvasSelection,
  moveCanvasNode,
  panCanvasViewport,
  relayoutCanvas,
  removeCanvasSelection,
  removeEntityFromCanvas,
  reconcileCanvasNodePositions,
  requestFitCanvasView,
  selectAllCanvasEntities,
  selectCanvasEntity,
  setCanvasEntityClassPresentationMode,
  setCanvasViewport,
  toggleCanvasEntityClassPresentationMembers,
  toggleCanvasNodePin,
} from './canvas';

export {
  focusBrowserElement,
  openFactsPanel,
} from './facts-panel/actions';

export {
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
  createBoundBrowserSessionActionGroups,
  applyBrowserSessionMutation,
  bindBrowserSessionMutationGroup,
} from './commands';

export type {
  BoundBrowserSessionMutationGroup,
  BrowserSessionMutation,
  BrowserSessionMutationGroup,
} from './commands';
