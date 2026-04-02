import {
  getDefaultCanvasNodePosition,
  planEntityInsertion,
  planScopeInsertion,
} from '../../browser-canvas-placement';
import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import type {
  BrowserCanvasEdge,
  BrowserCanvasNode,
  BrowserSessionState,
} from '../browserSessionStore.types';

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

export function upsertCanvasNode(
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

export function normalizeCanvasNodes(nodes: BrowserCanvasNode[]) {
  let normalized: BrowserCanvasNode[] = [];
  for (const node of nodes) {
    normalized = upsertCanvasNode(normalized, node, getDefaultCanvasNodePosition(node.kind, normalized));
  }
  return normalized;
}

export function upsertCanvasEdge(edges: BrowserCanvasEdge[], nextEdge: BrowserCanvasEdge) {
  const existing = edges.find((edge) => edge.relationshipId === nextEdge.relationshipId);
  return existing ? edges : [...edges, nextEdge];
}

export function upsertPinnedCanvasNode(nodes: BrowserCanvasNode[], kind: BrowserCanvasNode['kind'], id: string, pinned: boolean) {
  const existing = nodes.find((node) => node.kind === kind && node.id === id);
  if (!existing && !pinned) {
    return nodes;
  }
  if (!existing) {
    return upsertCanvasNode(nodes, { kind, id, pinned });
  }
  return nodes.map((node) => node.kind === kind && node.id === id ? { ...node, pinned } : node);
}

export function upsertSelectedEntityIds(selectedEntityIds: string[], entityId: string, additive: boolean) {
  if (additive) {
    return selectedEntityIds.includes(entityId)
      ? selectedEntityIds.filter((current) => current !== entityId)
      : [...selectedEntityIds, entityId];
  }
  return [entityId];
}

export function planEntityNodePosition(
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
    return getDefaultCanvasNodePosition('entity', state.canvasNodes, { state });
  }
  return planEntityInsertion(state.canvasNodes, state.index, entity, {
    anchorEntityId: options?.anchorEntityId ?? (state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null),
    anchorDirection: options?.anchorDirection,
    selectedScopeId: state.selectedScopeId,
    insertionIndex: options?.insertionIndex,
    insertionCount: options?.insertionCount,
  }, { state });
}

export function planScopeNodePosition(state: BrowserSessionState, scopeId: string, insertionIndex = 0) {
  return planScopeInsertion(state.canvasNodes, scopeId, insertionIndex);
}

export function createCanvasEdgesForRelationshipIds(index: BrowserSnapshotIndex, relationshipIds: string[]) {
  return relationshipIds
    .map((relationshipId) => index.relationshipsById.get(relationshipId))
    .filter((relationship): relationship is NonNullable<typeof relationship> => Boolean(relationship))
    .map((relationship) => ({
      relationshipId: relationship.externalId,
      fromEntityId: relationship.fromEntityId,
      toEntityId: relationship.toEntityId,
    }));
}
