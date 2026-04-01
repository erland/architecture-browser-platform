import { cleanupArrangedCanvasNodes } from '../browser-canvas-placement/postLayoutCleanup';
import type { BrowserCanvasNode } from '../browserSessionStore.types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutResult,
} from './types';
import { buildUndirectedAdjacency, compareNodePriority, reduceLayerCrossings, sortBandNodesByBarycenter } from './ordering';
import { getBrowserAutoLayoutConfig, getWrappedBandOffset, isHardAnchorCanvasNode } from './config';
import {
  assignNodesToAnchors,
  buildFallbackFreeNodeOrigin,
  enforceAnchoredPlacementClearance,
  finalizeComponentPlacement,
  prepareAnchoredComponentPlacement,
} from './layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from './layoutFreePlacement';
import {
  buildDirectedAdjacency,
  compareIds,
  getCanvasNodeByKey,
  getComponentEdges,
  getEntityComponentNodes,
  getInitialEntityOrigin,
  getNodeById,
  orderLayoutComponents,
} from './layoutShared';
import { buildCenteredVerticalTopPositions, buildSequentialBandLeftPositions } from './layoutFootprint';
import { placeScopeNodes } from './layoutScopePlacement';
import type { BrowserAutoLayoutPipelineContext } from './pipeline';

function chooseComponentRoot(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const focused = graph.focusedNodeId ? componentNodes.find((node) => node.id === graph.focusedNodeId) : null;
  if (focused) {
    return focused;
  }

  const selected = graph.selectedNodeIds
    .map((selectedNodeId) => componentNodes.find((node) => node.id === selectedNodeId) ?? null)
    .find((node): node is BrowserAutoLayoutNode => Boolean(node));
  if (selected) {
    return selected;
  }

  const indegree = new Map<string, number>(componentNodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    if (indegree.has(edge.toEntityId) && indegree.has(edge.fromEntityId)) {
      indegree.set(edge.toEntityId, (indegree.get(edge.toEntityId) ?? 0) + 1);
    }
  }

  const anchored = componentNodes.filter((node) => node.pinned || node.manuallyPlaced).sort(compareNodePriority)[0];
  if (anchored) {
    return anchored;
  }

  const zeroIndegree = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  if (zeroIndegree.length > 0) {
    return zeroIndegree[0];
  }

  return [...componentNodes].sort(compareNodePriority)[0] ?? null;
}

function assignLevels(
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

function getComponentBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
) {
  const levels = assignLevels(componentNodes, edges, root);
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

function placeAnchoredComponentNodes(
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

function placeFreeComponentNodes(
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
  const root = chooseComponentRoot(componentNodes, componentEdges, graph);
  if (!root) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };

  const bands = getComponentBands(componentNodes, componentEdges, root);
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

function placeComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request } = context;
  const hasHardAnchors = getEntityComponentNodes(component, nodeById)
    .some((node) => isHardAnchorCanvasNode(node, getBrowserAutoLayoutConfig(request)));

  return hasHardAnchors
    ? placeAnchoredComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeFreeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserStructureAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const { request, config, graph } = context;
  const nodeById = getNodeById(graph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);

  let arranged: BrowserCanvasNode[] = [];
  arranged = placeScopeNodes(request.nodes, arranged, request);

  let nextOriginY = getInitialEntityOrigin(arranged).y;

  for (const component of orderLayoutComponents(graph, nodeById, getBrowserAutoLayoutConfig(request).enableOrderingHeuristics)) {
    const placement = placeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, nextOriginY);
    arranged = placement.arranged;
    nextOriginY = placement.nextOriginY;
  }

  const arrangedByKey = new Map(arranged.map((node) => [`${node.kind}:${node.id}`, node]));
  const merged = request.nodes.map((node) => arrangedByKey.get(`${node.kind}:${node.id}`) ?? { ...node });

  return {
    mode: 'structure',
    canvasLayoutMode: 'structure',
    nodes: request.options?.state?.routingLayoutConfig.features.postLayoutCleanup === false || config.cleanupIntensity === 'none'
      ? merged
      : cleanupArrangedCanvasNodes(merged, request.options, config.cleanupIntensity),
  };
}
