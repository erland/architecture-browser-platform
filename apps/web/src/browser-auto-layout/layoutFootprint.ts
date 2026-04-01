import { BROWSER_ENTITY_NODE_SIZE } from '../browserCanvasSizing';
import { COLLISION_MARGIN, GRID_Y, roundToGrid } from '../browserCanvasPlacement.policy';
import { getNodeSize } from '../browser-canvas-placement/collision';
import type { BrowserCanvasNode } from '../browserSessionStore.types';
import type { BrowserCanvasPlacementOptions } from '../browser-canvas-placement/types';
import type { BrowserAutoLayoutConfig } from './config';
import type { BrowserAutoLayoutNode } from './types';

function hasWideNodes(nodes: BrowserAutoLayoutNode[]) {
  return nodes.some((node) => node.width > BROWSER_ENTITY_NODE_SIZE.width);
}

function hasTallNodes(nodes: BrowserAutoLayoutNode[]) {
  return nodes.some((node) => node.height > BROWSER_ENTITY_NODE_SIZE.height);
}

function getHorizontalGap(config: BrowserAutoLayoutConfig) {
  return Math.max(COLLISION_MARGIN, config.horizontalSpacing - BROWSER_ENTITY_NODE_SIZE.width);
}

function getVerticalGap(config: BrowserAutoLayoutConfig) {
  return Math.max(COLLISION_MARGIN, config.verticalSpacing - BROWSER_ENTITY_NODE_SIZE.height);
}

export function buildCenteredVerticalTopPositions(
  nodes: BrowserAutoLayoutNode[],
  centerY: number,
  config: BrowserAutoLayoutConfig,
) {
  if (nodes.length === 0) {
    return [] as number[];
  }
  if (!hasTallNodes(nodes)) {
    const startY = centerY - Math.max(0, (nodes.length - 1) * config.verticalSpacing) / 2;
    return nodes.map((_, index) => Math.round(startY + index * config.verticalSpacing));
  }
  const gap = getVerticalGap(config);
  const totalHeight = nodes.reduce((sum, node, index) => sum + node.height + (index > 0 ? gap : 0), 0);
  let cursor = centerY - totalHeight / 2;
  return nodes.map((node) => {
    const top = cursor;
    cursor += node.height + gap;
    return Math.round(top);
  });
}

export function buildCenteredHorizontalLeftPositions(
  nodes: BrowserAutoLayoutNode[],
  centerX: number,
  config: BrowserAutoLayoutConfig,
) {
  if (nodes.length === 0) {
    return [] as number[];
  }
  if (!hasWideNodes(nodes)) {
    const startX = centerX - (BROWSER_ENTITY_NODE_SIZE.width / 2) - Math.max(0, (nodes.length - 1) * config.horizontalSpacing) / 2;
    return nodes.map((_, index) => Math.round(startX + index * config.horizontalSpacing));
  }
  const gap = getHorizontalGap(config);
  const totalWidth = nodes.reduce((sum, node, index) => sum + node.width + (index > 0 ? gap : 0), 0);
  let cursor = centerX - totalWidth / 2;
  return nodes.map((node) => {
    const left = cursor;
    cursor += node.width + gap;
    return Math.round(left);
  });
}

export function buildSequentialBandLeftPositions(
  bands: Array<{ level: number; nodes: BrowserAutoLayoutNode[] }>,
  originX: number,
  config: BrowserAutoLayoutConfig,
) {
  const sortedBands = [...bands].sort((left, right) => left.level - right.level);
  if (!sortedBands.some((band) => hasWideNodes(band.nodes))) {
    return new Map(sortedBands.map((band, index) => [band.level, Math.round(originX + index * config.horizontalSpacing)]));
  }
  const gap = getHorizontalGap(config);
  const leftByLevel = new Map<number, number>();
  let cursor = originX;
  for (const band of sortedBands) {
    leftByLevel.set(band.level, Math.round(cursor));
    const maxWidth = Math.max(BROWSER_ENTITY_NODE_SIZE.width, ...band.nodes.map((node) => node.width));
    cursor += maxWidth + gap;
  }
  return leftByLevel;
}

export function buildSequentialLevelTopPositions(
  levels: Array<{ level: number; nodes: BrowserAutoLayoutNode[] }>,
  originY: number,
  config: BrowserAutoLayoutConfig,
) {
  const sortedLevels = [...levels].sort((left, right) => left.level - right.level);
  if (!sortedLevels.some((entry) => hasTallNodes(entry.nodes))) {
    return new Map(sortedLevels.map((entry, index) => [entry.level, Math.round(originY + index * config.verticalSpacing)]));
  }
  const gap = getVerticalGap(config);
  const topByLevel = new Map<number, number>();
  let cursor = originY;
  for (const entry of sortedLevels) {
    topByLevel.set(entry.level, Math.round(cursor));
    const maxHeight = Math.max(BROWSER_ENTITY_NODE_SIZE.height, ...entry.nodes.map((node) => node.height));
    cursor += maxHeight + gap;
  }
  return topByLevel;
}


type ColumnClearanceNode = Pick<BrowserCanvasNode, 'kind' | 'id' | 'x' | 'y'>;

function overlapsHorizontally(left: ColumnClearanceNode, right: ColumnClearanceNode, options?: BrowserCanvasPlacementOptions) {
  const leftSize = getNodeSize(left, options);
  const rightSize = getNodeSize(right, options);
  return !(
    left.x + leftSize.width + COLLISION_MARGIN <= right.x ||
    right.x + rightSize.width + COLLISION_MARGIN <= left.x
  );
}

export function enforceVerticalColumnClearance(
  fixedNodes: ColumnClearanceNode[],
  placedNodes: BrowserCanvasNode[],
  options?: BrowserCanvasPlacementOptions,
  sideByNodeId?: Map<string, 'above' | 'below' | 'neutral'>,
) {
  if (placedNodes.length <= 1 && fixedNodes.length === 0) {
    return placedNodes.map((node) => ({ ...node }));
  }

  const accepted: ColumnClearanceNode[] = fixedNodes.map((node) => ({ ...node }));
  const adjusted: BrowserCanvasNode[] = [];
  const ordered = [...placedNodes].sort((left, right) => left.x - right.x || left.y - right.y || left.id.localeCompare(right.id));

  for (const node of ordered) {
    let nextY = node.y;
    let changed = true;
    while (changed) {
      changed = false;
      const candidate = { ...node, y: nextY } as ColumnClearanceNode;
      const candidateSide = sideByNodeId?.get(node.id);
      for (const other of accepted) {
        const otherSide = sideByNodeId?.get(other.id);
        if (candidateSide && candidateSide !== 'neutral') {
          if (!otherSide || otherSide !== candidateSide) {
            continue;
          }
        }
        if (!overlapsHorizontally(candidate, other, options)) {
          continue;
        }
        const otherSize = getNodeSize(other, options);
        const minimumY = roundToGrid(other.y + otherSize.height + COLLISION_MARGIN, GRID_Y / 2);
        if (candidate.y < minimumY) {
          nextY = minimumY;
          changed = true;
        }
      }
    }
    const adjustedNode = { ...node, y: nextY };
    adjusted.push(adjustedNode);
    accepted.push({ kind: adjustedNode.kind, id: adjustedNode.id, x: adjustedNode.x, y: adjustedNode.y });
  }

  return adjusted;
}
