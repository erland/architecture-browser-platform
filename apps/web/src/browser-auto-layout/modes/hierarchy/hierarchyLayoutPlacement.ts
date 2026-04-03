import { getBrowserCanvasBounds } from '../../../browser-canvas-placement/collision';
import type { BrowserCanvasNode } from '../../../browser-session';
import type {
  BrowserAutoLayoutNode,
  BrowserAutoLayoutRequest,
} from '../../core/types';
import { compareNodePriority } from '../../shared/ordering';
import { getBrowserAutoLayoutConfig } from '../../core/config';
import { buildSequentialLevelTopPositions } from '../../shared/layoutFootprint';
import { placeBrowserAutoLayoutNode } from '../../shared/placement';
import { buildHierarchyForest, computeSubtreeColumns } from './hierarchyLayoutModel';

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
