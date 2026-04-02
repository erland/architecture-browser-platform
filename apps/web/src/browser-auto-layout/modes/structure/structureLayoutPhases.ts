import type { BrowserCanvasNode } from '../../../browser-session';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildUndirectedAdjacency, compareNodePriority, reduceLayerCrossings, sortBandNodesByBarycenter } from '../../shared/ordering';
import {
  findAnchoredComponentNodes,
  findFirstPriorityNode,
  findFocusedOrSelectedComponentNode,
  findZeroIndegreeComponentNodes,
} from '../../shared/rootSelection';
import { getBrowserAutoLayoutConfig, getWrappedBandOffset, isHardAnchorCanvasNode } from '../../core/config';
import {
  assignNodesToAnchors,
  buildFallbackFreeNodeOrigin,
  enforceAnchoredPlacementClearance,
  finalizeComponentPlacement,
  prepareAnchoredComponentPlacement,
} from '../../shared/layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from '../../shared/layoutFreePlacement';
import {
  buildDirectedAdjacency,
  compareIds,
  getComponentEdges,
  getEntityComponentNodes,
  getInitialEntityOrigin,
} from '../../shared/layoutShared';
import { buildCenteredVerticalTopPositions, buildSequentialBandLeftPositions } from '../../shared/layoutFootprint';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';

export function chooseStructureComponentRoot(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const preferred = findFocusedOrSelectedComponentNode(componentNodes, graph);
  if (preferred) {
    return preferred;
  }

  const indegree = new Map<string, number>(componentNodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    if (indegree.has(edge.toEntityId) && indegree.has(edge.fromEntityId)) {
      indegree.set(edge.toEntityId, (indegree.get(edge.toEntityId) ?? 0) + 1);
    }
  }

  const anchored = findAnchoredComponentNodes(componentNodes, (node) => node.pinned || node.manuallyPlaced, compareNodePriority)[0];
  if (anchored) {
    return anchored;
  }

  const zeroIndegree = findZeroIndegreeComponentNodes(componentNodes, indegree, compareNodePriority);
  if (zeroIndegree.length > 0) {
    return zeroIndegree[0];
  }

  return findFirstPriorityNode(componentNodes, compareNodePriority);
}

export function assignStructureLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
): Map<string, number> {
  const levels = new Map<string, number>();
  const { outbound, indegree } = buildDirectedAdjacency(componentNodes, edges);

  const sourceRoots = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  const seededRoots = [root, ...sourceRoots.filter((node) => node.id !== root.id)];
  const queue: string[] = [];

  let nextSeedLevel = 0;
  for (const seed of seededRoots) {
    if (levels.has(seed.id)) {
      continue;
    }
    levels.set(seed.id, nextSeedLevel);
    queue.push(seed.id);
    nextSeedLevel += 1;
  }

  if (queue.length === 0) {
    levels.set(root.id, 0);
    queue.push(root.id);
  }

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = levels.get(currentId) ?? 0;
    const neighbors = [...(outbound.get(currentId) ?? [])].sort(compareIds);
    for (const neighborId of neighbors) {
      const candidateLevel = currentLevel + 1;
      const existing = levels.get(neighborId);
      if (existing === undefined || candidateLevel > existing) {
        levels.set(neighborId, candidateLevel);
        queue.push(neighborId);
      }
    }
  }

  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const fallbackVisited = new Set<string>(levels.keys());
  const fallbackQueue = [...levels.keys()];
  while (fallbackQueue.length > 0) {
    const currentId = fallbackQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = levels.get(currentId) ?? 0;
    const neighbors = [...(adjacency.get(currentId) ?? [])].sort(compareIds);
    for (const neighborId of neighbors) {
      if (fallbackVisited.has(neighborId)) {
        continue;
      }
      fallbackVisited.add(neighborId);
      levels.set(neighborId, currentLevel + 1);
      fallbackQueue.push(neighborId);
    }
  }

  for (const node of componentNodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, nextSeedLevel);
      nextSeedLevel += 1;
    }
  }

  return levels;
}

export function buildStructureBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
) {
  const levels = assignStructureLevels(componentNodes, edges, root);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const { outbound, inbound } = buildDirectedAdjacency(componentNodes, edges);
  const grouped = new Map<number, BrowserAutoLayoutNode[]>();
  for (const node of componentNodes) {
    const level = levels.get(node.id) ?? 0;
    const key = Number.isFinite(level) ? level : 0;
    grouped.set(key, [...(grouped.get(key) ?? []), node]);
  }

  const fixedOrder = new Map<string, number>([[root.id, 0]]);
  const initialBands = [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, nodes]) => {
      const orderedNodes = level === 0
        ? [...nodes].sort(compareNodePriority)
        : sortBandNodesByBarycenter(nodes, adjacency, fixedOrder, compareNodePriority);
      orderedNodes.forEach((node, index) => fixedOrder.set(node.id, index));
      return { level, nodes: orderedNodes };
    });

  return reduceLayerCrossings(initialBands, inbound, outbound, compareNodePriority);
}

export function placeStructureAnchoredComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request, graph } = context;
  const prepared = prepareAnchoredComponentPlacement(component, request, graph, nodeById, canvasNodeByKey, arranged);
  if (!prepared) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const { config, componentNodes, componentEdges, anchorNodes } = prepared;
  let nextArranged = prepared.arrangedWithAnchors;
  const assignments = assignNodesToAnchors(componentNodes, componentEdges, anchorNodes);
  const freeNodes = componentNodes.filter((node) => !isHardAnchorCanvasNode(node, config));

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }

    const assignedNodes = freeNodes
      .filter((node) => assignments.get(node.id)?.anchorId === anchorNode.id)
      .sort((left, right) => {
        const leftDistance = assignments.get(left.id)?.distance ?? Number.MAX_SAFE_INTEGER;
        const rightDistance = assignments.get(right.id)?.distance ?? Number.MAX_SAFE_INTEGER;
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
        return compareNodePriority(left, right);
      });

    const groupedByDistance = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const distance = assignments.get(node.id)?.distance ?? 1;
      groupedByDistance.set(distance, [...(groupedByDistance.get(distance) ?? []), node]);
    }

    const bands = [...groupedByDistance.entries()].sort((left, right) => left[0] - right[0]).map(([level, nodes]) => ({
      level,
      nodes: [...nodes].sort(compareNodePriority),
    }));
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      bands,
      ({ band, index, config }) => {
        const wrapped = getWrappedBandOffset(index, config);
        const visibleNodes = band.nodes.slice(wrapped.wrapGroup * config.maxBreadth, (wrapped.wrapGroup + 1) * config.maxBreadth);
        const visiblePositions = buildCenteredVerticalTopPositions(visibleNodes, anchorCanvasNode.y + anchorNode.height / 2, config);
        return {
          x: anchorCanvasNode.x + (band.level + wrapped.wrapGroup) * config.horizontalSpacing,
          y: visiblePositions[wrapped.indexInGroup] ?? anchorCanvasNode.y,
        };
      },
    );
  }

  const unassignedNodes = freeNodes
    .filter((node) => !assignments.has(node.id))
    .sort(compareNodePriority);
  if (unassignedNodes.length > 0) {
    const fallbackOrigin = buildFallbackFreeNodeOrigin(nextArranged, fallbackOriginY);
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      [{ level: 0, nodes: unassignedNodes }],
      ({ index, config }) => {
        const wrapped = getWrappedBandOffset(index, config);
        return {
          x: fallbackOrigin.x,
          y: fallbackOrigin.y + wrapped.indexInGroup * config.verticalSpacing + wrapped.wrapGroup * (config.maxBreadth * config.verticalSpacing + Math.round(config.componentSpacing / 2)),
        };
      },
    );
  }

  nextArranged = enforceAnchoredPlacementClearance(nextArranged, freeNodes.map((node) => node.id), request);

  return finalizeComponentPlacement(component, request, nextArranged, fallbackOriginY);
}

export function placeStructureFreeComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request, graph } = context;
  const config = getBrowserAutoLayoutConfig(request);
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentEdges = getComponentEdges(component, graph);
  const root = chooseStructureComponentRoot(componentNodes, componentEdges, graph);
  if (!root) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };

  const bands = buildStructureBands(componentNodes, componentEdges, root);
  const baseBands = bands.map((band) => ({ level: band.level, nodes: band.nodes.slice(0, config.maxBreadth) }));
  const bandLeftByLevel = buildSequentialBandLeftPositions(baseBands, componentOrigin.x, config);

  const nextArranged = placeBandBasedFreeComponentNodes(
    arranged,
    request,
    canvasNodeByKey,
    bands,
    ({ band, index, config }) => {
      const wrapped = getWrappedBandOffset(index, config);
      const visibleNodes = band.nodes.slice(wrapped.wrapGroup * config.maxBreadth, (wrapped.wrapGroup + 1) * config.maxBreadth);
      const topPositions = buildCenteredVerticalTopPositions(
        visibleNodes,
        componentOrigin.y + wrapped.wrapGroup * Math.round(config.componentSpacing / 2),
        config,
      );
      return {
        x: (bandLeftByLevel.get(band.level) ?? componentOrigin.x) + wrapped.wrapGroup * config.horizontalSpacing,
        y: topPositions[wrapped.indexInGroup] ?? componentOrigin.y,
      };
    },
  );

  return finalizeComponentPlacement(component, request, nextArranged, fallbackOriginY);
}
