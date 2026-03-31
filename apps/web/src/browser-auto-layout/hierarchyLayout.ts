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
import { compareNodePriority, compareRootPriority, orderComponentsForLayout } from './ordering';
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

function chooseHierarchyRoots(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
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

  const config = getBrowserAutoLayoutConfig(request);
  const anchored = componentNodes.filter((node) => isHardAnchorCanvasNode(node, config)).sort(compareNodePriority);
  if (anchored.length > 0) {
    return anchored;
  }

  const zeroIndegree = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  if (zeroIndegree.length > 0) {
    return zeroIndegree;
  }

  return [[...componentNodes].sort(compareNodePriority)[0]].filter((node): node is BrowserAutoLayoutNode => Boolean(node));
}

function assignHierarchyLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
): Map<string, number> {
  const { outbound, indegree } = buildDirectedAdjacency(componentNodes, edges);
  const roots = chooseHierarchyRoots(componentNodes, edges, graph, request);
  const levels = new Map<string, number>();
  const queue: string[] = [];

  for (const root of roots) {
    if (!levels.has(root.id)) {
      levels.set(root.id, 0);
      queue.push(root.id);
    }
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

  for (const node of [...componentNodes].sort(compareNodePriority)) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  return levels;
}

function buildHierarchyForest(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
) {
  const { outbound, inbound } = buildDirectedAdjacency(componentNodes, edges);
  const levels = assignHierarchyLevels(componentNodes, edges, graph, request);
  const nodesByLevel = [...componentNodes].sort((left, right) => {
    const leftLevel = levels.get(left.id) ?? 0;
    const rightLevel = levels.get(right.id) ?? 0;
    if (leftLevel !== rightLevel) {
      return leftLevel - rightLevel;
    }
    return compareNodePriority(left, right);
  });

  const childrenByNode = new Map<string, string[]>();
  const rootIds = new Set<string>();
  for (const node of componentNodes) {
    childrenByNode.set(node.id, []);
    rootIds.add(node.id);
  }

  for (const node of nodesByLevel) {
    const nodeLevel = levels.get(node.id) ?? 0;
    const candidateParents = [...(inbound.get(node.id) ?? [])]
      .filter((parentId) => (levels.get(parentId) ?? 0) < nodeLevel)
      .map((parentId) => componentNodes.find((candidate) => candidate.id === parentId) ?? null)
      .filter((candidate): candidate is BrowserAutoLayoutNode => Boolean(candidate))
      .sort(compareNodePriority);

    const parent = candidateParents[0];
    if (!parent) {
      continue;
    }
    childrenByNode.set(parent.id, [...(childrenByNode.get(parent.id) ?? []), node.id]);
    rootIds.delete(node.id);
  }

  const orderedRootIds = [...rootIds].sort((left, right) => compareRootPriority(left, right, childrenByNode, new Map(componentNodes.map((node) => [node.id, node]))));

  for (const [parentId, childIds] of [...childrenByNode.entries()]) {
    childrenByNode.set(parentId, [...childIds].sort((left, right) => {
      const leftNode = componentNodes.find((node) => node.id === left);
      const rightNode = componentNodes.find((node) => node.id === right);
      if (!leftNode || !rightNode) {
        return left.localeCompare(right);
      }
      const leftLevel = levels.get(left) ?? 0;
      const rightLevel = levels.get(right) ?? 0;
      if (leftLevel !== rightLevel) {
        return leftLevel - rightLevel;
      }
      return compareNodePriority(leftNode, rightNode);
    }));
  }

  return {
    levels,
    outbound,
    inbound,
    rootIds: orderedRootIds,
    childrenByNode,
  };
}

function computeSubtreeColumns(
  rootId: string,
  childrenByNode: Map<string, string[]>,
  memo = new Map<string, number>(),
): number {
  const existing = memo.get(rootId);
  if (existing !== undefined) {
    return existing;
  }
  const children = childrenByNode.get(rootId) ?? [];
  if (children.length === 0) {
    memo.set(rootId, 1);
    return 1;
  }
  const width = Math.max(1, children.reduce((sum, childId) => sum + computeSubtreeColumns(childId, childrenByNode, memo), 0));
  memo.set(rootId, width);
  return width;
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

function placeHierarchyTree(
  rootId: string,
  originX: number,
  originY: number,
  forest: ReturnType<typeof buildHierarchyForest>,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  request: BrowserAutoLayoutRequest,
  subtreeMemo: Map<string, number>,
  config = getBrowserAutoLayoutConfig(request),
) {
  const nextArranged: BrowserCanvasNode[] = [...arranged];
  const placements = new Map<string, { x: number; y: number }>();

  const placeNodeRecursive = (nodeId: string, baseX: number, depth: number) => {
    const node = nodeById.get(nodeId);
    if (!node) {
      return;
    }
    const subtreeColumns = computeSubtreeColumns(nodeId, forest.childrenByNode, subtreeMemo);
    const centerX = baseX + ((subtreeColumns - 1) * config.horizontalSpacing) / 2;
    placements.set(nodeId, {
      x: centerX,
      y: originY + depth * config.verticalSpacing,
    });

    let childColumnX = baseX;
    for (const childId of forest.childrenByNode.get(nodeId) ?? []) {
      const childColumns = computeSubtreeColumns(childId, forest.childrenByNode, subtreeMemo);
      placeNodeRecursive(childId, childColumnX, depth + 1);
      childColumnX += childColumns * config.horizontalSpacing;
    }
  };

  placeNodeRecursive(rootId, originX, 0);

  for (const [nodeId, placement] of [...placements.entries()].sort((left, right) => {
    const leftNode = nodeById.get(left[0]);
    const rightNode = nodeById.get(right[0]);
    if (!leftNode || !rightNode) {
      return left[0].localeCompare(right[0]);
    }
    const leftLevel = forest.levels.get(left[0]) ?? 0;
    const rightLevel = forest.levels.get(right[0]) ?? 0;
    if (leftLevel !== rightLevel) {
      return leftLevel - rightLevel;
    }
    return compareNodePriority(leftNode, rightNode);
  })) {
    const layoutNode = nodeById.get(nodeId);
    const original = layoutNode ? canvasNodeByKey.get(layoutNode.key) : null;
    if (!layoutNode || !original) {
      continue;
    }
    const desired = layoutNode.pinned || layoutNode.manuallyPlaced
      ? { x: original.x, y: original.y }
      : placement;
    const finalPlacement = layoutNode.pinned || layoutNode.manuallyPlaced
      ? desired
      : placeBrowserAutoLayoutNode(nextArranged, original, desired, request.options);
    nextArranged.push({
      ...original,
      ...finalPlacement,
      manuallyPlaced: layoutNode.pinned || layoutNode.manuallyPlaced ? original.manuallyPlaced : false,
    });
  }

  const treeColumns = computeSubtreeColumns(rootId, forest.childrenByNode, subtreeMemo);
  const treeNodeIds = new Set<string>();
  const collect = (nodeId: string) => {
    treeNodeIds.add(nodeId);
    for (const childId of forest.childrenByNode.get(nodeId) ?? []) {
      collect(childId);
    }
  };
  collect(rootId);
  const maxDepth = Math.max(...[...treeNodeIds].map((nodeId) => forest.levels.get(nodeId) ?? 0));

  return {
    arranged: nextArranged,
    nextOriginX: originX + Math.max(1, treeColumns) * config.horizontalSpacing + config.componentSpacing,
    nextOriginY: originY + Math.max(1, maxDepth + 1) * config.verticalSpacing + config.componentSpacing,
  };
}

function getAnchoredNodes(componentNodes: BrowserAutoLayoutNode[], request: BrowserAutoLayoutRequest) {
  const config = getBrowserAutoLayoutConfig(request);
  return componentNodes
    .filter((node) => isHardAnchorCanvasNode(node, config))
    .sort(compareNodePriority);
}

function assignSignedHierarchyLevelsFromAnchor(
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

  const freeNodes = componentNodes.filter((node) => !node.pinned && !node.manuallyPlaced);
  const bounds = getBrowserCanvasBounds(nextArranged);
  let componentBottom = Math.max(fallbackOriginY, bounds?.maxY ?? fallbackOriginY);

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }

    const signedLevels = assignSignedHierarchyLevelsFromAnchor(componentNodes, componentEdges, anchorNode.id);
    const assignedNodes = freeNodes
      .filter((node) => signedLevels.has(node.id))
      .sort(compareNodePriority);
    const grouped = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const signedLevel = signedLevels.get(node.id);
      if (signedLevel === undefined || signedLevel === 0) {
        continue;
      }
      grouped.set(signedLevel, [...(grouped.get(signedLevel) ?? []), node]);
    }

    for (const [signedLevel, bandNodes] of [...grouped.entries()].sort((left, right) => left[0] - right[0])) {
      const orderedBandNodes = [...bandNodes].sort(compareNodePriority);
      const centeredStartX = anchorCanvasNode.x - Math.max(0, (orderedBandNodes.length - 1) * config.horizontalSpacing) / 2;
      for (const [index, layoutNode] of orderedBandNodes.entries()) {
        const original = canvasNodeByKey.get(layoutNode.key);
        if (!original) {
          continue;
        }
        const desired = {
          x: centeredStartX + index * config.horizontalSpacing,
          y: anchorCanvasNode.y + signedLevel * config.verticalSpacing,
        };
        const placement = placeBrowserAutoLayoutNode(nextArranged, original, desired, request.options);
        nextArranged = [...nextArranged, {
          ...original,
          ...placement,
          manuallyPlaced: false,
        }];
        componentBottom = Math.max(componentBottom, placement.y);
      }
    }
  }

  const unassignedNodes = freeNodes
    .filter((node) => (nextArranged.findIndex((arrangedNode) => arrangedNode.kind === 'entity' && arrangedNode.id === node.id) < 0))
    .sort(compareNodePriority);
  if (unassignedNodes.length > 0) {
    const fallbackOrigin = {
      ...getInitialEntityOrigin(nextArranged),
      y: Math.max(fallbackOriginY, componentBottom + config.componentSpacing),
    };
    for (const [index, layoutNode] of unassignedNodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const placement = placeBrowserAutoLayoutNode(nextArranged, original, {
        x: fallbackOrigin.x + index * config.horizontalSpacing,
        y: fallbackOrigin.y,
      }, request.options);
      nextArranged = [...nextArranged, {
        ...original,
        ...placement,
        manuallyPlaced: false,
      }];
      componentBottom = Math.max(componentBottom, placement.y);
    }
  }

  return {
    arranged: nextArranged,
    nextOriginY: componentBottom + config.verticalSpacing + config.componentSpacing,
  };
}

export function runBrowserHierarchyAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const effectiveGraph = graph ?? extractBrowserAutoLayoutGraph(request);
  const nodeById = getNodeById(effectiveGraph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);

  let arranged = placeScopeNodes(request.nodes, [], request);
  const initialOrigin = getInitialEntityOrigin(arranged);
  let nextOriginX = initialOrigin.x;
  let nextOriginY = initialOrigin.y;

  for (const component of orderComponentsForLayout(effectiveGraph, nodeById).filter((candidate) => candidate.nodeIds.some((nodeId) => nodeById.get(nodeId)?.kind === 'entity'))) {
    const componentNodes = getEntityComponentNodes(component, nodeById);
    if (componentNodes.length === 0) {
      continue;
    }

    if (componentNodes.some((node) => isHardAnchorCanvasNode(node, getBrowserAutoLayoutConfig(request)))) {
      const anchoredPlacement = placeAnchoredComponentNodes(
        component,
        request,
        effectiveGraph,
        nodeById,
        canvasNodeByKey,
        arranged,
        nextOriginY,
      );
      arranged = anchoredPlacement.arranged;
      nextOriginX = getInitialEntityOrigin(arranged).x;
      nextOriginY = anchoredPlacement.nextOriginY;
      continue;
    }

    const forest = buildHierarchyForest(componentNodes, getComponentEdges(component, effectiveGraph), effectiveGraph, request);
    const subtreeMemo = new Map<string, number>();
    let componentArranged = [...arranged];
    let componentOriginX = nextOriginX;
    let componentBottomY = nextOriginY;

    for (const rootId of forest.rootIds) {
      const placement = placeHierarchyTree(
        rootId,
        componentOriginX,
        nextOriginY,
        forest,
        nodeById,
        canvasNodeByKey,
        componentArranged,
        request,
        subtreeMemo,
      );
      componentArranged = placement.arranged;
      componentOriginX = placement.nextOriginX;
      componentBottomY = Math.max(componentBottomY, placement.nextOriginY);
    }

    arranged = componentArranged;
    nextOriginX = getInitialEntityOrigin(arranged).x;
    nextOriginY = componentBottomY;
  }

  return {
    mode: 'hierarchy',
    canvasLayoutMode: 'hierarchy',
    nodes: config.cleanupIntensity === 'compact'
      ? cleanupArrangedCanvasNodes(arranged, request.options, config.cleanupIntensity)
      : arranged.map((node) => ({ ...node })),
  };
}
