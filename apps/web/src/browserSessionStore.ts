import { type FullSnapshotPayload } from './appModel';
import {
  getDefaultCanvasNodePosition,
  planEntityInsertion,
  planScopeInsertion,
} from './browserCanvasPlacement';
import {
  type BrowserDependencyDirection,
  type BrowserSearchResult,
  type BrowserSnapshotIndex,
  type BrowserTreeMode,
  detectDefaultBrowserTreeMode,
  getDependencyNeighborhood,
  getOrBuildBrowserSnapshotIndex,
  getPrimaryEntitiesForScope,
  searchBrowserSnapshotIndex,
} from './browserSnapshotIndex';

const STORAGE_KEY = 'architecture-browser-platform.browser-session.v2';

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
  x: number;
  y: number;
  pinned?: boolean;
  manuallyPlaced?: boolean;
};

export type BrowserCanvasLayoutMode = 'grid' | 'radial';

export type BrowserCanvasViewport = {
  zoom: number;
  offsetX: number;
  offsetY: number;
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
  canvasLayoutMode: BrowserCanvasLayoutMode;
  treeMode: BrowserTreeMode;
  canvasViewport: BrowserCanvasViewport;
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
  canvasLayoutMode: BrowserCanvasLayoutMode;
  treeMode: BrowserTreeMode;
  canvasViewport: BrowserCanvasViewport;
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
    canvasLayoutMode: persisted.canvasLayoutMode ?? state.canvasLayoutMode,
    treeMode: persisted.treeMode ?? state.treeMode,
    canvasViewport: {
      zoom: typeof persisted.canvasViewport?.zoom === 'number' && Number.isFinite(persisted.canvasViewport.zoom) ? persisted.canvasViewport.zoom : state.canvasViewport.zoom,
      offsetX: typeof persisted.canvasViewport?.offsetX === 'number' && Number.isFinite(persisted.canvasViewport.offsetX) ? persisted.canvasViewport.offsetX : state.canvasViewport.offsetX,
      offsetY: typeof persisted.canvasViewport?.offsetY === 'number' && Number.isFinite(persisted.canvasViewport.offsetY) ? persisted.canvasViewport.offsetY : state.canvasViewport.offsetY,
    },
  };
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

function isFiniteCoordinate(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function createPositionedCanvasNode(
  nextNode: Omit<BrowserCanvasNode, 'x' | 'y'> & Partial<Pick<BrowserCanvasNode, 'x' | 'y'>>,
  fallbackPosition?: { x: number; y: number },
) {
  if (isFiniteCoordinate(nextNode.x) && isFiniteCoordinate(nextNode.y)) {
    return {
      ...nextNode,
      x: nextNode.x,
      y: nextNode.y,
    } satisfies BrowserCanvasNode;
  }
  return {
    ...nextNode,
    x: fallbackPosition?.x ?? 56,
    y: fallbackPosition?.y ?? 64,
  } satisfies BrowserCanvasNode;
}

function normalizeCanvasNodes(nodes: BrowserCanvasNode[]) {
  let normalized: BrowserCanvasNode[] = [];
  for (const node of nodes) {
    normalized = upsertCanvasNode(normalized, node, getDefaultCanvasNodePosition(node.kind, normalized));
  }
  return normalized;
}

function upsertCanvasNode(
  nodes: BrowserCanvasNode[],
  nextNode: Omit<BrowserCanvasNode, 'x' | 'y'> & Partial<Pick<BrowserCanvasNode, 'x' | 'y'>>,
  fallbackPosition?: { x: number; y: number },
) {
  const existingIndex = nodes.findIndex((node) => node.kind === nextNode.kind && node.id === nextNode.id);
  if (existingIndex === -1) {
    return [...nodes, createPositionedCanvasNode(nextNode, fallbackPosition)];
  }
  const updated = [...nodes];
  const existingNode = updated[existingIndex];
  const nextPositionedNode = createPositionedCanvasNode({
    ...existingNode,
    ...nextNode,
    x: nextNode.x ?? existingNode.x,
    y: nextNode.y ?? existingNode.y,
  }, fallbackPosition);
  updated[existingIndex] = {
    ...existingNode,
    ...nextPositionedNode,
    pinned: nextNode.pinned ?? existingNode.pinned,
    manuallyPlaced: nextNode.manuallyPlaced ?? existingNode.manuallyPlaced,
  };
  return updated;
}

function upsertCanvasEdge(edges: BrowserCanvasEdge[], nextEdge: BrowserCanvasEdge) {
  const existing = edges.find((edge) => edge.relationshipId === nextEdge.relationshipId);
  return existing ? edges : [...edges, nextEdge];
}


function upsertSelectedEntityIds(selectedEntityIds: string[], entityId: string, additive: boolean) {
  if (additive) {
    return selectedEntityIds.includes(entityId)
      ? selectedEntityIds.filter((current) => current !== entityId)
      : [...selectedEntityIds, entityId];
  }
  return [entityId];
}

function upsertPinnedCanvasNode(nodes: BrowserCanvasNode[], kind: BrowserCanvasNode['kind'], id: string, pinned: boolean) {
  const existing = nodes.find((node) => node.kind === kind && node.id === id);
  if (!existing && !pinned) {
    return nodes;
  }
  if (!existing) {
    return upsertCanvasNode(nodes, { kind, id, pinned });
  }
  return nodes.map((node) => node.kind === kind && node.id === id ? { ...node, pinned } : node);
}

function computeSearchResults(index: BrowserSnapshotIndex | null, query: string, scopeId: string | null) {
  if (!index || !query.trim()) {
    return [];
  }
  return searchBrowserSnapshotIndex(index, query, { scopeId, limit: 50 });
}


function planEntityNodePosition(
  state: BrowserSessionState,
  entityId: string,
  options?: {
    anchorEntityId?: string | null;
    anchorDirection?: 'around' | 'left' | 'right';
    insertionIndex?: number;
    insertionCount?: number;
  },
) {
  const entity = state.index?.entitiesById.get(entityId);
  if (!state.index || !entity) {
    return getDefaultCanvasNodePosition('entity', state.canvasNodes);
  }
  return planEntityInsertion(state.canvasNodes, state.index, entity, {
    anchorEntityId: options?.anchorEntityId ?? (state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null),
    anchorDirection: options?.anchorDirection,
    selectedScopeId: state.selectedScopeId,
    insertionIndex: options?.insertionIndex,
    insertionCount: options?.insertionCount,
  });
}

function planScopeNodePosition(state: BrowserSessionState, scopeId: string, insertionIndex = 0) {
  return planScopeInsertion(state.canvasNodes, scopeId, insertionIndex);
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
  const treeMode = args.keepViewState ? nextState.treeMode : detectDefaultBrowserTreeMode(index);

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
    treeMode,
    canvasViewport: nextState.canvasViewport,
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
  const canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId }, planEntityNodePosition(state, entityId));
  return {
    ...state,
    canvasNodes,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, entityId]),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
  };
}

export function addEntitiesToCanvas(state: BrowserSessionState, entityIds: string[]): BrowserSessionState {
  if (!state.index) {
    return state;
  }
  const validEntityIds = [...new Set(entityIds)].filter((entityId) => state.index?.entitiesById.has(entityId));
  if (validEntityIds.length === 0) {
    return state;
  }

  let canvasNodes = [...state.canvasNodes];
  const anchorEntityId = state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null;
  for (const [index, entityId] of validEntityIds.entries()) {
    const entity = state.index.entitiesById.get(entityId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(
      canvasNodes,
      { kind: 'entity', id: entityId },
      planEntityInsertion(canvasNodes, state.index, entity, {
        anchorEntityId,
        selectedScopeId: state.selectedScopeId,
        insertionIndex: index,
        insertionCount: validEntityIds.length,
      }),
    );
  }

  const focusEntityId = validEntityIds[0];
  return {
    ...state,
    canvasNodes,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, ...validEntityIds]),
    focusedElement: { kind: 'entity', id: focusEntityId },
    factsPanelMode: 'entity',
  };
}

export function addPrimaryEntitiesForScope(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  if (!state.index?.scopesById.has(scopeId)) {
    return state;
  }
  const primaryEntityIds = getPrimaryEntitiesForScope(state.index, scopeId).map((entity) => entity.externalId);
  if (primaryEntityIds.length === 0) {
    return state;
  }
  const nextState = addEntitiesToCanvas(state, primaryEntityIds);
  return {
    ...nextState,
    selectedScopeId: scopeId,
  };
}

export function addScopeToCanvas(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  const scope = state.index?.scopesById.get(scopeId);
  if (!scope) {
    return state;
  }
  return {
    ...state,
    canvasNodes: upsertCanvasNode(state.canvasNodes, { kind: 'scope', id: scopeId }, planScopeNodePosition(state, scopeId)),
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

  let canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId, pinned: true }, planEntityNodePosition(state, entityId));
  let canvasEdges = [...state.canvasEdges];
  const neighborsToInsert = uniqueValues(
    neighborhood.edges
      .filter((edge) => allowedRelationshipIds.has(edge.relationshipId))
      .flatMap((edge) => [edge.fromEntityId, edge.toEntityId])
      .filter((candidateId) => candidateId !== entityId),
  );
  const inboundNeighborIds = neighborsToInsert.filter((candidateId) => neighborhood.inboundEntityIds.includes(candidateId));
  const outboundNeighborIds = neighborsToInsert.filter((candidateId) => neighborhood.outboundEntityIds.includes(candidateId));
  const mixedNeighborIds = neighborsToInsert.filter((candidateId) => !inboundNeighborIds.includes(candidateId) && !outboundNeighborIds.includes(candidateId));

  for (const [index, candidateId] of inboundNeighborIds.entries()) {
    const entity = state.index.entitiesById.get(candidateId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: candidateId }, planEntityInsertion(canvasNodes, state.index, entity, {
      anchorEntityId: entityId,
      anchorDirection: 'left',
      insertionIndex: index,
      insertionCount: inboundNeighborIds.length,
    }));
  }
  for (const [index, candidateId] of outboundNeighborIds.entries()) {
    const entity = state.index.entitiesById.get(candidateId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: candidateId }, planEntityInsertion(canvasNodes, state.index, entity, {
      anchorEntityId: entityId,
      anchorDirection: 'right',
      insertionIndex: index,
      insertionCount: outboundNeighborIds.length,
    }));
  }
  for (const [index, candidateId] of mixedNeighborIds.entries()) {
    const entity = state.index.entitiesById.get(candidateId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: candidateId }, planEntityInsertion(canvasNodes, state.index, entity, {
      anchorEntityId: entityId,
      anchorDirection: 'around',
      insertionIndex: index,
      insertionCount: mixedNeighborIds.length,
    }));
  }

  for (const edge of neighborhood.edges) {
    if (!allowedRelationshipIds.has(edge.relationshipId)) {
      continue;
    }
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

export function setBrowserTreeMode(state: BrowserSessionState, treeMode: BrowserTreeMode): BrowserSessionState {
  return {
    ...state,
    treeMode,
  };
}

export function clearCanvas(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    canvasNodes: [],
    canvasEdges: [],
    canvasViewport: { ...state.canvasViewport, offsetX: 0, offsetY: 0 },
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


export function selectCanvasEntity(state: BrowserSessionState, entityId: string, additive = false): BrowserSessionState {
  if (!state.index?.entitiesById.has(entityId)) {
    return state;
  }
  return {
    ...state,
    selectedEntityIds: upsertSelectedEntityIds(state.selectedEntityIds, entityId, additive),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
  };
}

export function isolateCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = state.selectedEntityIds.filter((entityId) => state.index?.entitiesById.has(entityId));
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : state.selectedScopeId;
  const allowedEntityIds = new Set(selectedEntityIds);
  const allowedScopeIds = new Set<string>();
  if (focusedScopeId && state.index?.scopesById.has(focusedScopeId)) {
    allowedScopeIds.add(focusedScopeId);
  }
  if (allowedEntityIds.size === 0 && allowedScopeIds.size === 0) {
    return state;
  }
  const canvasNodes = state.canvasNodes.filter((node) => node.kind === 'entity' ? allowedEntityIds.has(node.id) : allowedScopeIds.has(node.id));
  const canvasEdges = state.canvasEdges.filter((edge) => allowedEntityIds.has(edge.fromEntityId) && allowedEntityIds.has(edge.toEntityId));
  const focusedElement = state.focusedElement && ((state.focusedElement.kind === 'entity' && allowedEntityIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'scope' && allowedScopeIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'relationship' && canvasEdges.some((edge) => edge.relationshipId === state.focusedElement?.id)))
    ? state.focusedElement
    : (selectedEntityIds[0] ? { kind: 'entity' as const, id: selectedEntityIds[0] } : focusedScopeId ? { kind: 'scope' as const, id: focusedScopeId } : null);
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds,
    focusedElement,
    factsPanelMode: focusedElement ? focusedElement.kind === 'relationship' ? 'relationship' : focusedElement.kind : 'hidden',
  };
}

export function removeCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = new Set(state.selectedEntityIds);
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;
  const canvasNodes = state.canvasNodes.filter((node) => node.kind === 'entity' ? !selectedEntityIds.has(node.id) : node.id !== focusedScopeId);
  const canvasEdges = state.canvasEdges.filter((edge) => !selectedEntityIds.has(edge.fromEntityId) && !selectedEntityIds.has(edge.toEntityId));
  const focusedElement = state.focusedElement && ((state.focusedElement.kind === 'entity' && selectedEntityIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'scope' && state.focusedElement.id === focusedScopeId)) ? null : state.focusedElement;
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds: [],
    focusedElement,
    factsPanelMode: focusedElement ? state.factsPanelMode : 'hidden',
  };
}




function clampCanvasZoom(zoom: number) {
  return Math.min(2.2, Math.max(0.35, Number.isFinite(zoom) ? zoom : 1));
}

export function setCanvasViewport(state: BrowserSessionState, viewport: Partial<BrowserCanvasViewport>): BrowserSessionState {
  return {
    ...state,
    canvasViewport: {
      zoom: clampCanvasZoom(viewport.zoom ?? state.canvasViewport.zoom),
      offsetX: viewport.offsetX ?? state.canvasViewport.offsetX,
      offsetY: viewport.offsetY ?? state.canvasViewport.offsetY,
    },
  };
}

export function panCanvasViewport(state: BrowserSessionState, delta: { x: number; y: number }): BrowserSessionState {
  return setCanvasViewport(state, {
    offsetX: state.canvasViewport.offsetX + delta.x,
    offsetY: state.canvasViewport.offsetY + delta.y,
  });
}
export function moveCanvasNode(
  state: BrowserSessionState,
  node: { kind: BrowserCanvasNode['kind']; id: string },
  position: { x: number; y: number },
): BrowserSessionState {
  const existing = state.canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  if (!existing) {
    return state;
  }
  return {
    ...state,
    canvasNodes: upsertCanvasNode(state.canvasNodes, {
      kind: node.kind,
      id: node.id,
      x: position.x,
      y: position.y,
      manuallyPlaced: true,
    }),
  };
}

export function toggleCanvasNodePin(state: BrowserSessionState, node: { kind: BrowserCanvasNode['kind']; id: string }): BrowserSessionState {
  const existing = state.canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  const nextPinned = !existing?.pinned;
  return {
    ...state,
    canvasNodes: upsertPinnedCanvasNode(state.canvasNodes, node.kind, node.id, nextPinned),
  };
}

export function relayoutCanvas(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    canvasLayoutMode: state.canvasLayoutMode === 'grid' ? 'radial' : 'grid',
    fitViewRequestedAt: new Date().toISOString(),
  };
}
