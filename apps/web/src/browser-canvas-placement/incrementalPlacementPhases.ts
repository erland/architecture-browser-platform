import type { FullSnapshotEntity, FullSnapshotRelationship } from '../app-model';
import {
  createBrowserAutoLayoutPipelineContext,
  type BrowserAutoLayoutGraph,
  type BrowserAutoLayoutNode,
} from '../browser-auto-layout';
import type { BrowserSnapshotIndex } from '../browser-snapshot';
import type { BrowserCanvasNode, BrowserSessionState } from '../browser-session';
import { syncMeaningfulCanvasEdges } from '../browser-session/canvas/relationships';
import type { BrowserCanvasPlacementOptions } from './types';
import { getCanvasNodeById, placeCanvasNodeNearAnchor, placeContainedCanvasNode, placePeerCanvasNode } from './incrementalPlacement';
import { placeAppendedCanvasNode, placeFirstCanvasNode } from './initialPlacement';

export type InsertionDirection = 'around' | 'left' | 'right';

export type BrowserIncrementalPlacementOptions = {
  anchorEntityId?: string | null;
  anchorDirection?: InsertionDirection;
  selectedScopeId?: string | null;
  insertionIndex?: number;
  insertionCount?: number;
};

export type BrowserIncrementalPlacementContext = {
  nodes: BrowserCanvasNode[];
  index: BrowserSnapshotIndex;
  entity: FullSnapshotEntity;
  insertionIndex: number;
  insertionCount: number;
  requestedAnchorEntityId: string | null;
  requestedAnchorDirection: InsertionDirection | null;
  selectedScopeId: string | null;
  layoutOptions?: BrowserCanvasPlacementOptions;
  visibleEntityIds: Set<string>;
  relevantRelationships: FullSnapshotRelationship[];
  graph: BrowserAutoLayoutGraph | null;
};

export function compareInsertionRelationships(left: FullSnapshotRelationship, right: FullSnapshotRelationship) {
  return left.externalId.localeCompare(right.externalId);
}

export function getVisibleInsertionRelationships(index: BrowserSnapshotIndex, visibleEntityIds: Set<string>) {
  return [...index.relationshipsById.values()]
    .filter((relationship) => visibleEntityIds.has(relationship.fromEntityId) && visibleEntityIds.has(relationship.toEntityId))
    .sort(compareInsertionRelationships);
}

function buildSyntheticInsertionState(
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

export function createIncrementalPlacementContext(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  insertionOptions?: BrowserIncrementalPlacementOptions,
  layoutOptions?: BrowserCanvasPlacementOptions,
): BrowserIncrementalPlacementContext {
  const visibleEntityIds = new Set(
    nodes
      .filter((node) => node.kind === 'entity')
      .map((node) => node.id),
  );
  visibleEntityIds.add(entity.externalId);

  const relevantRelationships = getVisibleInsertionRelationships(index, visibleEntityIds)
    .filter((relationship) => relationship.fromEntityId === entity.externalId || relationship.toEntityId === entity.externalId);

  let graph: BrowserAutoLayoutGraph | null = null;
  if (layoutOptions?.state) {
    const { syntheticNodes, syntheticState } = buildSyntheticInsertionState(layoutOptions.state, nodes, entity.externalId);
    graph = createBrowserAutoLayoutPipelineContext({
      mode: 'structure',
      nodes: syntheticNodes,
      edges: syntheticState.canvasEdges,
      options: layoutOptions,
      state: syntheticState,
    }).graph;
  }

  return {
    nodes,
    index,
    entity,
    insertionIndex: insertionOptions?.insertionIndex ?? 0,
    insertionCount: insertionOptions?.insertionCount ?? 1,
    requestedAnchorEntityId: insertionOptions?.anchorEntityId ?? null,
    requestedAnchorDirection: insertionOptions?.anchorDirection ?? null,
    selectedScopeId: insertionOptions?.selectedScopeId ?? null,
    layoutOptions,
    visibleEntityIds,
    relevantRelationships,
    graph,
  };
}

export function resolveInsertionDirection(
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

function compareGraphAnchorCandidates(
  left: string,
  right: string,
  graphNodesById: Map<string, BrowserAutoLayoutNode>,
  requestedAnchorEntityId: string | null,
) {
  if (left === requestedAnchorEntityId) {
    return -1;
  }
  if (right === requestedAnchorEntityId) {
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
}

export function resolveExplicitAnchorPlacement(context: BrowserIncrementalPlacementContext) {
  if (!context.requestedAnchorEntityId) {
    return null;
  }
  const anchorNode = getCanvasNodeById(context.nodes, 'entity', context.requestedAnchorEntityId);
  if (!anchorNode) {
    return null;
  }
  return placeCanvasNodeNearAnchor(
    context.nodes,
    'entity',
    anchorNode,
    context.insertionIndex,
    context.insertionCount,
    context.requestedAnchorDirection ?? 'around',
    context.layoutOptions,
  );
}

export function resolveGraphAwareAnchorPlacement(context: BrowserIncrementalPlacementContext) {
  if (!context.graph || context.relevantRelationships.length === 0) {
    return null;
  }

  const neighborIds = [...new Set(context.relevantRelationships.flatMap((relationship) => [relationship.fromEntityId, relationship.toEntityId]))]
    .filter((candidateId) => candidateId !== context.entity.externalId);
  if (neighborIds.length === 0) {
    return null;
  }

  const graphNodesById = new Map(context.graph.nodes.map((node) => [node.id, node]));
  const anchorNodeId = [...neighborIds].sort((left, right) => compareGraphAnchorCandidates(left, right, graphNodesById, context.requestedAnchorEntityId))[0] ?? null;
  if (!anchorNodeId) {
    return null;
  }

  const anchorNode = getCanvasNodeById(context.nodes, 'entity', anchorNodeId);
  if (!anchorNode) {
    return null;
  }

  const direction = context.requestedAnchorEntityId === anchorNodeId
    ? (context.requestedAnchorDirection ?? resolveInsertionDirection(context.entity.externalId, anchorNodeId, context.relevantRelationships))
    : resolveInsertionDirection(context.entity.externalId, anchorNodeId, context.relevantRelationships);

  return placeCanvasNodeNearAnchor(
    context.nodes,
    'entity',
    anchorNode,
    context.insertionIndex,
    context.insertionCount,
    direction,
    context.layoutOptions,
  );
}

export function resolveScopeAwarePlacement(context: BrowserIncrementalPlacementContext) {
  const scopeId = context.entity.scopeId ?? null;
  const scopeNode = scopeId ? getCanvasNodeById(context.nodes, 'scope', scopeId) : null;
  if (scopeNode) {
    return placeContainedCanvasNode(context.nodes, 'entity', scopeNode, context.insertionIndex, context.layoutOptions);
  }

  if (context.selectedScopeId) {
    const selectedScopeNode = getCanvasNodeById(context.nodes, 'scope', context.selectedScopeId);
    if (selectedScopeNode) {
      return placeContainedCanvasNode(context.nodes, 'entity', selectedScopeNode, context.insertionIndex, context.layoutOptions);
    }
  }

  return null;
}

export function resolvePeerAwarePlacement(context: BrowserIncrementalPlacementContext) {
  const scopeId = context.entity.scopeId ?? null;
  const peerNodes = context.nodes.filter((node) => {
    if (node.kind !== 'entity') {
      return false;
    }
    const peer = context.index.entitiesById.get(node.id);
    return peer?.scopeId === scopeId;
  });
  if (peerNodes.length === 0) {
    return null;
  }
  return placePeerCanvasNode(context.nodes, 'entity', peerNodes, context.insertionIndex, context.layoutOptions);
}

export function resolveAppendPlacement(context: BrowserIncrementalPlacementContext) {
  return placeAppendedCanvasNode(context.nodes, 'entity', context.insertionIndex, context.layoutOptions);
}

export function planEntityIncrementalPlacement(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  insertionOptions?: BrowserIncrementalPlacementOptions,
  layoutOptions?: BrowserCanvasPlacementOptions,
) {
  const context = createIncrementalPlacementContext(nodes, index, entity, insertionOptions, layoutOptions);
  if (context.nodes.length === 0) {
    return placeFirstCanvasNode('entity');
  }

  return resolveExplicitAnchorPlacement(context)
    ?? resolveGraphAwareAnchorPlacement(context)
    ?? resolveScopeAwarePlacement(context)
    ?? resolvePeerAwarePlacement(context)
    ?? resolveAppendPlacement(context);
}
