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
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from './config';
import { extractBrowserAutoLayoutGraph } from './graph';
import { placeBrowserAutoLayoutNode } from './placement';

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

function getComponentEdges(component: BrowserAutoLayoutComponent, graph: BrowserAutoLayoutGraph) {
  const componentNodeIds = new Set(component.nodeIds);
  return graph.edges.filter((edge) => componentNodeIds.has(edge.fromEntityId) && componentNodeIds.has(edge.toEntityId));
}

function buildDirectedAdjacency(nodes: BrowserAutoLayoutNode[], edges: BrowserAutoLayoutEdge[]) {
  const outbound = new Map<string, Set<string>>();
  const inbound = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  for (const node of nodes) {
    outbound.set(node.id, new Set());
    inbound.set(node.id, new Set());
    indegree.set(node.id, 0);
  }
  for (const edge of edges) {
    if (!outbound.has(edge.fromEntityId) || !outbound.has(edge.toEntityId)) {
      continue;
    }
    if (!outbound.get(edge.fromEntityId)?.has(edge.toEntityId)) {
      outbound.get(edge.fromEntityId)?.add(edge.toEntityId);
      inbound.get(edge.toEntityId)?.add(edge.fromEntityId);
      indegree.set(edge.toEntityId, (indegree.get(edge.toEntityId) ?? 0) + 1);
    }
  }
  return { outbound, inbound, indegree };
}

function chooseFlowRoots(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const { indegree } = buildDirectedAdjacency(componentNodes, edges);
  const focused = graph.focusedNodeId ? componentNodes.find((node) => node.id === graph.focusedNodeId) : null;
  if (focused) {
    return [focused];
  }

  const selected = graph.selectedNodeIds
    .map((selectedNodeId) => componentNodes.find((node) => node.id === selectedNodeId) ?? null)
    .find((node): node is BrowserAutoLayoutNode => Boolean(node));
  if (selected) {
    return [selected];
  }

  const zeroIndegree = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  if (zeroIndegree.length > 0) {
    return zeroIndegree;
  }

  return [[...componentNodes].sort(compareNodePriority)[0]].filter((node): node is BrowserAutoLayoutNode => Boolean(node));
}

function assignFlowLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
): Map<string, number> {
  const { outbound, inbound, indegree } = buildDirectedAdjacency(componentNodes, edges);
  const roots = chooseFlowRoots(componentNodes, edges, graph);
  const levels = new Map<string, number>();
  const queue: string[] = [];
  const sortedNodeIds = componentNodes.map((node) => node.id).sort(compareIds);

  for (const root of roots) {
    levels.set(root.id, 0);
    queue.push(root.id);
  }

  const fallbackZeroRoots = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  for (const root of fallbackZeroRoots) {
    if (!levels.has(root.id)) {
      levels.set(root.id, 0);
      queue.push(root.id);
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
      const candidate = currentLevel + 1;
      const existing = levels.get(neighborId);
      if (existing === undefined || candidate > existing) {
        levels.set(neighborId, candidate);
        queue.push(neighborId);
      }
    }
  }

  let changed = true;
  let iterations = 0;
  while (changed && iterations < componentNodes.length) {
    changed = false;
    iterations += 1;

    for (const nodeId of sortedNodeIds) {
      const sourceLevel = levels.get(nodeId);
      if (sourceLevel === undefined) {
        continue;
      }
      const neighbors = [...(outbound.get(nodeId) ?? [])].sort(compareIds);
      for (const neighborId of neighbors) {
        const candidate = sourceLevel + 1;
        const existing = levels.get(neighborId);
        if (existing === undefined || candidate > existing) {
          levels.set(neighborId, candidate);
          changed = true;
        }
      }
    }

    for (const nodeId of sortedNodeIds) {
      if (levels.has(nodeId)) {
        continue;
      }
      const inboundLevels = [...(inbound.get(nodeId) ?? [])]
        .map((parentId) => levels.get(parentId))
        .filter((level): level is number => level !== undefined);
      if (inboundLevels.length > 0) {
        levels.set(nodeId, Math.max(...inboundLevels) + 1);
        changed = true;
        continue;
      }
      const outboundLevels = [...(outbound.get(nodeId) ?? [])]
        .map((childId) => levels.get(childId))
        .filter((level): level is number => level !== undefined);
      if (outboundLevels.length > 0) {
        levels.set(nodeId, Math.max(0, Math.min(...outboundLevels) - 1));
        changed = true;
      }
    }
  }

  for (const nodeId of sortedNodeIds) {
    if (!levels.has(nodeId)) {
      levels.set(nodeId, 0);
    }
  }

  const minLevel = Math.min(...[...levels.values()]);
  if (minLevel < 0) {
    for (const [nodeId, level] of [...levels.entries()]) {
      levels.set(nodeId, level - minLevel);
    }
  }

  return levels;
}

function getFlowBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const levels = assignFlowLevels(componentNodes, edges, graph);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const grouped = new Map<number, BrowserAutoLayoutNode[]>();
  for (const node of componentNodes) {
    const level = levels.get(node.id) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), node]);
  }

  const fixedOrder = new Map<string, number>();
  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, nodes]) => {
      const orderedNodes = level === 0
        ? [...nodes].sort((left, right) => compareNodePriority(left, right))
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

function getAnchoredNodes(componentNodes: BrowserAutoLayoutNode[], request: BrowserAutoLayoutRequest) {
  const config = getBrowserAutoLayoutConfig(request);
  return componentNodes
    .filter((node) => isHardAnchorCanvasNode(node, config))
    .sort(compareNodePriority);
}

type AnchorAssignment = {
  anchorId: string;
  distance: number;
};

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

function assignSignedFlowLevelsFromAnchor(
  componentNodes: BrowserAutoLayoutNode[],
  componentEdges: BrowserAutoLayoutEdge[],
  anchorId: string,
) {
  const adjacency = buildDirectedAdjacency(componentNodes, componentEdges);
  const outboundLevels = new Map<string, number>([[anchorId, 0]]);
  const inboundLevels = new Map<string, number>([[anchorId, 0]]);
  const outboundQueue = [anchorId];
  const inboundQueue = [anchorId];

  while (outboundQueue.length > 0) {
    const currentId = outboundQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = outboundLevels.get(currentId) ?? 0;
    for (const neighborId of [...(adjacency.outbound.get(currentId) ?? [])].sort(compareIds)) {
      const candidate = currentLevel + 1;
      const existing = outboundLevels.get(neighborId);
      if (existing === undefined || candidate < existing) {
        outboundLevels.set(neighborId, candidate);
        outboundQueue.push(neighborId);
      }
    }
  }

  while (inboundQueue.length > 0) {
    const currentId = inboundQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = inboundLevels.get(currentId) ?? 0;
    for (const neighborId of [...(adjacency.inbound.get(currentId) ?? [])].sort(compareIds)) {
      const candidate = currentLevel + 1;
      const existing = inboundLevels.get(neighborId);
      if (existing === undefined || candidate < existing) {
        inboundLevels.set(neighborId, candidate);
        inboundQueue.push(neighborId);
      }
    }
  }

  const signedLevels = new Map<string, number>([[anchorId, 0]]);
  for (const node of componentNodes) {
    if (node.id === anchorId) {
      continue;
    }
    const inboundDistance = inboundLevels.get(node.id);
    const outboundDistance = outboundLevels.get(node.id);
    if (inboundDistance !== undefined && outboundDistance !== undefined) {
      signedLevels.set(node.id, outboundDistance <= inboundDistance ? outboundDistance : -inboundDistance);
      continue;
    }
    if (outboundDistance !== undefined) {
      signedLevels.set(node.id, outboundDistance);
      continue;
    }
    if (inboundDistance !== undefined) {
      signedLevels.set(node.id, -inboundDistance);
    }
  }
  return signedLevels;
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
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const config = getBrowserAutoLayoutConfig(request);
  const componentEdges = getComponentEdges(component, graph);
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
  const freeNodes = componentNodes.filter((node) => !node.pinned && !node.manuallyPlaced);

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }
    const assignedNodes = freeNodes
      .filter((node) => assignments.get(node.id)?.anchorId === anchorNode.id)
      .sort(compareNodePriority);

    const assignedNodeIds = new Set([anchorNode.id, ...assignedNodes.map((node) => node.id)]);
    const signedLevels = assignSignedFlowLevelsFromAnchor(
      [anchorNode, ...assignedNodes],
      componentEdges.filter((edge) => assignedNodeIds.has(edge.fromEntityId) && assignedNodeIds.has(edge.toEntityId)),
      anchorNode.id,
    );

    const grouped = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const signedLevel = signedLevels.get(node.id) ?? (assignments.get(node.id)?.distance ?? 1);
      grouped.set(signedLevel, [...(grouped.get(signedLevel) ?? []), node]);
    }

    const signedBands = [...grouped.entries()].sort((left, right) => left[0] - right[0]);
    for (const [signedLevel, bandNodes] of signedBands) {
      const orderedBandNodes = [...bandNodes].sort(compareNodePriority);
      const centeredStartY = anchorCanvasNode.y - Math.max(0, (orderedBandNodes.length - 1) * config.verticalSpacing) / 2;
      for (const [index, layoutNode] of orderedBandNodes.entries()) {
        const original = canvasNodeByKey.get(layoutNode.key);
        if (!original) {
          continue;
        }
        const desired = {
          x: anchorCanvasNode.x + signedLevel * config.horizontalSpacing,
          y: centeredStartY + index * config.verticalSpacing,
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
        y: fallbackOrigin.y + index * config.verticalSpacing,
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
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const config = getBrowserAutoLayoutConfig(request);
  const componentEdges = getComponentEdges(component, graph);
  const componentOrigin = {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };

  let nextArranged = [...arranged];
  const bands = getFlowBands(componentNodes, componentEdges, graph);

  for (const band of bands) {
    const bandHeight = Math.max(0, (band.nodes.length - 1) * config.verticalSpacing);
    const centeredStartY = componentOrigin.y - bandHeight / 2;
    for (const [index, layoutNode] of band.nodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const desired = {
        x: componentOrigin.x + band.level * config.horizontalSpacing,
        y: centeredStartY + index * config.verticalSpacing,
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
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.some((node) => isHardAnchorCanvasNode(node, getBrowserAutoLayoutConfig(request)))) {
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

function orderComponents(graph: BrowserAutoLayoutGraph, nodeById: Map<string, BrowserAutoLayoutNode>) {
  return orderComponentsForLayout(graph, nodeById);
}

export function runBrowserFlowAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const resolvedGraph = graph ?? extractBrowserAutoLayoutGraph(request);
  const nodeById = getNodeById(resolvedGraph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);

  let arranged: BrowserCanvasNode[] = [];
  arranged = placeScopeNodes(request.nodes, arranged, request);

  let nextOriginY = getInitialEntityOrigin(arranged).y;
  for (const component of orderComponents(resolvedGraph, nodeById)) {
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
    mode: 'flow',
    canvasLayoutMode: 'flow',
    nodes: request.options?.state?.routingLayoutConfig.features.postLayoutCleanup === false || config.cleanupIntensity === 'none'
      ? merged
      : cleanupArrangedCanvasNodes(merged, request.options, config.cleanupIntensity),
  };
}
