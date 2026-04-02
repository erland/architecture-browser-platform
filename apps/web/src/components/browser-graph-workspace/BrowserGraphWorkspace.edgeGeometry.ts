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

export function resolveRenderedEdgeGeometry(edge: BrowserWorkspaceEdgeModel): {
  path: string;
  hitboxPath: string;
  labelPosition: BrowserWorkspaceEdgeModel['route']['labelPosition'];
} {
  const routePath = edge.route.path.trim();
  const polylinePath = buildSvgPolylinePath(edge.route.points);
  const path = routePath || polylinePath || buildFallbackEdgePath(edge);
  const hitboxPath = polylinePath || path;
  const labelPosition = isFinitePoint(edge.route.labelPosition)
    ? edge.route.labelPosition
    : edge.routingInput.defaultStart;
  return { path, hitboxPath, labelPosition };
}
