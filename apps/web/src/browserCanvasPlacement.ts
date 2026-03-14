import type { FullSnapshotEntity } from './appModel';
import type { BrowserSnapshotIndex } from './browserSnapshotIndex';
import type { BrowserCanvasNode } from './browserSessionStore';

export const BROWSER_SCOPE_NODE_SIZE = { width: 204, height: 82 } as const;
export const BROWSER_ENTITY_NODE_SIZE = { width: 196, height: 84 } as const;

const GRID_X = 224;
const GRID_Y = 120;
const COLLISION_MARGIN = 24;
const APPEND_CLUSTER_GAP = 96;
const RADIAL_RADIUS = 220;
const PEER_SPACING_X = 224;
const PEER_SPACING_Y = 116;
const CONTAINED_OFFSET_X = 44;
const CONTAINED_OFFSET_Y = 108;

export type BrowserCanvasPlacement = { x: number; y: number };

type BrowserCanvasBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type BrowserCanvasNodeLike = Pick<BrowserCanvasNode, 'kind' | 'x' | 'y'>;

function getNodeSize(kind: BrowserCanvasNodeLike['kind']) {
  return kind === 'scope' ? BROWSER_SCOPE_NODE_SIZE : BROWSER_ENTITY_NODE_SIZE;
}

export function getBrowserCanvasBounds(nodes: BrowserCanvasNodeLike[]): BrowserCanvasBounds | null {
  if (nodes.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const node of nodes) {
    const size = getNodeSize(node.kind);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + size.width);
    maxY = Math.max(maxY, node.y + size.height);
  }
  return { minX, minY, maxX, maxY };
}

function rectanglesOverlap(a: BrowserCanvasNodeLike, b: BrowserCanvasNodeLike) {
  const aSize = getNodeSize(a.kind);
  const bSize = getNodeSize(b.kind);
  return !(
    a.x + aSize.width + COLLISION_MARGIN <= b.x ||
    b.x + bSize.width + COLLISION_MARGIN <= a.x ||
    a.y + aSize.height + COLLISION_MARGIN <= b.y ||
    b.y + bSize.height + COLLISION_MARGIN <= a.y
  );
}

function collides(nodes: BrowserCanvasNodeLike[], candidate: BrowserCanvasNodeLike) {
  return nodes.some((node) => rectanglesOverlap(node, candidate));
}

function roundToGrid(value: number, spacing: number) {
  return Math.round(value / spacing) * spacing;
}

export function avoidBrowserCanvasCollisions(
  nodes: BrowserCanvasNodeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  desired: BrowserCanvasPlacement,
): BrowserCanvasPlacement {
  const seeded = {
    kind,
    x: Math.max(24, roundToGrid(desired.x, GRID_X / 2)),
    y: Math.max(24, roundToGrid(desired.y, GRID_Y / 2)),
  } satisfies BrowserCanvasNodeLike;
  if (!collides(nodes, seeded)) {
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
    if (!collides(nodes, candidate)) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  const bounds = getBrowserCanvasBounds(nodes);
  return {
    x: Math.max(24, bounds ? roundToGrid(bounds.maxX + APPEND_CLUSTER_GAP, GRID_X / 2) : 56),
    y: Math.max(24, bounds ? roundToGrid(bounds.minY, GRID_Y / 2) : 64),
  };
}


export function getDefaultCanvasNodePosition(kind: BrowserCanvasNodeLike['kind'], nodes: BrowserCanvasNodeLike[]): BrowserCanvasPlacement {
  return kind === 'scope' ? placeAppendedCanvasNode(nodes, 'scope') : placeAppendedCanvasNode(nodes, 'entity');
}

export function placeFirstCanvasNode(kind: BrowserCanvasNodeLike['kind']): BrowserCanvasPlacement {
  return kind === 'scope' ? { x: 56, y: 64 } : { x: 96, y: 96 };
}

export function placeAppendedCanvasNode(
  nodes: BrowserCanvasNodeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  index = 0,
): BrowserCanvasPlacement {
  const bounds = getBrowserCanvasBounds(nodes);
  if (!bounds) {
    return placeFirstCanvasNode(kind);
  }
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: bounds.maxX + APPEND_CLUSTER_GAP + (index % 2) * 32,
    y: bounds.minY + index * PEER_SPACING_Y,
  });
}

export function placeCanvasNodeNearAnchor(
  nodes: BrowserCanvasNodeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  anchor: BrowserCanvasNodeLike,
  index: number,
  total: number,
  direction: 'around' | 'left' | 'right' = 'around',
): BrowserCanvasPlacement {
  const anchorSize = getNodeSize(anchor.kind);
  const anchorCenterX = anchor.x + anchorSize.width / 2;
  const anchorCenterY = anchor.y + anchorSize.height / 2;
  const radius = RADIAL_RADIUS + Math.floor(index / 6) * 48;

  let angle: number;
  if (direction === 'left') {
    angle = Math.PI + ((index - Math.max(0, total - 1) / 2) * Math.PI) / Math.max(3, total + 1);
  } else if (direction === 'right') {
    angle = ((index - Math.max(0, total - 1) / 2) * Math.PI) / Math.max(3, total + 1);
  } else {
    angle = -Math.PI / 2 + (index * (2 * Math.PI)) / Math.max(1, total);
  }

  const size = getNodeSize(kind);
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: anchorCenterX + Math.cos(angle) * radius - size.width / 2,
    y: anchorCenterY + Math.sin(angle) * radius - size.height / 2,
  });
}

export function placeContainedCanvasNode(
  nodes: BrowserCanvasNodeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  containerNode: BrowserCanvasNodeLike,
  index: number,
): BrowserCanvasPlacement {
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: containerNode.x + CONTAINED_OFFSET_X + (index % 2) * 24,
    y: containerNode.y + CONTAINED_OFFSET_Y + index * PEER_SPACING_Y,
  });
}

export function placePeerCanvasNode(
  nodes: BrowserCanvasNodeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  peerNodes: BrowserCanvasNodeLike[],
  index: number,
): BrowserCanvasPlacement {
  const peers = peerNodes.filter((peer) => peer.kind === kind);
  if (peers.length === 0) {
    return placeAppendedCanvasNode(nodes, kind, index);
  }
  const sorted = [...peers].sort((left, right) => left.y - right.y || left.x - right.x);
  const lastPeer = sorted[sorted.length - 1];
  const column = sorted.length % 3;
  const row = Math.floor(sorted.length / 3);
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: lastPeer.x + (column === 0 ? PEER_SPACING_X : 0),
    y: sorted[0].y + row * PEER_SPACING_Y + index * 8,
  });
}

export function getCanvasNodeById(nodes: BrowserCanvasNode[], kind: BrowserCanvasNode['kind'], id: string) {
  return nodes.find((node) => node.kind === kind && node.id === id) ?? null;
}

export function planEntityInsertion(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  options?: {
    anchorEntityId?: string | null;
    anchorDirection?: 'around' | 'left' | 'right';
    selectedScopeId?: string | null;
    insertionIndex?: number;
    insertionCount?: number;
  },
): BrowserCanvasPlacement {
  const insertionIndex = options?.insertionIndex ?? 0;
  const insertionCount = options?.insertionCount ?? 1;
  if (nodes.length === 0) {
    return placeFirstCanvasNode('entity');
  }

  const anchorEntityId = options?.anchorEntityId ?? null;
  if (anchorEntityId) {
    const anchorNode = getCanvasNodeById(nodes, 'entity', anchorEntityId);
    if (anchorNode) {
      return placeCanvasNodeNearAnchor(nodes, 'entity', anchorNode, insertionIndex, insertionCount, options?.anchorDirection ?? 'around');
    }
  }

  const scopeId = entity.scopeId ?? null;
  const scopeNode = scopeId ? getCanvasNodeById(nodes, 'scope', scopeId) : null;
  if (scopeNode) {
    return placeContainedCanvasNode(nodes, 'entity', scopeNode, insertionIndex);
  }

  const peerNodes = nodes.filter((node) => {
    if (node.kind !== 'entity') {
      return false;
    }
    const peer = index.entitiesById.get(node.id);
    return peer?.scopeId === scopeId;
  });
  if (peerNodes.length > 0) {
    return placePeerCanvasNode(nodes, 'entity', peerNodes, insertionIndex);
  }

  if (options?.selectedScopeId) {
    const selectedScopeNode = getCanvasNodeById(nodes, 'scope', options.selectedScopeId,);
    if (selectedScopeNode) {
      return placeContainedCanvasNode(nodes, 'entity', selectedScopeNode, insertionIndex);
    }
  }

  return placeAppendedCanvasNode(nodes, 'entity', insertionIndex);
}

export function planScopeInsertion(
  nodes: BrowserCanvasNode[],
  _scopeId: string,
  insertionIndex = 0,
): BrowserCanvasPlacement {
  if (nodes.length === 0) {
    return placeFirstCanvasNode('scope');
  }
  return placeAppendedCanvasNode(nodes, 'scope', insertionIndex);
}
