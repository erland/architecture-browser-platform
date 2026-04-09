import type { BrowserWorkspaceEdgeModel } from '../../browser-graph/workspace';

function isFinitePoint(point: { x: number; y: number } | undefined): point is { x: number; y: number } {
  return Number.isFinite(point?.x) && Number.isFinite(point?.y);
}

export function buildSvgPolylinePath(points: BrowserWorkspaceEdgeModel['route']['points']): string {
  if (points.length < 2 || points.some((point) => !isFinitePoint(point))) {
    return '';
  }
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

export function buildFallbackEdgePath(edge: BrowserWorkspaceEdgeModel): string {
  const start = edge.routingInput.defaultStart;
  const end = edge.routingInput.defaultEnd;
  if (!isFinitePoint(start) || !isFinitePoint(end)) {
    return '';
  }
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function buildEndpointLabelPosition(points: BrowserWorkspaceEdgeModel['route']['points'], start: boolean, laneOffset = 0): { x: number; y: number } | undefined {
  if (points.length < 2) {
    return undefined;
  }
  const anchor = start ? points[0] : points[points.length - 1];
  const reference = start ? points[1] : points[points.length - 2];
  if (!isFinitePoint(anchor) || !isFinitePoint(reference)) {
    return undefined;
  }
  const dx = anchor.x - reference.x;
  const dy = anchor.y - reference.y;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  const offset = 18;
  const normalX = -unitY;
  const normalY = unitX;
  const laneNudge = laneOffset * 0.5;
  return {
    x: anchor.x + unitX * offset + normalX * (10 + laneNudge),
    y: anchor.y + unitY * offset + normalY * (10 + laneNudge),
  };
}

function applyLaneOffsetToLabelPosition(
  position: { x: number; y: number },
  points: BrowserWorkspaceEdgeModel['route']['points'],
  laneOffset = 0,
): { x: number; y: number } {
  if (!laneOffset || points.length < 2) {
    return position;
  }
  const midpointIndex = Math.max(1, Math.floor((points.length - 1) / 2));
  const start = points[midpointIndex - 1];
  const end = points[midpointIndex];
  if (!isFinitePoint(start) || !isFinitePoint(end)) {
    return position;
  }
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  return {
    x: position.x + normalX * laneOffset * 0.65,
    y: position.y + normalY * laneOffset * 0.65,
  };
}

export function resolveRenderedEdgeGeometry(edge: BrowserWorkspaceEdgeModel): {
  path: string;
  hitboxPath: string;
  labelPosition: BrowserWorkspaceEdgeModel['route']['labelPosition'];
  fromLabelPosition?: { x: number; y: number };
  toLabelPosition?: { x: number; y: number };
} {
  const routePath = edge.route.path.trim();
  const polylinePath = buildSvgPolylinePath(edge.route.points);
  const path = routePath || polylinePath || buildFallbackEdgePath(edge);
  const hitboxPath = polylinePath || path;
  const points = edge.route.points.length >= 2
    ? edge.route.points
    : [edge.routingInput.defaultStart, edge.routingInput.defaultEnd];
  const baseLabelPosition = isFinitePoint(edge.route.labelPosition)
    ? edge.route.labelPosition
    : edge.routingInput.defaultStart;
  const labelPosition = applyLaneOffsetToLabelPosition(baseLabelPosition, points, edge.laneOffset);
  return {
    path,
    hitboxPath,
    labelPosition,
    fromLabelPosition: buildEndpointLabelPosition(points, true, edge.laneOffset),
    toLabelPosition: buildEndpointLabelPosition(points, false, edge.laneOffset),
  };
}
