import { getBrowserCanvasBounds } from '../browser-canvas-placement/collision';
import { enforceVerticalColumnClearance } from './layoutFootprint';
import type { BrowserCanvasNode } from '../browserSessionStore.types';
import { getBrowserAutoLayoutConfig } from './config';
import { buildUndirectedAdjacency, compareNodePriority } from './ordering';
import { compareIds, getComponentEdges, getEntityComponentNodes, getInitialEntityOrigin } from './layoutShared';
import { getAnchoredNodes } from './layoutAnchors';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutRequest,
} from './types';

export type AnchorAssignment = {
  anchorId: string;
  distance: number;
};

export type PreparedAnchoredPlacement = {
  config: ReturnType<typeof getBrowserAutoLayoutConfig>;
  componentNodes: BrowserAutoLayoutNode[];
  componentEdges: BrowserAutoLayoutEdge[];
  anchorNodes: BrowserAutoLayoutNode[];
  arrangedWithAnchors: BrowserCanvasNode[];
};

export function assignNodesToAnchors(
  componentNodes: BrowserAutoLayoutNode[],
  componentEdges: BrowserAutoLayoutEdge[],
  anchorNodes: BrowserAutoLayoutNode[],
): Map<string, AnchorAssignment> {
  const adjacency = buildUndirectedAdjacency(componentNodes, componentEdges);
  const nodeById = new Map(componentNodes.map((node) => [node.id, node]));
  const anchorAssignments = new Map<string, AnchorAssignment>();
  const queue: Array<{ nodeId: string; anchorId: string; distance: number }> = [];

  for (const anchorNode of anchorNodes) {
    anchorAssignments.set(anchorNode.id, { anchorId: anchorNode.id, distance: 0 });
    queue.push({ nodeId: anchorNode.id, anchorId: anchorNode.id, distance: 0 });
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const neighbors = [...(adjacency.get(current.nodeId) ?? [])].sort(compareIds);
    for (const neighborId of neighbors) {
      const existing = anchorAssignments.get(neighborId);
      const candidate: AnchorAssignment = {
        anchorId: current.anchorId,
        distance: current.distance + 1,
      };
      if (!existing) {
        anchorAssignments.set(neighborId, candidate);
        queue.push({ nodeId: neighborId, anchorId: candidate.anchorId, distance: candidate.distance });
        continue;
      }

      if (candidate.distance < existing.distance) {
        anchorAssignments.set(neighborId, candidate);
        queue.push({ nodeId: neighborId, anchorId: candidate.anchorId, distance: candidate.distance });
        continue;
      }

      if (candidate.distance === existing.distance) {
        const candidateAnchor = nodeById.get(candidate.anchorId);
        const existingAnchor = nodeById.get(existing.anchorId);
        const preferred = [candidateAnchor, existingAnchor]
          .filter((node): node is BrowserAutoLayoutNode => Boolean(node))
          .sort(compareNodePriority)[0];
        if (preferred && preferred.id !== existing.anchorId) {
          anchorAssignments.set(neighborId, { anchorId: preferred.id, distance: candidate.distance });
          queue.push({ nodeId: neighborId, anchorId: preferred.id, distance: candidate.distance });
        }
      }
    }
  }

  return anchorAssignments;
}

export function prepareAnchoredComponentPlacement(
  component: BrowserAutoLayoutComponent,
  request: BrowserAutoLayoutRequest,
  graph: BrowserAutoLayoutGraph,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
): PreparedAnchoredPlacement | null {
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return null;
  }

  const componentEdges = getComponentEdges(component, graph);
  const anchorNodes = getAnchoredNodes(componentNodes, request);
  if (anchorNodes.length === 0) {
    return null;
  }

  let arrangedWithAnchors = [...arranged];
  for (const anchorNode of anchorNodes) {
    const original = canvasNodeByKey.get(anchorNode.key);
    if (!original) {
      continue;
    }
    if (!arrangedWithAnchors.some((node) => node.kind === original.kind && node.id === original.id)) {
      arrangedWithAnchors = [...arrangedWithAnchors, { ...original }];
    }
  }

  return {
    config: getBrowserAutoLayoutConfig(request),
    componentNodes,
    componentEdges,
    anchorNodes,
    arrangedWithAnchors,
  };
}


export type AnchoredPlacementSide = 'above' | 'below' | 'neutral';

export function enforceAnchoredPlacementClearance(
  arranged: BrowserCanvasNode[],
  movableNodeIds: string[],
  request: BrowserAutoLayoutRequest,
  sideByNodeId?: Map<string, AnchoredPlacementSide>,
) {
  if (movableNodeIds.length === 0) {
    return arranged;
  }

  const movableIds = new Set(movableNodeIds);
  const fixedNodes = arranged
    .filter((node) => !(node.kind === 'entity' && movableIds.has(node.id)))
    .map((node) => ({ kind: node.kind, id: node.id, x: node.x, y: node.y }));
  const movableNodes = arranged
    .filter((node) => node.kind === 'entity' && movableIds.has(node.id))
    .map((node) => ({ ...node }));

  if (movableNodes.length === 0) {
    return arranged;
  }

  const adjustedMovableNodes = enforceVerticalColumnClearance(fixedNodes, movableNodes, request.options, sideByNodeId);
  const adjustedById = new Map(adjustedMovableNodes.map((node) => [node.id, node]));
  return arranged.map((node) => (node.kind === 'entity' && movableIds.has(node.id)
    ? (adjustedById.get(node.id) ?? node)
    : node));
}

export function finalizeComponentPlacement(
  component: BrowserAutoLayoutComponent,
  request: BrowserAutoLayoutRequest,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
  fallbackNextOriginY?: number,
) {
  const config = getBrowserAutoLayoutConfig(request);
  const componentPlaced = arranged.filter((node) => node.kind === 'entity' && component.nodeIds.includes(node.id));
  const bounds = getBrowserCanvasBounds(componentPlaced, request.options);
  return {
    arranged,
    nextOriginY: Math.max(
      fallbackOriginY,
      fallbackNextOriginY ?? ((bounds?.maxY ?? fallbackOriginY) + config.componentSpacing),
    ),
  };
}

export function buildFallbackFreeNodeOrigin(arranged: BrowserCanvasNode[], fallbackOriginY: number) {
  return {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };
}
