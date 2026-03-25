import type { FullSnapshotPayload } from './appModel';
import {
  type BrowserTreeMode,
  detectDefaultBrowserTreeMode,
  getOrBuildBrowserSnapshotIndex,
  getViewpointById,
} from './browserSnapshotIndex';
import type {
  BrowserSessionSnapshot,
  BrowserSessionState,
  PersistedBrowserSessionState,
} from './browserSessionStore.types';
import { normalizeCanvasNodes } from './browserSessionStore.canvas.nodes';
import { computeSearchResults } from './browserSessionStore.search';
import { buildAppliedViewpointGraph } from './browserSessionStore.viewpoints.helpers';

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
    canvasViewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    },
    fitViewRequestedAt: null,
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
    canvasViewport: { ...state.canvasViewport },
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
    canvasViewport: {
      zoom: typeof persisted.canvasViewport?.zoom === 'number' && Number.isFinite(persisted.canvasViewport.zoom) ? persisted.canvasViewport.zoom : state.canvasViewport.zoom,
      offsetX: typeof persisted.canvasViewport?.offsetX === 'number' && Number.isFinite(persisted.canvasViewport.offsetX) ? persisted.canvasViewport.offsetX : state.canvasViewport.offsetX,
      offsetY: typeof persisted.canvasViewport?.offsetY === 'number' && Number.isFinite(persisted.canvasViewport.offsetY) ? persisted.canvasViewport.offsetY : state.canvasViewport.offsetY,
    },
  };
}

export function openSnapshotSession(
  state: BrowserSessionState,
  args: {
    workspaceId: string;
    repositoryId: string | null;
    payload: FullSnapshotPayload;
    preparedAt?: string;
    keepViewState?: boolean;
  },
): BrowserSessionState {
  const index = getOrBuildBrowserSnapshotIndex(args.payload);
  const nextState = args.keepViewState ? hydrateBrowserSessionState(createPersistedBrowserSessionState(state)) : createEmptyBrowserSessionState();
  const preparedAt = args.preparedAt ?? new Date().toISOString();
  const activeSnapshot: BrowserSessionSnapshot = {
    workspaceId: args.workspaceId,
    repositoryId: args.repositoryId,
    snapshotId: args.payload.snapshot.id,
    snapshotKey: args.payload.snapshot.snapshotKey,
    preparedAt,
  };
  const selectedScopeId = nextState.selectedScopeId && index.scopesById.has(nextState.selectedScopeId)
    ? nextState.selectedScopeId
    : args.payload.scopes[0]?.externalId ?? null;
  const selectedEntityIds = nextState.selectedEntityIds.filter((entityId) => index.entitiesById.has(entityId));
  const canvasNodes = normalizeCanvasNodes(nextState.canvasNodes.filter((node) => node.kind === 'scope' ? index.scopesById.has(node.id) : index.entitiesById.has(node.id)));
  const canvasEdges = nextState.canvasEdges.filter((edge) => index.relationshipsById.has(edge.relationshipId));
  const searchResults = computeSearchResults(index, nextState.searchQuery, nextState.searchScopeId);
  const treeMode: BrowserTreeMode = args.keepViewState ? nextState.treeMode : detectDefaultBrowserTreeMode(index);
  const selectedViewpointId = nextState.viewpointSelection.viewpointId && getViewpointById(index, nextState.viewpointSelection.viewpointId)
    ? nextState.viewpointSelection.viewpointId
    : null;

  return {
    ...nextState,
    activeSnapshot,
    payload: args.payload,
    index,
    selectedScopeId,
    selectedEntityIds,
    canvasNodes,
    canvasEdges,
    searchResults,
    viewpointSelection: {
      ...nextState.viewpointSelection,
      viewpointId: selectedViewpointId,
    },
    appliedViewpoint: null,
    treeMode,
    canvasViewport: nextState.canvasViewport,
  };
}

export function selectBrowserScope(state: BrowserSessionState, scopeId: string | null): BrowserSessionState {
  const selectedScopeId = scopeId && state.index?.scopesById.has(scopeId) ? scopeId : null;
  const nextState: BrowserSessionState = {
    ...state,
    selectedScopeId,
    focusedElement: selectedScopeId ? { kind: 'scope', id: selectedScopeId } : state.focusedElement,
    factsPanelMode: selectedScopeId ? 'scope' : state.factsPanelMode,
  };
  const selectedViewpoint = nextState.viewpointSelection.viewpointId && nextState.index
    ? getViewpointById(nextState.index, nextState.viewpointSelection.viewpointId)
    : null;
  return {
    ...nextState,
    appliedViewpoint: selectedViewpoint ? buildAppliedViewpointGraph(nextState, selectedViewpoint, nextState.viewpointSelection) : nextState.appliedViewpoint,
  };
}

export function setBrowserSearch(state: BrowserSessionState, query: string, scopeId?: string | null): BrowserSessionState {
  const searchScopeId = scopeId === undefined ? state.searchScopeId : scopeId;
  return {
    ...state,
    searchQuery: query,
    searchScopeId,
    searchResults: computeSearchResults(state.index, query, searchScopeId),
  };
}

export function setBrowserTreeMode(state: BrowserSessionState, treeMode: BrowserTreeMode): BrowserSessionState {
  return {
    ...state,
    treeMode,
  };
}
