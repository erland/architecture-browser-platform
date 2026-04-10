import type { BrowserCanvasNode } from '../browser-session/types';
import type { BrowserCanvasPlacement } from './types';
import type { BrowserIncrementalPlacementContext, InsertionDirection } from './incrementalPlacementPhases';
import { getCanvasNodeById, placeCanvasNodeNearAnchor, placeContainedCanvasNode, placePeerCanvasNode } from './incrementalPlacement';
import { placeAppendedCanvasNode, placeFirstCanvasNode } from './initialPlacement';
import { chooseGraphAnchorCandidate, resolveInsertionDirection } from './incrementalPlacementGraphAnchorPolicy';

export type BrowserIncrementalPlacementPlan =
  | { kind: 'first-node' }
  | { kind: 'explicit-anchor'; anchorNode: BrowserCanvasNode; direction: InsertionDirection }
  | { kind: 'graph-anchor'; anchorNode: BrowserCanvasNode; direction: InsertionDirection }
  | { kind: 'scope-contained'; scopeNode: BrowserCanvasNode }
  | { kind: 'peer'; peerNodes: BrowserCanvasNode[] }
  | { kind: 'append' };

export function resolveExplicitAnchorPlan(context: BrowserIncrementalPlacementContext): BrowserIncrementalPlacementPlan | null {
  if (!context.requestedAnchorEntityId) {
    return null;
  }
  const anchorNode = getCanvasNodeById(context.nodes, 'entity', context.requestedAnchorEntityId);
  if (!anchorNode) {
    return null;
  }
  return {
    kind: 'explicit-anchor',
    anchorNode,
    direction: context.requestedAnchorDirection ?? 'around',
  };
}

export function resolveGraphAwareAnchorPlan(context: BrowserIncrementalPlacementContext): BrowserIncrementalPlacementPlan | null {
  if (!context.graph || context.relevantRelationships.length === 0) {
    return null;
  }

  const neighborIds = [...new Set(context.relevantRelationships.flatMap((relationship) => [relationship.fromEntityId, relationship.toEntityId]))]
    .filter((candidateId) => candidateId !== context.entity.externalId);
  if (neighborIds.length === 0) {
    return null;
  }

  const graphNodesById = new Map(context.graph.nodes.map((node) => [node.id, node]));
  const anchorNodeId = chooseGraphAnchorCandidate(neighborIds, graphNodesById, context.requestedAnchorEntityId);
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

  return {
    kind: 'graph-anchor',
    anchorNode,
    direction,
  };
}

export function resolveScopeAwarePlan(context: BrowserIncrementalPlacementContext): BrowserIncrementalPlacementPlan | null {
  const scopeId = context.entity.scopeId ?? null;
  const scopeNode = scopeId ? getCanvasNodeById(context.nodes, 'scope', scopeId) : null;
  if (scopeNode) {
    return { kind: 'scope-contained', scopeNode };
  }

  if (context.selectedScopeId) {
    const selectedScopeNode = getCanvasNodeById(context.nodes, 'scope', context.selectedScopeId);
    if (selectedScopeNode) {
      return { kind: 'scope-contained', scopeNode: selectedScopeNode };
    }
  }

  return null;
}

export function resolvePeerAwarePlan(context: BrowserIncrementalPlacementContext): BrowserIncrementalPlacementPlan | null {
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
  return { kind: 'peer', peerNodes };
}

export function resolveIncrementalPlacementPlan(context: BrowserIncrementalPlacementContext): BrowserIncrementalPlacementPlan {
  if (context.nodes.length === 0) {
    return { kind: 'first-node' };
  }
  return resolveExplicitAnchorPlan(context)
    ?? resolveGraphAwareAnchorPlan(context)
    ?? resolveScopeAwarePlan(context)
    ?? resolvePeerAwarePlan(context)
    ?? { kind: 'append' };
}

export function executeIncrementalPlacementPlan(
  context: BrowserIncrementalPlacementContext,
  plan: BrowserIncrementalPlacementPlan,
): BrowserCanvasPlacement {
  switch (plan.kind) {
    case 'first-node':
      return placeFirstCanvasNode('entity');
    case 'explicit-anchor':
    case 'graph-anchor':
      return placeCanvasNodeNearAnchor(
        context.nodes,
        'entity',
        plan.anchorNode,
        context.insertionIndex,
        context.insertionCount,
        plan.direction,
        context.layoutOptions,
      );
    case 'scope-contained':
      return placeContainedCanvasNode(context.nodes, 'entity', plan.scopeNode, context.insertionIndex, context.layoutOptions);
    case 'peer':
      return placePeerCanvasNode(context.nodes, 'entity', plan.peerNodes, context.insertionIndex, context.layoutOptions);
    case 'append':
      return placeAppendedCanvasNode(context.nodes, 'entity', context.insertionIndex, context.layoutOptions);
  }
}
