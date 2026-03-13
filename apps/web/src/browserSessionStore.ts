import { type FullSnapshotPayload } from './appModel';
import {
  type BrowserDependencyDirection,
  type BrowserSearchResult,
  type BrowserSnapshotIndex,
  getDependencyNeighborhood,
  getOrBuildBrowserSnapshotIndex,
  searchBrowserSnapshotIndex,
} from './browserSnapshotIndex';

const STORAGE_KEY = 'architecture-browser-platform.browser-session.v1';

export type BrowserFactsPanelMode = 'hidden' | 'scope' | 'entity' | 'relationship';
export type BrowserFactsPanelLocation = 'right' | 'bottom' | 'replace-canvas';
export type BrowserFocusedElement =
  | { kind: 'scope'; id: string }
  | { kind: 'entity'; id: string }
  | { kind: 'relationship'; id: string }
  | null;

export type BrowserCanvasNode = {
  kind: 'scope' | 'entity';
  id: string;
  pinned?: boolean;
};

export type BrowserCanvasEdge = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
};

export type BrowserGraphExpansionAction = {
  type: 'dependencies';
  entityId: string;
  direction: BrowserDependencyDirection;
  appliedAt: string;
};

export type BrowserSessionSnapshot = {
  workspaceId: string;
  repositoryId: string | null;
  snapshotId: string;
  snapshotKey: string;
  preparedAt: string;
};

export type BrowserSessionState = {
  activeSnapshot: BrowserSessionSnapshot | null;
  payload: FullSnapshotPayload | null;
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  searchQuery: string;
  searchScopeId: string | null;
  searchResults: BrowserSearchResult[];
  canvasNodes: BrowserCanvasNode[];
  canvasEdges: BrowserCanvasEdge[];
  focusedElement: BrowserFocusedElement;
  factsPanelMode: BrowserFactsPanelMode;
  factsPanelLocation: BrowserFactsPanelLocation;
  graphExpansionActions: BrowserGraphExpansionAction[];
  fitViewRequestedAt: string | null;
};

export type PersistedBrowserSessionState = {
  activeSnapshot: BrowserSessionSnapshot | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  searchQuery: string;
  searchScopeId: string | null;
  canvasNodes: BrowserCanvasNode[];
  canvasEdges: BrowserCanvasEdge[];
  focusedElement: BrowserFocusedElement;
  factsPanelMode: BrowserFactsPanelMode;
  factsPanelLocation: BrowserFactsPanelLocation;
  graphExpansionActions: BrowserGraphExpansionAction[];
};

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
    canvasNodes: [...(persisted.canvasNodes ?? state.canvasNodes)],
    canvasEdges: [...(persisted.canvasEdges ?? state.canvasEdges)],
    focusedElement: persisted.focusedElement ?? state.focusedElement,
    factsPanelMode: persisted.factsPanelMode ?? state.factsPanelMode,
    factsPanelLocation: persisted.factsPanelLocation ?? state.factsPanelLocation,
    graphExpansionActions: [...(persisted.graphExpansionActions ?? state.graphExpansionActions)],
  };
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function upsertCanvasNode(nodes: BrowserCanvasNode[], nextNode: BrowserCanvasNode) {
  const existingIndex = nodes.findIndex((node) => node.kind === nextNode.kind && node.id === nextNode.id);
  if (existingIndex === -1) {
    return [...nodes, nextNode];
  }
  const updated = [...nodes];
  updated[existingIndex] = { ...updated[existingIndex], ...nextNode };
  return updated;
}

function upsertCanvasEdge(edges: BrowserCanvasEdge[], nextEdge: BrowserCanvasEdge) {
  const existing = edges.find((edge) => edge.relationshipId === nextEdge.relationshipId);
  return existing ? edges : [...edges, nextEdge];
}

function computeSearchResults(index: BrowserSnapshotIndex | null, query: string, scopeId: string | null) {
  if (!index || !query.trim()) {
    return [];
  }
  return searchBrowserSnapshotIndex(index, query, { scopeId, limit: 50 });
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
  const canvasNodes = nextState.canvasNodes.filter((node) => node.kind === 'scope' ? index.scopesById.has(node.id) : index.entitiesById.has(node.id));
  const canvasEdges = nextState.canvasEdges.filter((edge) => index.relationshipsById.has(edge.relationshipId));
  const searchResults = computeSearchResults(index, nextState.searchQuery, nextState.searchScopeId);

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
  };
}

export function selectBrowserScope(state: BrowserSessionState, scopeId: string | null): BrowserSessionState {
  const selectedScopeId = scopeId && state.index?.scopesById.has(scopeId) ? scopeId : null;
  return {
    ...state,
    selectedScopeId,
    focusedElement: selectedScopeId ? { kind: 'scope', id: selectedScopeId } : state.focusedElement,
    factsPanelMode: selectedScopeId ? 'scope' : state.factsPanelMode,
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

export function addEntityToCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const entity = state.index?.entitiesById.get(entityId);
  if (!entity) {
    return state;
  }
  const canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId });
  return {
    ...state,
    canvasNodes,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, entityId]),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
  };
}

export function addScopeToCanvas(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  const scope = state.index?.scopesById.get(scopeId);
  if (!scope) {
    return state;
  }
  return {
    ...state,
    canvasNodes: upsertCanvasNode(state.canvasNodes, { kind: 'scope', id: scopeId }),
    focusedElement: { kind: 'scope', id: scopeId },
    factsPanelMode: 'scope',
  };
}

export function addDependenciesToCanvas(state: BrowserSessionState, entityId: string, direction: BrowserDependencyDirection = 'ALL'): BrowserSessionState {
  if (!state.index?.entitiesById.has(entityId)) {
    return state;
  }
  const neighborhood = getDependencyNeighborhood(state.index, entityId, direction);
  if (!neighborhood) {
    return state;
  }
  const allowedRelationshipIds = new Set(
    neighborhood.edges
      .filter((edge) => direction === 'ALL'
        ? true
        : direction === 'INBOUND'
          ? edge.toEntityId === entityId
          : edge.fromEntityId === entityId)
      .map((edge) => edge.relationshipId),
  );

  let canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId, pinned: true });
  let canvasEdges = [...state.canvasEdges];
  for (const edge of neighborhood.edges) {
    if (!allowedRelationshipIds.has(edge.relationshipId)) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: edge.fromEntityId });
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: edge.toEntityId });
    canvasEdges = upsertCanvasEdge(canvasEdges, {
      relationshipId: edge.relationshipId,
      fromEntityId: edge.fromEntityId,
      toEntityId: edge.toEntityId,
    });
  }

  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, entityId]),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
    graphExpansionActions: [...state.graphExpansionActions, {
      type: 'dependencies',
      entityId,
      direction,
      appliedAt: new Date().toISOString(),
    }],
  };
}

export function removeEntityFromCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const canvasNodes = state.canvasNodes.filter((node) => !(node.kind === 'entity' && node.id === entityId));
  const canvasEdges = state.canvasEdges.filter((edge) => edge.fromEntityId !== entityId && edge.toEntityId !== entityId);
  const selectedEntityIds = state.selectedEntityIds.filter((current) => current !== entityId);
  const focusedElement = state.focusedElement?.kind === 'entity' && state.focusedElement.id === entityId ? null : state.focusedElement;
  const factsPanelMode = focusedElement ? state.factsPanelMode : 'hidden';
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds,
    focusedElement,
    factsPanelMode,
  };
}

export function focusBrowserElement(state: BrowserSessionState, focusedElement: BrowserFocusedElement): BrowserSessionState {
  let factsPanelMode = state.factsPanelMode;
  if (!focusedElement) {
    factsPanelMode = 'hidden';
  } else if (focusedElement.kind === 'scope') {
    factsPanelMode = 'scope';
  } else if (focusedElement.kind === 'entity') {
    factsPanelMode = 'entity';
  } else {
    factsPanelMode = 'relationship';
  }
  return {
    ...state,
    focusedElement,
    factsPanelMode,
  };
}

export function openFactsPanel(state: BrowserSessionState, mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation): BrowserSessionState {
  return {
    ...state,
    factsPanelMode: mode,
    factsPanelLocation: location ?? state.factsPanelLocation,
  };
}

export function clearCanvas(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    canvasNodes: [],
    canvasEdges: [],
    fitViewRequestedAt: null,
  };
}

export function requestFitCanvasView(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function readPersistedBrowserSession(storage: Pick<Storage, 'getItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedBrowserSessionState;
  } catch {
    return null;
  }
}

export function persistBrowserSession(state: BrowserSessionState, storage: Pick<Storage, 'setItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(createPersistedBrowserSessionState(state)));
}
