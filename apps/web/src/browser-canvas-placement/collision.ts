import type { BrowserCanvasNode } from '../browser-session';
import { BROWSER_ENTITY_NODE_SIZE, BROWSER_SCOPE_NODE_SIZE, getProjectionAwareCanvasNodeSize } from '../browser-graph';
import {
  APPEND_CLUSTER_GAP,
  COLLISION_MARGIN,
  GRID_X,
  GRID_Y,
  roundToGrid,
} from '../browser-graph/canvas';
import type {
  BrowserCanvasBounds,
  BrowserCanvasNodeLike,
  BrowserCanvasNodeSizeLike,
  BrowserCanvasPlacement,
  BrowserCanvasPlacementOptions,
} from './types';

export function isAnchoredCanvasNode(node: Pick<BrowserCanvasNode, 'pinned' | 'manuallyPlaced'>) {
  return Boolean(node.pinned || node.manuallyPlaced);
}

export function getNodeSize(node: BrowserCanvasNodeSizeLike, options?: BrowserCanvasPlacementOptions) {
  if (options?.state && node.id) {
    return getProjectionAwareCanvasNodeSize(options.state, { kind: node.kind, id: node.id });
  }
  return node.kind === 'scope' ? BROWSER_SCOPE_NODE_SIZE : BROWSER_ENTITY_NODE_SIZE;
}

export function getBrowserCanvasBounds(nodes: BrowserCanvasNodeSizeLike[], options?: BrowserCanvasPlacementOptions): BrowserCanvasBounds | null {
  if (nodes.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const node of nodes) {
    const size = getNodeSize(node, options);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + size.width);
    maxY = Math.max(maxY, node.y + size.height);
  }
  return { minX, minY, maxX, maxY };
}

function rectanglesOverlap(a: BrowserCanvasNodeSizeLike, b: BrowserCanvasNodeSizeLike, options?: BrowserCanvasPlacementOptions) {
  const aSize = getNodeSize(a, options);
  const bSize = getNodeSize(b, options);
  return !(
    a.x + aSize.width + COLLISION_MARGIN <= b.x ||
    b.x + bSize.width + COLLISION_MARGIN <= a.x ||
    a.y + aSize.height + COLLISION_MARGIN <= b.y ||
    b.y + bSize.height + COLLISION_MARGIN <= a.y
  );
}

function collides(nodes: BrowserCanvasNodeSizeLike[], candidate: BrowserCanvasNodeSizeLike, options?: BrowserCanvasPlacementOptions) {
  return nodes.some((node) => rectanglesOverlap(node, candidate, options));
}

export function avoidBrowserCanvasCollisions(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  desired: BrowserCanvasPlacement,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const seeded = {
    kind,
    x: Math.max(24, roundToGrid(desired.x, GRID_X / 2)),
    y: Math.max(24, roundToGrid(desired.y, GRID_Y / 2)),
  } satisfies BrowserCanvasNodeLike;
  if (!collides(nodes, seeded, options)) {
    return { x: seeded.x, y: seeded.y };
  }

  const offsets = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [2, 0], [0, 2], [-2, 0], [0, -2],
    [2, 1], [1, 2], [-1, 2], [-2, 1],
    [2, -1], [1, -2], [-1, -2], [-2, -1],
    [3, 0], [0, 3], [-3, 0], [0, -3],
  ];

  for (const [dx, dy] of offsets) {
    const candidate = {
      kind,
      x: Math.max(24, seeded.x + dx * GRID_X),
      y: Math.max(24, seeded.y + dy * GRID_Y),
    } satisfies BrowserCanvasNodeLike;
    if (!collides(nodes, candidate, options)) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  const bounds = getBrowserCanvasBounds(nodes, options);
  return {
    x: Math.max(24, bounds ? roundToGrid(bounds.maxX + APPEND_CLUSTER_GAP, GRID_X / 2) : 56),
    y: Math.max(24, bounds ? roundToGrid(bounds.minY, GRID_Y / 2) : 64),
  };
}
