import { getOrBuildBrowserSnapshotIndex } from '../../browser-snapshot';
import { browserSessionLifecycleAdapter } from '../ports/browserSessionAdapter';
import type {
  SavedCanvasBrowserCanvasEdge,
  SavedCanvasBrowserCanvasNode,
} from '../ports/browserSession';
import type { SavedCanvasEdge, SavedCanvasNode } from '../model/document';
import {
  normalizeCanvasLayoutMode,
  resolveSavedCanvasReferenceId,
  type BrowserSnapshotIndex,
  type RestoreSavedCanvasToBrowserSessionOptions,
  type RestoreSavedCanvasToBrowserSessionResult,
} from './sessionMapping.shared';

export function restoreSavedCanvasToBrowserSession(
  options: RestoreSavedCanvasToBrowserSessionOptions,
): RestoreSavedCanvasToBrowserSessionResult {
  const { document, payload, preparedAt } = options;
  const index = getOrBuildBrowserSnapshotIndex(payload);
  let state = browserSessionLifecycleAdapter.openSnapshotSession(browserSessionLifecycleAdapter.createEmptyState(), {
    workspaceId: document.bindings.currentTargetSnapshot?.workspaceId ?? document.bindings.originSnapshot.workspaceId,
    repositoryId: payload.source.repositoryId,
    payload,
    preparedAt,
    keepViewState: false,
  });

  const unresolvedNodeIds: string[] = [];
  const unresolvedEdgeIds: string[] = [];
  const nodeIdsOnCanvas = new Set<string>();

  const canvasNodes: SavedCanvasBrowserCanvasNode[] = [];
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

  const canvasEdges: SavedCanvasBrowserCanvasEdge[] = [];
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

function restoreSavedCanvasNode(
  node: SavedCanvasNode,
  index: BrowserSnapshotIndex,
): SavedCanvasBrowserCanvasNode | null {
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
  index: BrowserSnapshotIndex,
  nodeIdsOnCanvas: Set<string>,
): SavedCanvasBrowserCanvasEdge | null {
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
