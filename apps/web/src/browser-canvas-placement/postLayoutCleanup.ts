import { COLLISION_MARGIN, GRID_X, GRID_Y, roundToGrid } from '../browserCanvasPlacement.policy';
import type { BrowserAutoLayoutCleanupIntensity } from '../browser-auto-layout';
import type { BrowserCanvasNode } from '../browserSessionStore';
import type { BrowserCanvasPlacementOptions } from './types';
import { avoidBrowserCanvasCollisions, getNodeSize, isAnchoredCanvasNode } from './collision';

type MutableNode = BrowserCanvasNode & { x: number; y: number };

function stableNodeSort(left: BrowserCanvasNode, right: BrowserCanvasNode) {
  return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
}

function rowTolerance(node: BrowserCanvasNode, options?: BrowserCanvasPlacementOptions) {
  const size = getNodeSize(node, options);
  return Math.max(GRID_Y / 2, Math.round(size.height / 2));
}

function columnTolerance(node: BrowserCanvasNode, options?: BrowserCanvasPlacementOptions) {
  const size = getNodeSize(node, options);
  return Math.max(GRID_X / 2, Math.round(size.width / 2));
}

function normalizeRowSpacing(nodes: MutableNode[], options?: BrowserCanvasPlacementOptions) {
  const minGapX = Math.max(COLLISION_MARGIN, Math.round(GRID_X / 4));
  const sorted = [...nodes].sort((left, right) => left.y - right.y || left.x - right.x || stableNodeSort(left, right));
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    const currentSize = getNodeSize(current, options);
    for (let j = i + 1; j < sorted.length; j += 1) {
      const candidate = sorted[j];
      if (Math.abs(candidate.y - current.y) > Math.min(rowTolerance(current, options), rowTolerance(candidate, options))) {
        continue;
      }
      const candidateSize = getNodeSize(candidate, options);
      const desiredX = roundToGrid(current.x + currentSize.width + minGapX, GRID_X / 2);
      if (candidate.x < desiredX && candidate.x + candidateSize.width > current.x) {
        candidate.x = desiredX;
      }
    }
  }
}


function compactRows(nodes: MutableNode[], options?: BrowserCanvasPlacementOptions) {
  const sorted = [...nodes].sort((left, right) => left.y - right.y || left.x - right.x || stableNodeSort(left, right));
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    const previousSize = getNodeSize(previous, options);
    const minimumY = roundToGrid(previous.y + previousSize.height + Math.max(COLLISION_MARGIN, Math.round(GRID_Y / 4)), GRID_Y / 2);
    if (current.y > minimumY) {
      current.y = minimumY;
    }
  }
}

function compactColumns(nodes: MutableNode[], options?: BrowserCanvasPlacementOptions) {
  const sorted = [...nodes].sort((left, right) => left.x - right.x || left.y - right.y || stableNodeSort(left, right));
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    const previousSize = getNodeSize(previous, options);
    const minimumX = roundToGrid(previous.x + previousSize.width + Math.max(COLLISION_MARGIN, Math.round(GRID_X / 4)), GRID_X / 2);
    if (current.x > minimumX) {
      current.x = minimumX;
    }
  }
}

function normalizeColumnSpacing(nodes: MutableNode[], options?: BrowserCanvasPlacementOptions) {
  const minGapY = Math.max(COLLISION_MARGIN, Math.round(GRID_Y / 4));
  const sorted = [...nodes].sort((left, right) => left.x - right.x || left.y - right.y || stableNodeSort(left, right));
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    const currentSize = getNodeSize(current, options);
    for (let j = i + 1; j < sorted.length; j += 1) {
      const candidate = sorted[j];
      if (Math.abs(candidate.x - current.x) > Math.min(columnTolerance(current, options), columnTolerance(candidate, options))) {
        continue;
      }
      const candidateSize = getNodeSize(candidate, options);
      const desiredY = roundToGrid(current.y + currentSize.height + minGapY, GRID_Y / 2);
      if (candidate.y < desiredY && candidate.y + candidateSize.height > current.y) {
        candidate.y = desiredY;
      }
    }
  }
}

export function cleanupArrangedCanvasNodes(nodes: BrowserCanvasNode[], options?: BrowserCanvasPlacementOptions, cleanupIntensity: BrowserAutoLayoutCleanupIntensity = 'compact'): BrowserCanvasNode[] {
  if (nodes.length <= 1) {
    return nodes.map((node) => ({ ...node }));
  }

  const anchored = nodes
    .filter((node) => isAnchoredCanvasNode(node))
    .sort(stableNodeSort)
    .map((node) => ({ ...node }));
  const movable = nodes
    .filter((node) => !isAnchoredCanvasNode(node))
    .sort(stableNodeSort)
    .map((node) => ({ ...node }));

  normalizeRowSpacing(movable, options);
  normalizeColumnSpacing(movable, options);
  if (cleanupIntensity === 'compact') {
    compactRows(movable, options);
    compactColumns(movable, options);
  }

  let arranged: BrowserCanvasNode[] = anchored.map((node) => ({ ...node }));
  for (const node of movable) {
    const placement = avoidBrowserCanvasCollisions(arranged, node.kind, {
      x: roundToGrid(node.x, GRID_X / 2),
      y: roundToGrid(node.y, GRID_Y / 2),
    }, options);
    arranged = [...arranged, {
      ...node,
      x: placement.x,
      y: placement.y,
    }];
  }

  const arrangedByKey = new Map(arranged.map((node) => [`${node.kind}:${node.id}`, node]));
  return nodes.map((node) => arrangedByKey.get(`${node.kind}:${node.id}`) ?? { ...node });
}
