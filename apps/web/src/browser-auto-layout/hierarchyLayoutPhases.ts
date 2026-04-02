import { getBrowserCanvasBounds } from '../browser-canvas-placement/collision';
import type { BrowserCanvasNode } from '../browserSessionStore.types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutRequest,
} from './types';
import { compareNodePriority, compareRootPriority } from './ordering';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from './config';
import { buildFallbackFreeNodeOrigin, enforceAnchoredPlacementClearance, prepareAnchoredComponentPlacement } from './layoutAnchoredPlacement';
import { buildDirectedAdjacency, compareIds } from './layoutShared';
import { assignSignedLevelsFromAnchor } from './layoutSignedLevels';
import { buildCenteredHorizontalLeftPositions, buildSequentialLevelTopPositions } from './layoutFootprint';
import { placeBrowserAutoLayoutNode } from './placement';
import type { BrowserAutoLayoutPipelineContext } from './pipeline';

export function chooseHierarchyRoots(
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

export function assignHierarchyLevels(
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

export function buildHierarchyForest(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
) {
  const { outbound, inbound } = buildDirectedAdjacency(componentNodes, edges);
  const levels = assignHierarchyLevels(componentNodes, edges, graph, request);
  const nodeById = new Map(componentNodes.map((node) => [node.id, node]));
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
      .map((parentId) => nodeById.get(parentId) ?? null)
      .filter((candidate): candidate is BrowserAutoLayoutNode => Boolean(candidate))
      .sort(compareNodePriority);

    const parent = candidateParents[0];
    if (!parent) {
      continue;
    }
    childrenByNode.set(parent.id, [...(childrenByNode.get(parent.id) ?? []), node.id]);
    rootIds.delete(node.id);
  }

  const orderedRootIds = [...rootIds].sort((left, right) => compareRootPriority(left, right, childrenByNode, nodeById));

  for (const [parentId, childIds] of [...childrenByNode.entries()]) {
    childrenByNode.set(parentId, [...childIds].sort((left, right) => {
      const leftNode = nodeById.get(left);
      const rightNode = nodeById.get(right);
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

export function computeSubtreeColumns(
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

export function placeHierarchyTree(
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
  const placements = new Map<string, { x: number; y: number; depth: number }>();
  const levelNodes = new Map<number, BrowserAutoLayoutNode[]>();

  const placeNodeRecursive = (nodeId: string, baseX: number, depth: number) => {
    const node = nodeById.get(nodeId);
    if (!node) {
      return;
    }
    const subtreeColumns = computeSubtreeColumns(nodeId, forest.childrenByNode, subtreeMemo);
    const centerX = baseX + ((subtreeColumns - 1) * config.horizontalSpacing) / 2;
    levelNodes.set(depth, [...(levelNodes.get(depth) ?? []), node]);
    placements.set(nodeId, {
      x: centerX,
      y: originY,
      depth,
    });

    let childColumnX = baseX;
    for (const childId of forest.childrenByNode.get(nodeId) ?? []) {
      const childColumns = computeSubtreeColumns(childId, forest.childrenByNode, subtreeMemo);
      placeNodeRecursive(childId, childColumnX, depth + 1);
      childColumnX += childColumns * config.horizontalSpacing;
    }
  };

  placeNodeRecursive(rootId, originX, 0);
  const levelTopByDepth = buildSequentialLevelTopPositions(
    [...levelNodes.entries()].map(([level, nodes]) => ({ level, nodes })),
    originY,
    config,
  );

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
    const desiredPlacement = {
      x: placement.x,
      y: levelTopByDepth.get(placement.depth) ?? placement.y,
    };
    const desired = layoutNode.pinned || layoutNode.manuallyPlaced
      ? { x: original.x, y: original.y }
      : desiredPlacement;
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
    nextOriginY: Math.max(
      originY + Math.max(1, maxDepth + 1) * config.verticalSpacing + config.componentSpacing,
      (getBrowserCanvasBounds(nextArranged, request.options)?.maxY ?? originY) + config.componentSpacing,
    ),
  };
}

export function placeAnchoredHierarchyComponentNodes(
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
  const freeNodes = componentNodes.filter((node) => !node.pinned && !node.manuallyPlaced);
  const bounds = getBrowserCanvasBounds(nextArranged);
  let componentBottom = Math.max(fallbackOriginY, bounds?.maxY ?? fallbackOriginY);

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }

    const signedLevels = assignSignedLevelsFromAnchor(componentNodes, componentEdges, anchorNode.id);
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

    const orderedGroups = [...grouped.entries()].sort((left, right) => left[0] - right[0]);
    const levelTopBySignedLevel = new Map<number, number>();
    const negativeGroups = orderedGroups
      .filter(([level]) => level < 0)
      .sort((left, right) => right[0] - left[0]);
    const positiveGroups = orderedGroups
      .filter(([level]) => level > 0)
      .sort((left, right) => left[0] - right[0]);
    const gapY = Math.max(24, config.verticalSpacing - 84);
    let upwardCursor = anchorCanvasNode.y - Math.max(24, Math.round(config.componentSpacing / 3));
    for (const [level, nodes] of negativeGroups) {
      const maxHeight = Math.max(84, ...nodes.map((node) => node.height));
      const top = nodes.some((node) => node.height > 84)
        ? upwardCursor - maxHeight
        : anchorCanvasNode.y + level * config.verticalSpacing;
      levelTopBySignedLevel.set(level, Math.round(top));
      upwardCursor = Math.min(upwardCursor, top) - gapY;
    }
    let downwardCursor = anchorCanvasNode.y + anchorNode.height + Math.max(24, Math.round(config.componentSpacing / 3));
    for (const [level, nodes] of positiveGroups) {
      const maxHeight = Math.max(84, ...nodes.map((node) => node.height));
      const top = nodes.some((node) => node.height > 84)
        ? downwardCursor
        : anchorCanvasNode.y + level * config.verticalSpacing;
      levelTopBySignedLevel.set(level, Math.round(top));
      downwardCursor = Math.max(downwardCursor, top + maxHeight + gapY);
    }

    for (const [signedLevel, bandNodes] of orderedGroups) {
      const orderedBandNodes = [...bandNodes].sort(compareNodePriority);
      const xPositions = buildCenteredHorizontalLeftPositions(
        orderedBandNodes,
        anchorCanvasNode.x + anchorNode.width / 2,
        config,
      );
      for (const [index, layoutNode] of orderedBandNodes.entries()) {
        const original = canvasNodeByKey.get(layoutNode.key);
        if (!original) {
          continue;
        }
        const desired = {
          x: xPositions[index] ?? anchorCanvasNode.x,
          y: levelTopBySignedLevel.get(signedLevel) ?? (anchorCanvasNode.y + signedLevel * config.verticalSpacing),
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
    const fallbackOrigin = buildFallbackFreeNodeOrigin(nextArranged, Math.max(fallbackOriginY, componentBottom + config.componentSpacing));
    const fallbackXPositions = buildCenteredHorizontalLeftPositions(
      unassignedNodes,
      fallbackOrigin.x + (unassignedNodes.length * config.horizontalSpacing) / 2,
      config,
    );
    for (const [index, layoutNode] of unassignedNodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const placement = placeBrowserAutoLayoutNode(nextArranged, original, {
        x: fallbackXPositions[index] ?? fallbackOrigin.x,
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

  const anchoredSideByNodeId = new Map<string, 'above' | 'below' | 'neutral'>(anchorNodes.map((node) => [node.id, 'neutral']));
  for (const anchorNode of anchorNodes) {
    const signedLevels = assignSignedLevelsFromAnchor(componentNodes, componentEdges, anchorNode.id);
    for (const node of freeNodes) {
      const signedLevel = signedLevels.get(node.id);
      if (signedLevel === undefined) {
        continue;
      }
      anchoredSideByNodeId.set(node.id, signedLevel < 0 ? 'above' : signedLevel > 0 ? 'below' : 'neutral');
    }
  }
  nextArranged = enforceAnchoredPlacementClearance(nextArranged, freeNodes.map((node) => node.id), request, anchoredSideByNodeId);

  return {
    arranged: nextArranged,
    nextOriginY: componentBottom + config.verticalSpacing + config.componentSpacing,
  };
}
