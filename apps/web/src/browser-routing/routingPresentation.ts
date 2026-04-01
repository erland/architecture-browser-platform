import type { BrowserRoutingPoint } from './types';

export function buildPath(points: BrowserRoutingPoint[]): string {
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function buildLabelPosition(points: BrowserRoutingPoint[]): BrowserRoutingPoint {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  if (points.length === 1) {
    return points[0];
  }
  const middleIndex = Math.floor((points.length - 1) / 2);
  const start = points[middleIndex];
  const end = points[middleIndex + 1] ?? start;
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}
