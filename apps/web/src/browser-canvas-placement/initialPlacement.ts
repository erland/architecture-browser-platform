import {
  APPEND_CLUSTER_GAP,
  PEER_SPACING_Y,
} from '../browser-graph/canvas/stage';
import type {
  BrowserCanvasNodeLike,
  BrowserCanvasNodeSizeLike,
  BrowserCanvasPlacement,
  BrowserCanvasPlacementOptions,
} from './types';
import { avoidBrowserCanvasCollisions, getBrowserCanvasBounds } from './collision';

export function placeFirstCanvasNode(kind: BrowserCanvasNodeLike['kind']): BrowserCanvasPlacement {
  return kind === 'scope' ? { x: 56, y: 64 } : { x: 96, y: 96 };
}

export function placeAppendedCanvasNode(
  nodes: BrowserCanvasNodeSizeLike[],
  kind: BrowserCanvasNodeLike['kind'],
  index = 0,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const bounds = getBrowserCanvasBounds(nodes, options);
  if (!bounds) {
    return placeFirstCanvasNode(kind);
  }
  return avoidBrowserCanvasCollisions(nodes, kind, {
    x: bounds.maxX + APPEND_CLUSTER_GAP + (index % 2) * 32,
    y: bounds.minY + index * PEER_SPACING_Y,
  }, options);
}

export function getDefaultCanvasNodePosition(
  kind: BrowserCanvasNodeLike['kind'],
  nodes: BrowserCanvasNodeSizeLike[],
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  return kind === 'scope'
    ? placeAppendedCanvasNode(nodes, 'scope', 0, options)
    : placeAppendedCanvasNode(nodes, 'entity', 0, options);
}
