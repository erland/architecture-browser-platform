import type { BrowserCanvasNode } from '../../../browser-session';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildUndirectedAdjacency, compareNodePriority, sortBandNodesByBarycenter } from '../../shared/ordering';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from '../../core/config';
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
import { assignSignedLevelsFromAnchor } from '../../shared/layoutSignedLevels';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';

export function chooseFlowRoots(
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

export function assignFlowLevels(
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

export function buildFlowBands(
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

export function placeFlowAnchoredComponentNodes(
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

  const { componentNodes, componentEdges, anchorNodes } = prepared;
  let nextArranged = prepared.arrangedWithAnchors;
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
    const signedLevels = assignSignedLevelsFromAnchor(
      [anchorNode, ...assignedNodes],
      componentEdges.filter((edge) => assignedNodeIds.has(edge.fromEntityId) && assignedNodeIds.has(edge.toEntityId)),
      anchorNode.id,
    );

    const grouped = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const signedLevel = signedLevels.get(node.id) ?? (assignments.get(node.id)?.distance ?? 1);
      grouped.set(signedLevel, [...(grouped.get(signedLevel) ?? []), node]);
    }

    const bands = [...grouped.entries()].sort((left, right) => left[0] - right[0]).map(([level, nodes]) => ({
      level,
      nodes: [...nodes].sort(compareNodePriority),
    }));
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      bands,
      ({ band, index, config }) => {
        const topPositions = buildCenteredVerticalTopPositions(
          band.nodes,
          anchorCanvasNode.y + anchorNode.height / 2,
          config,
        );
        return {
          x: anchorCanvasNode.x + band.level * config.horizontalSpacing,
          y: topPositions[index] ?? anchorCanvasNode.y,
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
      ({ band, index, config }) => {
        const topPositions = buildCenteredVerticalTopPositions(band.nodes, fallbackOrigin.y, config);
        return {
          x: fallbackOrigin.x,
          y: topPositions[index] ?? fallbackOrigin.y,
        };
      },
    );
  }

  nextArranged = enforceAnchoredPlacementClearance(nextArranged, freeNodes.map((node) => node.id), request);

  return finalizeComponentPlacement(component, request, nextArranged, fallbackOriginY);
}

export function placeFlowFreeComponentNodes(
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
  const componentOrigin = {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };

  const bands = buildFlowBands(componentNodes, componentEdges, graph);
  const bandLeftByLevel = buildSequentialBandLeftPositions(bands, componentOrigin.x, config);
  const nextArranged = placeBandBasedFreeComponentNodes(
    arranged,
    request,
    canvasNodeByKey,
    bands,
    ({ band, index, config }) => {
      const topPositions = buildCenteredVerticalTopPositions(band.nodes, componentOrigin.y, config);
      return {
        x: bandLeftByLevel.get(band.level) ?? componentOrigin.x,
        y: topPositions[index] ?? componentOrigin.y,
      };
    },
  );

  return finalizeComponentPlacement(component, request, nextArranged, fallbackOriginY);
}

export function hasFlowHardAnchors(
  component: BrowserAutoLayoutComponent,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  request: BrowserAutoLayoutPipelineContext['request'],
) {
  return getEntityComponentNodes(component, nodeById)
    .some((node) => isHardAnchorCanvasNode(node, getBrowserAutoLayoutConfig(request)));
}
