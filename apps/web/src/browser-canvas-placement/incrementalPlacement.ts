import type { FullSnapshotEntity, FullSnapshotRelationship } from '../appModel';
import type { BrowserSnapshotIndex } from '../browserSnapshotIndex';
import { extractBrowserAutoLayoutGraph } from '../browser-auto-layout';
import {
  CONTAINED_OFFSET_X,
  CONTAINED_OFFSET_Y,
  PEER_SPACING_X,
  PEER_SPACING_Y,
  RADIAL_RADIUS,
} from '../browserCanvasPlacement.policy';
import type { BrowserCanvasNode, BrowserSessionState } from '../browserSessionStore';
import type {
  BrowserCanvasNodeLike,
  BrowserCanvasNodeSizeLike,
  BrowserCanvasPlacement,
  BrowserCanvasPlacementOptions,
} from './types';
import { avoidBrowserCanvasCollisions, getNodeSize } from './collision';
import { placeAppendedCanvasNode, placeFirstCanvasNode } from './initialPlacement';
import { syncMeaningfulCanvasEdges } from '../browserSessionStore.canvas.relationships';

export function placeCanvasNodeNearAnchor(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  anchor: BrowserCanvasNodeSizeLike,
  index: number,
  total: number,
  direction: 'around' | 'left' | 'right' = 'around',
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const anchorSize = getNodeSize(anchor, options);
  const anchorCenterX = anchor.x + anchorSize.width / 2;
  const anchorCenterY = anchor.y + anchorSize.height / 2;
  const radius = RADIAL_RADIUS + Math.floor(index / 6) * 48;

  let angle: number;
  if (direction === 'left') {
    angle = Math.PI + ((index - Math.max(0, total - 1) / 2) * Math.PI) / Math.max(3, total + 1);
  } else if (direction === 'right') {
    angle = ((index - Math.max(0, total - 1) / 2) * Math.PI) / Math.max(3, total + 1);
  } else {
    angle = -Math.PI / 2 + (index * (2 * Math.PI)) / Math.max(1, total);
  }

  const size = getNodeSize({ kind, x: 0, y: 0 }, options);
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: anchorCenterX + Math.cos(angle) * radius - size.width / 2,
    y: anchorCenterY + Math.sin(angle) * radius - size.height / 2,
  }, options);
}

export function placeContainedCanvasNode(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  containerNode: BrowserCanvasNodeSizeLike,
  index: number,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: containerNode.x + CONTAINED_OFFSET_X + (index % 2) * 24,
    y: containerNode.y + CONTAINED_OFFSET_Y + index * PEER_SPACING_Y,
  }, options);
}

export function placePeerCanvasNode(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  peerNodes: BrowserCanvasNodeSizeLike[],
  index: number,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const peers = peerNodes.filter((peer) => peer.kind === kind);
  if (peers.length === 0) {
    return placeAppendedCanvasNode(nodes, kind, index, options);
  }
  const sorted = [...peers].sort((left, right) => left.y - right.y || left.x - right.x);
  const lastPeer = sorted[sorted.length - 1];
  const column = sorted.length % 3;
  const row = Math.floor(sorted.length / 3);
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: lastPeer.x + (column === 0 ? PEER_SPACING_X : 0),
    y: sorted[0].y + row * PEER_SPACING_Y + index * 8,
  }, options);
}

export function getCanvasNodeById(nodes: BrowserCanvasNode[], kind: BrowserCanvasNode['kind'], id: string) {
  return nodes.find((node) => node.kind === kind && node.id === id) ?? null;
}



type InsertionDirection = 'around' | 'left' | 'right';

function compareInsertionRelationships(left: FullSnapshotRelationship, right: FullSnapshotRelationship) {
  return left.externalId.localeCompare(right.externalId);
}

function getVisibleInsertionRelationships(index: BrowserSnapshotIndex, visibleEntityIds: Set<string>) {
  const relationships = [...index.relationshipsById.values()]
    .filter((relationship) => visibleEntityIds.has(relationship.fromEntityId) && visibleEntityIds.has(relationship.toEntityId))
    .sort(compareInsertionRelationships);
  return relationships;
}

function buildInsertionState(
  state: BrowserSessionState,
  nodes: BrowserCanvasNode[],
  entityId: string,
) {
  const syntheticNodes = [...nodes, { kind: 'entity' as const, id: entityId, x: 0, y: 0 }];
  const syntheticState = {
    ...state,
    canvasNodes: syntheticNodes,
    canvasEdges: syncMeaningfulCanvasEdges({ ...state, canvasNodes: syntheticNodes }, syntheticNodes),
  };
  return { syntheticNodes, syntheticState };
}

function resolveInsertionDirection(
  candidateId: string,
  anchorId: string,
  relationships: FullSnapshotRelationship[],
): InsertionDirection {
  const hasCandidateToAnchor = relationships.some((relationship) => relationship.fromEntityId === candidateId && relationship.toEntityId === anchorId);
  const hasAnchorToCandidate = relationships.some((relationship) => relationship.fromEntityId === anchorId && relationship.toEntityId === candidateId);
  if (hasCandidateToAnchor && !hasAnchorToCandidate) {
    return 'left';
  }
  if (hasAnchorToCandidate && !hasCandidateToAnchor) {
    return 'right';
  }
  return 'around';
}

function chooseGraphInsertionAnchor(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  state: BrowserSessionState,
  insertionOptions?: {
    anchorEntityId?: string | null;
    anchorDirection?: InsertionDirection;
    selectedScopeId?: string | null;
    insertionIndex?: number;
    insertionCount?: number;
  },
) {
  const visibleEntityIds = new Set(
    nodes
      .filter((node) => node.kind === 'entity')
      .map((node) => node.id),
  );
  visibleEntityIds.add(entity.externalId);

  const relevantRelationships = getVisibleInsertionRelationships(index, visibleEntityIds)
    .filter((relationship) => relationship.fromEntityId === entity.externalId || relationship.toEntityId === entity.externalId);
  if (relevantRelationships.length === 0) {
    return null;
  }

  const { syntheticNodes, syntheticState } = buildInsertionState(state, nodes, entity.externalId);
  const graph = extractBrowserAutoLayoutGraph({
    mode: 'structure',
    state: syntheticState,
    nodes: syntheticNodes,
    edges: syntheticState.canvasEdges,
  });

  const neighborIds = [...new Set(relevantRelationships.flatMap((relationship) => [relationship.fromEntityId, relationship.toEntityId]))]
    .filter((candidateId) => candidateId !== entity.externalId);
  if (neighborIds.length === 0) {
    return null;
  }

  const graphNodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const anchorNodeId = [...neighborIds].sort((left, right) => {
    if (left === (insertionOptions?.anchorEntityId ?? null)) {
      return -1;
    }
    if (right === (insertionOptions?.anchorEntityId ?? null)) {
      return 1;
    }
    const leftNode = graphNodesById.get(left);
    const rightNode = graphNodesById.get(right);
    if ((leftNode?.focused ?? false) !== (rightNode?.focused ?? false)) {
      return leftNode?.focused ? -1 : 1;
    }
    if ((leftNode?.selected ?? false) !== (rightNode?.selected ?? false)) {
      return leftNode?.selected ? -1 : 1;
    }
    if ((leftNode?.anchored ?? false) !== (rightNode?.anchored ?? false)) {
      return leftNode?.anchored ? -1 : 1;
    }
    if ((leftNode?.incidentCount ?? 0) !== (rightNode?.incidentCount ?? 0)) {
      return (rightNode?.incidentCount ?? 0) - (leftNode?.incidentCount ?? 0);
    }
    return left.localeCompare(right);
  })[0] ?? null;

  if (!anchorNodeId) {
    return null;
  }

  const anchorNode = getCanvasNodeById(nodes, 'entity', anchorNodeId);
  if (!anchorNode) {
    return null;
  }

  return {
    anchorNode,
    direction: insertionOptions?.anchorEntityId === anchorNodeId
      ? (insertionOptions?.anchorDirection ?? resolveInsertionDirection(entity.externalId, anchorNodeId, relevantRelationships))
      : resolveInsertionDirection(entity.externalId, anchorNodeId, relevantRelationships),
  };
}
export function planEntityInsertion(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  insertionOptions?: {
    anchorEntityId?: string | null;
    anchorDirection?: 'around' | 'left' | 'right';
    selectedScopeId?: string | null;
    insertionIndex?: number;
    insertionCount?: number;
  },
  layoutOptions?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const insertionIndex = insertionOptions?.insertionIndex ?? 0;
  const insertionCount = insertionOptions?.insertionCount ?? 1;
  if (nodes.length === 0) {
    return placeFirstCanvasNode('entity');
  }

  const anchorEntityId = insertionOptions?.anchorEntityId ?? null;
  if (anchorEntityId) {
    const anchorNode = getCanvasNodeById(nodes, 'entity', anchorEntityId);
    if (anchorNode) {
      return placeCanvasNodeNearAnchor(nodes, 'entity', anchorNode, insertionIndex, insertionCount, insertionOptions?.anchorDirection ?? 'around', layoutOptions);
    }
  }

  const graphInsertion = layoutOptions?.state
    ? chooseGraphInsertionAnchor(nodes, index, entity, layoutOptions.state, insertionOptions)
    : null;
  if (graphInsertion) {
    return placeCanvasNodeNearAnchor(
      nodes,
      'entity',
      graphInsertion.anchorNode,
      insertionIndex,
      insertionCount,
      graphInsertion.direction,
      layoutOptions,
    );
  }

  const scopeId = entity.scopeId ?? null;
  const scopeNode = scopeId ? getCanvasNodeById(nodes, 'scope', scopeId) : null;
  if (scopeNode) {
    return placeContainedCanvasNode(nodes, 'entity', scopeNode, insertionIndex, layoutOptions);
  }

  const peerNodes = nodes.filter((node) => {
    if (node.kind !== 'entity') {
      return false;
    }
    const peer = index.entitiesById.get(node.id);
    return peer?.scopeId === scopeId;
  });
  if (peerNodes.length > 0) {
    return placePeerCanvasNode(nodes, 'entity', peerNodes, insertionIndex, layoutOptions);
  }

  if (insertionOptions?.selectedScopeId) {
    const selectedScopeNode = getCanvasNodeById(nodes, 'scope', insertionOptions.selectedScopeId);
    if (selectedScopeNode) {
      return placeContainedCanvasNode(nodes, 'entity', selectedScopeNode, insertionIndex, layoutOptions);
    }
  }

  return placeAppendedCanvasNode(nodes, 'entity', insertionIndex, layoutOptions);
}

export function planScopeInsertion(
  nodes: BrowserCanvasNode[],
  _scopeId: string,
  insertionIndex = 0,
): BrowserCanvasPlacement {
  if (nodes.length === 0) {
    return placeFirstCanvasNode('scope');
  }
  return placeAppendedCanvasNode(nodes, 'scope', insertionIndex);
}
