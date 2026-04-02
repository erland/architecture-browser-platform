import {
  CONTAINED_OFFSET_X,
  CONTAINED_OFFSET_Y,
  PEER_SPACING_X,
  PEER_SPACING_Y,
  RADIAL_RADIUS,
} from '../browserCanvasPlacement.policy';
import type { BrowserCanvasNode } from '../browserSessionStore';
import type {
  BrowserCanvasNodeLike,
  BrowserCanvasNodeSizeLike,
  BrowserCanvasPlacement,
  BrowserCanvasPlacementOptions,
} from './types';
import { avoidBrowserCanvasCollisions, getNodeSize } from './collision';
import { placeAppendedCanvasNode } from './initialPlacement';

export function placeCanvasNodeNearAnchor(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  anchor: BrowserCanvasNodeSizeLike,
  index: number,
  total: number,
  direction: 'around' | 'left' | 'right' = 'around',
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const anchorSize = getNodeSize(anchor, options);
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

  const size = getNodeSize({ kind, x: 0, y: 0 }, options);
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: anchorCenterX + Math.cos(angle) * radius - size.width / 2,
    y: anchorCenterY + Math.sin(angle) * radius - size.height / 2,
  }, options);
}

export function placeContainedCanvasNode(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  containerNode: BrowserCanvasNodeSizeLike,
  index: number,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: containerNode.x + CONTAINED_OFFSET_X + (index % 2) * 24,
    y: containerNode.y + CONTAINED_OFFSET_Y + index * PEER_SPACING_Y,
  }, options);
}

export function placePeerCanvasNode(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  peerNodes: BrowserCanvasNodeSizeLike[],
  index: number,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const peers = peerNodes.filter((peer) => peer.kind === kind);
  if (peers.length === 0) {
    return placeAppendedCanvasNode(nodes, kind, index, options);
  }
  const sorted = [...peers].sort((left, right) => left.y - right.y || left.x - right.x);
  const lastPeer = sorted[sorted.length - 1];
  const column = sorted.length % 3;
  const row = Math.floor(sorted.length / 3);
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: lastPeer.x + (column === 0 ? PEER_SPACING_X : 0),
    y: sorted[0].y + row * PEER_SPACING_Y + index * 8,
  }, options);
}

export function getCanvasNodeById(nodes: BrowserCanvasNode[], kind: BrowserCanvasNode['kind'], id: string) {
  return nodes.find((node) => node.kind === kind && node.id === id) ?? null;
}
