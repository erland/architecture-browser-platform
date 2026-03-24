import type { FullSnapshotPayload, FullSnapshotRelationship } from './appModel';
import { getOrBuildBrowserSnapshotIndex } from './browserSnapshotIndex';
import { createEmptyBrowserSessionState, openSnapshotSession } from './browserSessionStore';
import type {
  BrowserCanvasEdge,
  BrowserCanvasLayoutMode,
  BrowserCanvasNode,
  BrowserSessionState,
} from './browserSessionStore';
import {
  createSavedCanvasDocument,
  createSavedCanvasItemReference,
  type CreateSavedCanvasDocumentInput,
  type SavedCanvasDocument,
  type SavedCanvasEdge,
  type SavedCanvasItemReference,
  type SavedCanvasNode,
  toSavedCanvasSnapshotRef,
} from './savedCanvasModel';

export type CreateSavedCanvasFromBrowserSessionOptions = {
  state: BrowserSessionState;
  canvasId: string;
  name: string;
  syncState?: CreateSavedCanvasDocumentInput['syncState'];
  localVersion?: number;
  backendVersion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastModifiedAt?: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
};

export type RestoreSavedCanvasToBrowserSessionOptions = {
  document: SavedCanvasDocument;
  payload: FullSnapshotPayload;
  preparedAt?: string;
};

export type RestoreSavedCanvasToBrowserSessionResult = {
  state: BrowserSessionState;
  unresolvedNodeIds: string[];
  unresolvedEdgeIds: string[];
};

export function createSavedCanvasDocumentFromBrowserSession(
  options: CreateSavedCanvasFromBrowserSessionOptions,
): SavedCanvasDocument {
  const { state } = options;
  if (!state.activeSnapshot || !state.payload || !state.index) {
    throw new Error('Cannot save canvas without an active Browser snapshot session.');
  }

  const hiddenNodeIds: string[] = [];
  const hiddenEdgeIds: string[] = [];

  const nodes = state.canvasNodes.map((node) => {
    const savedNode = mapBrowserCanvasNodeToSavedCanvasNode(node, state);
    if (savedNode.presentation.hidden) {
      hiddenNodeIds.push(savedNode.canvasNodeId);
    }
    return savedNode;
  });

  const edges = state.canvasEdges.map((edge) => {
    const savedEdge = mapBrowserCanvasEdgeToSavedCanvasEdge(edge, state);
    if (savedEdge.presentation.hidden) {
      hiddenEdgeIds.push(savedEdge.canvasEdgeId);
    }
    return savedEdge;
  });

  return createSavedCanvasDocument({
    canvasId: options.canvasId,
    name: options.name,
    originSnapshot: toSavedCanvasSnapshotRef(state.payload.snapshot),
    nodes,
    edges,
    annotations: [],
    viewport: {
      x: state.canvasViewport.offsetX,
      y: state.canvasViewport.offsetY,
      zoom: state.canvasViewport.zoom,
    },
    activeViewpointId: state.viewpointSelection.viewpointId,
    layoutMode: state.canvasLayoutMode,
    hiddenNodeIds,
    hiddenEdgeIds,
    syncState: options.syncState,
    localVersion: options.localVersion,
    backendVersion: options.backendVersion,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
    lastModifiedAt: options.lastModifiedAt,
    lastSyncedAt: options.lastSyncedAt,
    lastSyncError: options.lastSyncError,
  });
}

export function restoreSavedCanvasToBrowserSession(
  options: RestoreSavedCanvasToBrowserSessionOptions,
): RestoreSavedCanvasToBrowserSessionResult {
  const { document, payload, preparedAt } = options;
  const index = getOrBuildBrowserSnapshotIndex(payload);
  let state = openSnapshotSession(createEmptyBrowserSessionState(), {
    workspaceId: document.bindings.currentTargetSnapshot?.workspaceId ?? document.bindings.originSnapshot.workspaceId,
    repositoryId: payload.source.repositoryId,
    payload,
    preparedAt,
    keepViewState: false,
  });

  const unresolvedNodeIds: string[] = [];
  const unresolvedEdgeIds: string[] = [];
  const nodeIdsOnCanvas = new Set<string>();

  const canvasNodes: BrowserCanvasNode[] = [];
  for (const node of document.content.nodes) {
    const restoredNode = restoreSavedCanvasNode(node, index);
    if (!restoredNode || node.presentation.hidden || document.presentation.filters.hiddenNodeIds.includes(node.canvasNodeId)) {
      if (!restoredNode) {
        unresolvedNodeIds.push(node.canvasNodeId);
      }
      continue;
    }
    canvasNodes.push(restoredNode);
    nodeIdsOnCanvas.add(`${restoredNode.kind}:${restoredNode.id}`);
  }

  const canvasEdges: BrowserCanvasEdge[] = [];
  for (const edge of document.content.edges) {
    const restoredEdge = restoreSavedCanvasEdge(edge, index, nodeIdsOnCanvas);
    if (!restoredEdge || edge.presentation.hidden || document.presentation.filters.hiddenEdgeIds.includes(edge.canvasEdgeId)) {
      if (!restoredEdge) {
        unresolvedEdgeIds.push(edge.canvasEdgeId);
      }
      continue;
    }
    canvasEdges.push(restoredEdge);
  }

  const viewpointId = document.presentation.activeViewpointId && index.viewpointsById.has(document.presentation.activeViewpointId)
    ? document.presentation.activeViewpointId
    : null;

  state = {
    ...state,
    canvasNodes,
    canvasEdges,
    viewpointSelection: {
      ...state.viewpointSelection,
      viewpointId,
    },
    canvasLayoutMode: normalizeCanvasLayoutMode(document.presentation.layoutMode),
    canvasViewport: {
      zoom: document.presentation.viewport.zoom,
      offsetX: document.presentation.viewport.x,
      offsetY: document.presentation.viewport.y,
    },
  };

  return {
    state,
    unresolvedNodeIds,
    unresolvedEdgeIds,
  };
}

function mapBrowserCanvasNodeToSavedCanvasNode(node: BrowserCanvasNode, state: BrowserSessionState): SavedCanvasNode {
  if (!state.index) {
    throw new Error('Cannot map Browser canvas node without a Browser snapshot index.');
  }

  const reference = node.kind === 'scope'
    ? createSavedCanvasItemReference({
        targetType: 'SCOPE',
        stableKey: node.id,
        originalSnapshotLocalId: node.id,
        fallback: {
          kind: state.index.scopesById.get(node.id)?.kind ?? null,
          name: state.index.scopesById.get(node.id)?.name ?? null,
          displayName: state.index.scopesById.get(node.id)?.displayName ?? null,
          path: state.index.scopePathById.get(node.id) ?? null,
        },
      })
    : createSavedCanvasItemReference({
        targetType: 'ENTITY',
        stableKey: node.id,
        originalSnapshotLocalId: node.id,
        fallback: {
          kind: state.index.entitiesById.get(node.id)?.kind ?? null,
          name: state.index.entitiesById.get(node.id)?.name ?? null,
          displayName: state.index.entitiesById.get(node.id)?.displayName ?? null,
          scopeStableKey: state.index.entitiesById.get(node.id)?.scopeId ?? null,
          path: state.index.entitiesById.get(node.id)?.scopeId ? state.index.scopePathById.get(state.index.entitiesById.get(node.id)?.scopeId ?? '') ?? null : null,
        },
      });

  return {
    canvasNodeId: `${node.kind}:${node.id}`,
    reference,
    position: {
      x: node.x,
      y: node.y,
    },
    size: null,
    presentation: {
      pinned: Boolean(node.pinned),
      hidden: false,
      collapsed: false,
      zIndex: null,
    },
    annotationIds: [],
    metadata: {
      browserNodeKind: node.kind,
      manuallyPlaced: Boolean(node.manuallyPlaced),
    },
  };
}

function mapBrowserCanvasEdgeToSavedCanvasEdge(edge: BrowserCanvasEdge, state: BrowserSessionState): SavedCanvasEdge {
  if (!state.index) {
    throw new Error('Cannot map Browser canvas edge without a Browser snapshot index.');
  }
  const relationship = state.index.relationshipsById.get(edge.relationshipId);
  return {
    canvasEdgeId: edge.relationshipId,
    reference: mapRelationshipReference(relationship, edge.relationshipId),
    sourceCanvasNodeId: `entity:${edge.fromEntityId}`,
    targetCanvasNodeId: `entity:${edge.toEntityId}`,
    presentation: {
      hidden: false,
      label: relationship?.label ?? null,
      styleVariant: relationship?.kind ?? null,
    },
    annotationIds: [],
    metadata: {},
  };
}

function mapRelationshipReference(
  relationship: FullSnapshotRelationship | undefined,
  fallbackRelationshipId: string,
): SavedCanvasItemReference {
  return createSavedCanvasItemReference({
    targetType: 'RELATIONSHIP',
    stableKey: relationship?.externalId ?? fallbackRelationshipId,
    originalSnapshotLocalId: relationship?.externalId ?? fallbackRelationshipId,
    fallback: {
      relationshipKind: relationship?.kind ?? null,
      fromStableKey: relationship?.fromEntityId ?? null,
      toStableKey: relationship?.toEntityId ?? null,
      metadata: relationship?.metadata ?? {},
    },
  });
}

function restoreSavedCanvasNode(
  node: SavedCanvasNode,
  index: ReturnType<typeof getOrBuildBrowserSnapshotIndex>,
): BrowserCanvasNode | null {
  const resolvedId = resolveSavedCanvasReferenceId(node.reference, index);
  if (!resolvedId) {
    return null;
  }
  if (node.reference.targetType !== 'SCOPE' && node.reference.targetType !== 'ENTITY') {
    return null;
  }
  return {
    kind: node.reference.targetType === 'SCOPE' ? 'scope' : 'entity',
    id: resolvedId,
    x: node.position.x,
    y: node.position.y,
    pinned: node.presentation.pinned,
    manuallyPlaced: Boolean(node.metadata?.manuallyPlaced ?? true),
  };
}

function restoreSavedCanvasEdge(
  edge: SavedCanvasEdge,
  index: ReturnType<typeof getOrBuildBrowserSnapshotIndex>,
  nodeIdsOnCanvas: Set<string>,
): BrowserCanvasEdge | null {
  const relationshipId = resolveSavedCanvasReferenceId(edge.reference, index);
  if (!relationshipId) {
    return null;
  }
  const relationship = index.relationshipsById.get(relationshipId);
  if (!relationship) {
    return null;
  }
  if (!nodeIdsOnCanvas.has(`entity:${relationship.fromEntityId}`) || !nodeIdsOnCanvas.has(`entity:${relationship.toEntityId}`)) {
    return null;
  }
  return {
    relationshipId,
    fromEntityId: relationship.fromEntityId,
    toEntityId: relationship.toEntityId,
  };
}

function resolveSavedCanvasReferenceId(
  reference: SavedCanvasItemReference,
  index: ReturnType<typeof getOrBuildBrowserSnapshotIndex>,
): string | null {
  const directId = reference.originalSnapshotLocalId?.trim() || reference.stableKey.trim();
  if (reference.targetType === 'SCOPE') {
    if (directId && index.scopesById.has(directId)) {
      return directId;
    }
    return index.scopesById.has(reference.stableKey) ? reference.stableKey : null;
  }
  if (reference.targetType === 'ENTITY') {
    if (directId && index.entitiesById.has(directId)) {
      return directId;
    }
    return index.entitiesById.has(reference.stableKey) ? reference.stableKey : null;
  }
  if (directId && index.relationshipsById.has(directId)) {
    return directId;
  }
  return index.relationshipsById.has(reference.stableKey) ? reference.stableKey : null;
}

function normalizeCanvasLayoutMode(layoutMode: string | null | undefined): BrowserCanvasLayoutMode {
  return layoutMode === 'radial' ? 'radial' : 'grid';
}
