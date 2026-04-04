import type {
  BrowserNavigationTreeViewState,
  BrowserSessionState,
  PersistedBrowserSessionState,
} from './types';
import { createDefaultBrowserRoutingLayoutConfig, normalizeBrowserRoutingLayoutConfig } from '../../browser-graph/routing';
import { normalizeCanvasNodes } from '../canvas/nodes';


export function createEmptyBrowserNavigationTreeViewState(): BrowserNavigationTreeViewState {
  return {
    expandedScopeIds: [],
    expandedCategories: [],
    expandedEntityIds: [],
    expandedChildListNodeIds: [],
  };
}

export function normalizeBrowserNavigationTreeViewState(value?: Partial<BrowserNavigationTreeViewState> | null): BrowserNavigationTreeViewState {
  const defaults = createEmptyBrowserNavigationTreeViewState();
  return {
    expandedScopeIds: [...(value?.expandedScopeIds ?? defaults.expandedScopeIds)],
    expandedCategories: [...(value?.expandedCategories ?? defaults.expandedCategories)],
    expandedEntityIds: [...(value?.expandedEntityIds ?? defaults.expandedEntityIds)],
    expandedChildListNodeIds: [...(value?.expandedChildListNodeIds ?? defaults.expandedChildListNodeIds)],
  };
}

export function createEmptyBrowserSessionState(): BrowserSessionState {
  return {
    activeSnapshot: null,
    payload: null,
    index: null,
    selectedScopeId: null,
    selectedEntityIds: [],
    searchQuery: '',
    searchScopeId: null,
    searchResults: [],
    canvasNodes: [],
    canvasEdges: [],
    focusedElement: null,
    factsPanelMode: 'hidden',
    factsPanelLocation: 'right',
    graphExpansionActions: [],
    viewpointSelection: {
      viewpointId: null,
      scopeMode: 'selected-scope',
      applyMode: 'replace',
      variant: 'default',
    },
    appliedViewpoint: null,
    viewpointPresentationPreference: 'auto',
    canvasLayoutMode: 'grid',
    treeMode: 'filesystem',
    navigationTreeState: createEmptyBrowserNavigationTreeViewState(),
    canvasViewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    },
    fitViewRequestedAt: null,
    routeRefreshRequestedAt: null,
    routingLayoutConfig: createDefaultBrowserRoutingLayoutConfig(),
  };
}

export function createPersistedBrowserSessionState(state: BrowserSessionState): PersistedBrowserSessionState {
  return {
    activeSnapshot: state.activeSnapshot,
    selectedScopeId: state.selectedScopeId,
    selectedEntityIds: [...state.selectedEntityIds],
    searchQuery: state.searchQuery,
    searchScopeId: state.searchScopeId,
    canvasNodes: state.canvasNodes.map((node) => ({ ...node })),
    canvasEdges: state.canvasEdges.map((edge) => ({ ...edge })),
    focusedElement: state.focusedElement ? { ...state.focusedElement } : null,
    factsPanelMode: state.factsPanelMode,
    factsPanelLocation: state.factsPanelLocation,
    graphExpansionActions: state.graphExpansionActions.map((action) => ({ ...action })),
    viewpointSelection: { ...state.viewpointSelection },
    viewpointPresentationPreference: state.viewpointPresentationPreference,
    canvasLayoutMode: state.canvasLayoutMode,
    treeMode: state.treeMode,
    navigationTreeState: normalizeBrowserNavigationTreeViewState(state.navigationTreeState),
    canvasViewport: { ...state.canvasViewport },
    routingLayoutConfig: {
      features: { ...state.routingLayoutConfig.features },
      defaults: { ...state.routingLayoutConfig.defaults },
    },
  };
}

export function hydrateBrowserSessionState(persisted?: Partial<PersistedBrowserSessionState> | null): BrowserSessionState {
  const state = createEmptyBrowserSessionState();
  if (!persisted) {
    return state;
  }
  return {
    ...state,
    activeSnapshot: persisted.activeSnapshot ?? state.activeSnapshot,
    selectedScopeId: persisted.selectedScopeId ?? state.selectedScopeId,
    selectedEntityIds: [...(persisted.selectedEntityIds ?? state.selectedEntityIds)],
    searchQuery: persisted.searchQuery ?? state.searchQuery,
    searchScopeId: persisted.searchScopeId ?? state.searchScopeId,
    canvasNodes: normalizeCanvasNodes([...(persisted.canvasNodes ?? state.canvasNodes)]),
    canvasEdges: [...(persisted.canvasEdges ?? state.canvasEdges)],
    focusedElement: persisted.focusedElement ?? state.focusedElement,
    factsPanelMode: persisted.factsPanelMode ?? state.factsPanelMode,
    factsPanelLocation: persisted.factsPanelLocation ?? state.factsPanelLocation,
    graphExpansionActions: [...(persisted.graphExpansionActions ?? state.graphExpansionActions)],
    viewpointSelection: {
      viewpointId: persisted.viewpointSelection?.viewpointId ?? state.viewpointSelection.viewpointId,
      scopeMode: persisted.viewpointSelection?.scopeMode ?? state.viewpointSelection.scopeMode,
      applyMode: persisted.viewpointSelection?.applyMode ?? state.viewpointSelection.applyMode,
      variant: persisted.viewpointSelection?.variant ?? state.viewpointSelection.variant,
    },
    appliedViewpoint: null,
    viewpointPresentationPreference: persisted.viewpointPresentationPreference ?? state.viewpointPresentationPreference,
    canvasLayoutMode: persisted.canvasLayoutMode ?? state.canvasLayoutMode,
    treeMode: persisted.treeMode ?? state.treeMode,
    navigationTreeState: normalizeBrowserNavigationTreeViewState(persisted.navigationTreeState),
    canvasViewport: {
      zoom: typeof persisted.canvasViewport?.zoom === 'number' && Number.isFinite(persisted.canvasViewport.zoom) ? persisted.canvasViewport.zoom : state.canvasViewport.zoom,
      offsetX: typeof persisted.canvasViewport?.offsetX === 'number' && Number.isFinite(persisted.canvasViewport.offsetX) ? persisted.canvasViewport.offsetX : state.canvasViewport.offsetX,
      offsetY: typeof persisted.canvasViewport?.offsetY === 'number' && Number.isFinite(persisted.canvasViewport.offsetY) ? persisted.canvasViewport.offsetY : state.canvasViewport.offsetY,
    },
    routingLayoutConfig: normalizeBrowserRoutingLayoutConfig(persisted.routingLayoutConfig),
  };
}
