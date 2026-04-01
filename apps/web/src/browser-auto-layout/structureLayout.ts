import { cleanupArrangedCanvasNodes } from '../browser-canvas-placement/postLayoutCleanup';
import { avoidBrowserCanvasCollisions, getBrowserCanvasBounds } from '../browser-canvas-placement/collision';
import type { BrowserCanvasNode } from '../browserSessionStore.types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutRequest,
  BrowserAutoLayoutResult,
} from './types';
import { buildUndirectedAdjacency, compareNodePriority, orderComponentsForLayout, sortBandNodesByBarycenter } from './ordering';
import { getBrowserAutoLayoutConfig, getWrappedBandOffset, isHardAnchorCanvasNode } from './config';
import { extractBrowserAutoLayoutGraph } from './graph';
import { placeBrowserAutoLayoutNode } from './placement';
import type { BrowserAutoLayoutPipelineContext, BrowserAutoLayoutStrategy } from './pipeline';

function compareIds(left: string, right: string) {
  return left.localeCompare(right);
}

function getNodeById(graph: BrowserAutoLayoutGraph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

function getCanvasNodeByKey(nodes: BrowserCanvasNode[]) {
  return new Map(nodes.map((node) => [`${node.kind}:${node.id}`, node]));
}

function getEntityComponentNodes(component: BrowserAutoLayoutComponent, nodeById: Map<string, BrowserAutoLayoutNode>) {
  return component.nodeIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is BrowserAutoLayoutNode => Boolean(node && node.kind === 'entity'))
    .sort(compareNodePriority);
}

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
  const levels = new Map<string, number>([[root.id, 0]]);
  const outbound = new Map<string, Set<string>>();
  const inbound = new Map<string, Set<string>>();
  for (const node of componentNodes) {
    outbound.set(node.id, new Set());
    inbound.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (!outbound.has(edge.fromEntityId) || !outbound.has(edge.toEntityId)) {
      continue;
    }
    outbound.get(edge.fromEntityId)?.add(edge.toEntityId);
    inbound.get(edge.toEntityId)?.add(edge.fromEntityId);
  }

  const zeroIndegreeRoots = componentNodes
    .filter((node) => (inbound.get(node.id)?.size ?? 0) === 0)
    .sort(compareNodePriority);
  const queue = [root.id];
  for (const candidate of zeroIndegreeRoots) {
    if (!levels.has(candidate.id)) {
      levels.set(candidate.id, 0);
      queue.push(candidate.id);
    }
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
  const visited = new Set<string>(levels.keys());
  const fallbackQueue = [...levels.keys()];
  while (fallbackQueue.length > 0) {
    const currentId = fallbackQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = levels.get(currentId) ?? 0;
    const neighbors = [...(adjacency.get(currentId) ?? [])].sort(compareIds);
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) {
        continue;
      }
      visited.add(neighborId);
      levels.set(neighborId, currentLevel + 1);
      fallbackQueue.push(neighborId);
    }
  }

  for (const node of componentNodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, Number.MAX_SAFE_INTEGER);
    }
  }

  return levels;
}

function orderLevelNodes(nodes: BrowserAutoLayoutNode[]) {
  return [...nodes].sort(compareNodePriority);
}

function getComponentBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
) {
  const levels = assignLevels(componentNodes, edges, root);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const grouped = new Map<number, BrowserAutoLayoutNode[]>();
  for (const node of componentNodes) {
    const level = levels.get(node.id) ?? 0;
    const key = Number.isFinite(level) ? level : 0;
    grouped.set(key, [...(grouped.get(key) ?? []), node]);
  }

  const fixedOrder = new Map<string, number>([[root.id, 0]]);
  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, nodes]) => {
      const orderedNodes = level === 0
        ? orderLevelNodes(nodes)
        : sortBandNodesByBarycenter(nodes, adjacency, fixedOrder, compareNodePriority);
      orderedNodes.forEach((node, index) => fixedOrder.set(node.id, index));
      return { level, nodes: orderedNodes };
    });
}

function getInitialEntityOrigin(arranged: BrowserCanvasNode[]) {
  const scopeNodes = arranged.filter((node) => node.kind === 'scope');
  const fallbackEntityStartX = scopeNodes.length > 0
    ? Math.max(...scopeNodes.map((node) => node.x + 280)) + 60
    : 96;
  const bounds = getBrowserCanvasBounds(arranged);
  return {
    x: fallbackEntityStartX,
    y: Math.max(96, bounds?.minY ?? 96),
  };
}

function placeScopeNodes(originalNodes: BrowserCanvasNode[], arranged: BrowserCanvasNode[], request: BrowserAutoLayoutRequest) {
  const config = getBrowserAutoLayoutConfig(request);
  const anchoredScopes = originalNodes
.filter((node) => node.kind === 'scope' && isHardAnchorCanvasNode(node, config))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((node) => ({ ...node }));
  let nextArranged = [...arranged, ...anchoredScopes.filter((scope) => !arranged.some((node) => node.kind === 'scope' && node.id === scope.id))];

  const movableScopes = originalNodes
.filter((node) => node.kind === 'scope' && !isHardAnchorCanvasNode(node, config))
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const [index, scopeNode] of movableScopes.entries()) {
    const placement = avoidBrowserCanvasCollisions(nextArranged, 'scope', {
      x: 56,
      y: 64 + index * Math.max(96, Math.round(config.verticalSpacing * 1.15)),
    }, request.options);
    nextArranged = [...nextArranged, {
      ...scopeNode,
      ...placement,
      manuallyPlaced: false,
    }];
  }

  return nextArranged;
}

type AnchorAssignment = {
  anchorId: string;
  distance: number;
};

function getAnchoredNodes(componentNodes: BrowserAutoLayoutNode[], request: BrowserAutoLayoutRequest) {
  const config = getBrowserAutoLayoutConfig(request);
  return componentNodes
    .filter((node) => isHardAnchorCanvasNode(node, config))
    .sort(compareNodePriority);
}

function assignNodesToAnchors(
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

function placeAnchoredComponentNodes(
  component: BrowserAutoLayoutComponent,
  request: BrowserAutoLayoutRequest,
  graph: BrowserAutoLayoutGraph,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const config = getBrowserAutoLayoutConfig(request);
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentEdges = graph.edges.filter((edge) => component.nodeIds.includes(edge.fromEntityId) && component.nodeIds.includes(edge.toEntityId));
  const anchorNodes = getAnchoredNodes(componentNodes, request);
  if (anchorNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  let nextArranged = [...arranged];
  for (const anchorNode of anchorNodes) {
    const original = canvasNodeByKey.get(anchorNode.key);
    if (!original) {
      continue;
    }
    if (!nextArranged.some((node) => node.kind === original.kind && node.id === original.id)) {
      nextArranged = [...nextArranged, { ...original }];
    }
  }

  const assignments = assignNodesToAnchors(componentNodes, componentEdges, anchorNodes);
  const freeNodes = componentNodes.filter((node) => !isHardAnchorCanvasNode(node, config));
  const anchorOrder = anchorNodes.map((node) => node.id);

  for (const anchorId of anchorOrder) {
    const anchorNode = nodeById.get(anchorId);
    const anchorCanvasNode = anchorNode ? canvasNodeByKey.get(anchorNode.key) : null;
    if (!anchorNode || !anchorCanvasNode) {
      continue;
    }

    const assignedNodes = freeNodes
      .filter((node) => assignments.get(node.id)?.anchorId === anchorId)
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

    const distanceBands = [...groupedByDistance.entries()].sort((left, right) => left[0] - right[0]);
    for (const [distance, bandNodes] of distanceBands) {
      const orderedBandNodes = orderLevelNodes(bandNodes);
      const centeredStartY = anchorCanvasNode.y - Math.max(0, (Math.min(orderedBandNodes.length, config.maxBreadth) - 1) * config.verticalSpacing) / 2;
      for (const [index, layoutNode] of orderedBandNodes.entries()) {
        const wrapped = getWrappedBandOffset(index, config);
        const original = canvasNodeByKey.get(layoutNode.key);
        if (!original) {
          continue;
        }
        const desired = {
          x: anchorCanvasNode.x + (distance + wrapped.wrapGroup) * config.horizontalSpacing,
          y: centeredStartY + wrapped.indexInGroup * config.verticalSpacing,
        };
        const placement = placeBrowserAutoLayoutNode(nextArranged, original, desired, request.options);
        nextArranged = [...nextArranged, {
          ...original,
          ...placement,
          manuallyPlaced: false,
        }];
      }
    }
  }

  const unassignedNodes = freeNodes
    .filter((node) => !assignments.has(node.id))
    .sort(compareNodePriority);
  if (unassignedNodes.length > 0) {
    const fallbackOrigin = {
      ...getInitialEntityOrigin(nextArranged),
      y: fallbackOriginY,
    };
    for (const [index, layoutNode] of unassignedNodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const desired = {
        x: fallbackOrigin.x,
        y: fallbackOrigin.y + getWrappedBandOffset(index, config).indexInGroup * config.verticalSpacing + getWrappedBandOffset(index, config).wrapGroup * (config.maxBreadth * config.verticalSpacing + Math.round(config.componentSpacing / 2)),
      };
      const placement = placeBrowserAutoLayoutNode(nextArranged, original, desired, request.options);
      nextArranged = [...nextArranged, {
        ...original,
        ...placement,
        manuallyPlaced: false,
      }];
    }
  }

  const componentPlaced = nextArranged.filter((node) => node.kind === 'entity' && component.nodeIds.includes(node.id));
  const bounds = getBrowserCanvasBounds(componentPlaced, request.options);
  return {
    arranged: nextArranged,
    nextOriginY: Math.max(fallbackOriginY, (bounds?.maxY ?? fallbackOriginY) + config.componentSpacing),
  };
}

function placeFreeComponentNodes(
  component: BrowserAutoLayoutComponent,
  request: BrowserAutoLayoutRequest,
  graph: BrowserAutoLayoutGraph,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const config = getBrowserAutoLayoutConfig(request);
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentEdges = graph.edges.filter((edge) => component.nodeIds.includes(edge.fromEntityId) && component.nodeIds.includes(edge.toEntityId));
  const root = chooseComponentRoot(componentNodes, componentEdges, graph);
  if (!root) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };

  let nextArranged = [...arranged];
  const bands = getComponentBands(componentNodes, componentEdges, root);
  const maxBandSize = Math.max(1, ...bands.map((band) => Math.min(band.nodes.length, config.maxBreadth)));
  const baseCenterY = componentOrigin.y + Math.max(0, (maxBandSize - 1) * config.verticalSpacing) / 2;

  for (const band of bands) {
    const visibleBandSize = Math.max(1, Math.min(band.nodes.length, config.maxBreadth));
    const centeredStartY = baseCenterY - Math.max(0, (visibleBandSize - 1) * config.verticalSpacing) / 2;
    for (const [index, layoutNode] of band.nodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const wrapped = getWrappedBandOffset(index, config);
      const desired = {
        x: componentOrigin.x + (band.level + wrapped.wrapGroup) * config.horizontalSpacing,
        y: centeredStartY + wrapped.indexInGroup * config.verticalSpacing + wrapped.wrapGroup * Math.round(config.componentSpacing / 2),
      };
      const placement = placeBrowserAutoLayoutNode(nextArranged, original, desired, request.options);
      nextArranged = [...nextArranged, {
        ...original,
        ...placement,
        manuallyPlaced: false,
      }];
    }
  }

  const componentPlaced = nextArranged.filter((node) => node.kind === 'entity' && component.nodeIds.includes(node.id));
  const bounds = getBrowserCanvasBounds(componentPlaced, request.options);
  return {
    arranged: nextArranged,
    nextOriginY: Math.max(fallbackOriginY, (bounds?.maxY ?? componentOrigin.y) + config.componentSpacing),
  };
}

function placeComponentNodes(
  component: BrowserAutoLayoutComponent,
  request: BrowserAutoLayoutRequest,
  graph: BrowserAutoLayoutGraph,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const config = getBrowserAutoLayoutConfig(request);
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.some((node) => isHardAnchorCanvasNode(node, config))) {
    return placeAnchoredComponentNodes(
      component,
      request,
      graph,
      nodeById,
      canvasNodeByKey,
      arranged,
      fallbackOriginY,
    );
  }

  return placeFreeComponentNodes(
    component,
    request,
    graph,
    nodeById,
    canvasNodeByKey,
    arranged,
    fallbackOriginY,
  );
}

function orderComponents(graph: BrowserAutoLayoutGraph, nodeById: Map<string, BrowserAutoLayoutNode>, request: BrowserAutoLayoutRequest) {
  const config = getBrowserAutoLayoutConfig(request);
  return config.enableOrderingHeuristics
    ? orderComponentsForLayout(graph, nodeById)
    : [...graph.components].sort((left, right) => left.id.localeCompare(right.id));
}

export function runBrowserStructureAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const { request, config, graph: resolvedGraph } = context;
  const nodeById = getNodeById(resolvedGraph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);

  let arranged: BrowserCanvasNode[] = [];
  arranged = placeScopeNodes(request.nodes, arranged, request);

  let nextOriginY = getInitialEntityOrigin(arranged).y;

  for (const component of orderComponents(resolvedGraph, nodeById, request)) {
    const { arranged: nextArranged, nextOriginY: updatedOriginY } = placeComponentNodes(
      component,
      request,
      resolvedGraph,
      nodeById,
      canvasNodeByKey,
      arranged,
      nextOriginY,
    );
    arranged = nextArranged;
    nextOriginY = updatedOriginY;
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


export const runBrowserStructureAutoLayoutStrategy: BrowserAutoLayoutStrategy = {
  mode: 'structure',
  run: runBrowserStructureAutoLayoutWithContext,
};

export function runBrowserStructureAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const resolvedGraph = graph ?? extractBrowserAutoLayoutGraph(request);
  return runBrowserStructureAutoLayoutWithContext({
    request,
    config,
    graph: resolvedGraph,
    mode: 'structure',
  });
}
