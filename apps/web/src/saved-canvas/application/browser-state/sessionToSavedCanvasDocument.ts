import type { FullSnapshotRelationship } from '../../../app-model';
import type {
  SavedCanvasBrowserCanvasEdge,
  SavedCanvasBrowserCanvasNode,
} from './browserSessionPort';
import {
  createSavedCanvasDocument,
  type SavedCanvasEdge,
  type SavedCanvasItemReference,
  type SavedCanvasNode,
  toSavedCanvasSnapshotRef,
} from '../../domain/model/document';
import {
  createSavedCanvasEntityReference,
  createSavedCanvasRelationshipReference,
  createSavedCanvasScopeReference,
} from '../../domain/rebinding-impl/stableReferences';
import type { CreateSavedCanvasFromBrowserSessionOptions } from './sessionMapping.shared';

export function createSavedCanvasDocumentFromBrowserSession(
  options: CreateSavedCanvasFromBrowserSessionOptions,
) {
  const { state } = options;
  if (!state.activeSnapshot || !state.payload || !state.index) {
    throw new Error('Cannot save canvas without an active Browser snapshot session.');
  }

  const index = state.index;
  const hiddenNodeIds: string[] = [];
  const hiddenEdgeIds: string[] = [];

  const nodes = state.canvasNodes.map((node) => {
    const savedNode = mapBrowserCanvasNodeToSavedCanvasNode(node, index);
    if (savedNode.presentation.hidden) {
      hiddenNodeIds.push(savedNode.canvasNodeId);
    }
    return savedNode;
  });

  const edges = state.canvasEdges.map((edge) => {
    const savedEdge = mapBrowserCanvasEdgeToSavedCanvasEdge(edge, index);
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

function mapBrowserCanvasNodeToSavedCanvasNode(
  node: SavedCanvasBrowserCanvasNode,
  index: NonNullable<CreateSavedCanvasFromBrowserSessionOptions['state']['index']>,
): SavedCanvasNode {
  const reference = node.kind === 'scope'
    ? createSavedCanvasScopeReference(index, node.id)
    : createSavedCanvasEntityReference(index, node.id);

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

function mapBrowserCanvasEdgeToSavedCanvasEdge(
  edge: SavedCanvasBrowserCanvasEdge,
  index: NonNullable<CreateSavedCanvasFromBrowserSessionOptions['state']['index']>,
): SavedCanvasEdge {
  const relationship = index.relationshipsById.get(edge.relationshipId);
  return {
    canvasEdgeId: edge.relationshipId,
    reference: mapRelationshipReference(relationship, edge.relationshipId, index),
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
  index: NonNullable<CreateSavedCanvasFromBrowserSessionOptions['state']['index']>,
): SavedCanvasItemReference {
  if (!relationship) {
    return createSavedCanvasRelationshipReference(index, fallbackRelationshipId);
  }
  return createSavedCanvasRelationshipReference(index, relationship.externalId);
}
