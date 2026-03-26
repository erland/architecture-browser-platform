import type { BrowserProjectionEdge } from '../browser-projection/types';
import type { BrowserEdgeRoutingInput, BrowserRoutingAnchorSide, BrowserRoutingNodeFrame, BrowserRoutingNodeObstacle, BrowserRoutingPoint, BrowserRoutingScene } from './types';

function toObstacle(node: BrowserRoutingNodeFrame): BrowserRoutingNodeObstacle {
  return {
    nodeId: node.nodeId,
    kind: node.kind,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cornerPadForRect(rect: BrowserRoutingNodeObstacle): number {
  const maxPad = Math.max(1, Math.min(rect.width, rect.height) / 4);
  return Math.min(10, maxPad);
}

function buildNodeCenter(rect: BrowserRoutingNodeObstacle): BrowserRoutingPoint {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function buildAnchorPoint(
  rect: BrowserRoutingNodeObstacle,
  side: BrowserRoutingAnchorSide,
  toward: BrowserRoutingPoint,
): BrowserRoutingPoint {
  const pad = cornerPadForRect(rect);
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  switch (side) {
    case 'left':
      return { x: left, y: clamp(toward.y, top + pad, bottom - pad) };
    case 'right':
      return { x: right, y: clamp(toward.y, top + pad, bottom - pad) };
    case 'top':
      return { x: clamp(toward.x, left + pad, right - pad), y: top };
    case 'bottom':
      return { x: clamp(toward.x, left + pad, right - pad), y: bottom };
  }
}

function overlapSize(start: number, length: number, otherStart: number, otherLength: number): number {
  const overlapStart = Math.max(start, otherStart);
  const overlapEnd = Math.min(start + length, otherStart + otherLength);
  return Math.max(0, overlapEnd - overlapStart);
}

function determinePreferredSides(sourceRect: BrowserRoutingNodeObstacle, targetRect: BrowserRoutingNodeObstacle): {
  preferredStartSide: BrowserRoutingAnchorSide;
  preferredEndSide: BrowserRoutingAnchorSide;
} {
  const sourceCenter = buildNodeCenter(sourceRect);
  const targetCenter = buildNodeCenter(targetRect);
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;
  const horizontalOverlap = overlapSize(sourceRect.x, sourceRect.width, targetRect.x, targetRect.width);
  const verticalOverlap = overlapSize(sourceRect.y, sourceRect.height, targetRect.y, targetRect.height);

  if (horizontalOverlap > 0 && verticalOverlap <= 0) {
    const verticalDown = deltaY >= 0;
    return {
      preferredStartSide: verticalDown ? 'bottom' : 'top',
      preferredEndSide: verticalDown ? 'top' : 'bottom',
    };
  }

  if (verticalOverlap > 0 && horizontalOverlap <= 0) {
    return {
      preferredStartSide: deltaX >= 0 ? 'right' : 'left',
      preferredEndSide: deltaX >= 0 ? 'left' : 'right',
    };
  }

  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    const verticalDown = deltaY >= 0;
    return {
      preferredStartSide: verticalDown ? 'bottom' : 'top',
      preferredEndSide: verticalDown ? 'top' : 'bottom',
    };
  }

  return {
    preferredStartSide: deltaX >= 0 ? 'right' : 'left',
    preferredEndSide: deltaX >= 0 ? 'left' : 'right',
  };
}

function buildRoutingInput(edge: BrowserProjectionEdge, obstacleByNodeId: Map<string, BrowserRoutingNodeObstacle>): BrowserEdgeRoutingInput | null {
  const sourceRect = obstacleByNodeId.get(edge.fromNodeId);
  const targetRect = obstacleByNodeId.get(edge.toNodeId);
  if (!sourceRect || !targetRect) {
    return null;
  }

  const sourceCenter = buildNodeCenter(sourceRect);
  const targetCenter = buildNodeCenter(targetRect);
  const selfLoop = edge.fromNodeId === edge.toNodeId;
  const preferredSides = selfLoop
    ? { preferredStartSide: 'right' as const, preferredEndSide: 'bottom' as const }
    : determinePreferredSides(sourceRect, targetRect);
  const obstacleNodeIds = Array.from(obstacleByNodeId.keys()).filter((nodeId) => nodeId !== edge.fromNodeId && nodeId !== edge.toNodeId);
  const obstacles = obstacleNodeIds
    .map((nodeId) => obstacleByNodeId.get(nodeId))
    .filter((obstacle): obstacle is BrowserRoutingNodeObstacle => Boolean(obstacle));

  return {
    relationshipId: edge.relationshipId,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    sourceRect,
    targetRect,
    defaultStart: buildAnchorPoint(sourceRect, preferredSides.preferredStartSide, targetCenter),
    defaultEnd: buildAnchorPoint(targetRect, preferredSides.preferredEndSide, sourceCenter),
    preferredStartSide: preferredSides.preferredStartSide,
    preferredEndSide: preferredSides.preferredEndSide,
    selfLoop,
    obstacleNodeIds,
    obstacles,
  };
}

export function buildBrowserRoutingScene(nodes: BrowserRoutingNodeFrame[], edges: BrowserProjectionEdge[]): BrowserRoutingScene {
  const obstacles = nodes.map(toObstacle);
  const obstacleByNodeId = new Map<string, BrowserRoutingNodeObstacle>(obstacles.map((obstacle) => [obstacle.nodeId, obstacle]));
  const inputsByRelationshipId = Object.fromEntries(
    edges
      .map((edge) => {
        const routingInput = buildRoutingInput(edge, obstacleByNodeId);
        return routingInput ? [edge.relationshipId, routingInput] : null;
      })
      .filter((entry): entry is [string, BrowserEdgeRoutingInput] => Boolean(entry)),
  );

  return {
    obstacles,
    inputsByRelationshipId,
  };
}
