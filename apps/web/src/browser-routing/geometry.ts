import type { BrowserRoutingAnchorSide, BrowserRoutingPoint } from './types';

export type Rect = { x: number; y: number; w: number; h: number };
export type BrowserRoutingAxis = 'h' | 'v';

export function axisOfSegment(a: BrowserRoutingPoint, b: BrowserRoutingPoint): BrowserRoutingAxis | null {
  if (a.x === b.x && a.y !== b.y) return 'v';
  if (a.y === b.y && a.x !== b.x) return 'h';
  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function cornerPadForRect(rect: Rect): number {
  const maxPad = Math.max(1, Math.min(rect.w, rect.h) / 4);
  return Math.min(10, maxPad);
}

export function anchorOnRect(rect: Rect, side: BrowserRoutingAnchorSide, coord: number): BrowserRoutingPoint {
  const pad = cornerPadForRect(rect);
  const left = rect.x;
  const right = rect.x + rect.w;
  const top = rect.y;
  const bottom = rect.y + rect.h;

  if (side === 'left') return { x: left, y: clamp(coord, top + pad, bottom - pad) };
  if (side === 'right') return { x: right, y: clamp(coord, top + pad, bottom - pad) };
  if (side === 'top') return { x: clamp(coord, left + pad, right - pad), y: top };
  return { x: clamp(coord, left + pad, right - pad), y: bottom };
}

export function simplifyPolyline(points: BrowserRoutingPoint[]): BrowserRoutingPoint[] {
  if (points.length <= 2) return points.slice();

  const deduped: BrowserRoutingPoint[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = deduped[deduped.length - 1];
    const cur = points[i];
    if (prev.x === cur.x && prev.y === cur.y) continue;
    deduped.push(cur);
  }
  if (deduped.length <= 2) return deduped;

  const simplified: BrowserRoutingPoint[] = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i += 1) {
    const p0 = simplified[simplified.length - 1];
    const p1 = deduped[i];
    const p2 = deduped[i + 1];
    const a1 = axisOfSegment(p0, p1);
    const a2 = axisOfSegment(p1, p2);
    if (a1 && a2 && a1 === a2) {
      continue;
    }
    simplified.push(p1);
  }
  simplified.push(deduped[deduped.length - 1]);
  return simplified;
}

export function manhattanLength(points: BrowserRoutingPoint[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    len += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
  }
  return len;
}

export function inflateRect(rect: Rect, margin: number): Rect {
  if (!margin) {
    return rect;
  }
  return {
    x: rect.x - margin,
    y: rect.y - margin,
    w: rect.w + margin * 2,
    h: rect.h + margin * 2,
  };
}

export function segmentIntersectsRect(a: BrowserRoutingPoint, b: BrowserRoutingPoint, rect: Rect): boolean {
  const x0 = rect.x;
  const x1 = rect.x + rect.w;
  const y0 = rect.y;
  const y1 = rect.y + rect.h;

  if (a.x === b.x && a.y !== b.y) {
    const x = a.x;
    const ymin = Math.min(a.y, b.y);
    const ymax = Math.max(a.y, b.y);
    return x >= x0 && x <= x1 && ymax >= y0 && ymin <= y1;
  }

  if (a.y === b.y && a.x !== b.x) {
    const y = a.y;
    const xmin = Math.min(a.x, b.x);
    const xmax = Math.max(a.x, b.x);
    return y >= y0 && y <= y1 && xmax >= x0 && xmin <= x1;
  }

  const xmin = Math.min(a.x, b.x);
  const xmax = Math.max(a.x, b.x);
  const ymin = Math.min(a.y, b.y);
  const ymax = Math.max(a.y, b.y);
  return xmax >= x0 && xmin <= x1 && ymax >= y0 && ymin <= y1;
}
