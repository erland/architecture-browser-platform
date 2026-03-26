import type { BrowserEdgeRoutingInput, BrowserRoutingAnchorSide, BrowserRoutingPoint } from './types';

export type BrowserRoutingAxis = 'h' | 'v';

export type BrowserOrthogonalRoutingHints = {
  preferStartAxis?: BrowserRoutingAxis;
  preferEndAxis?: BrowserRoutingAxis;
  gridSize?: number;
  laneOffset?: number;
  laneSpacing?: number;
  maxChannelShiftSteps?: number;
  obstacleMargin?: number;
};

export type BrowserEdgeRouteBuildOptions = {
  orthogonalRouting?: boolean;
  laneOffset?: number;
  laneSpacing?: number;
  gridSize?: number;
  obstacleMargin?: number;
  maxChannelShiftSteps?: number;
  endpointStubLength?: number;
};

type Rect = { x: number; y: number; w: number; h: number };

type BrowserBuiltEdgeRoute = {
  kind: 'straight' | 'polyline';
  points: BrowserRoutingPoint[];
  path: string;
  labelPosition: BrowserRoutingPoint;
};

function axisOfSegment(a: BrowserRoutingPoint, b: BrowserRoutingPoint): BrowserRoutingAxis | null {
  if (a.x === b.x && a.y !== b.y) return 'v';
  if (a.y === b.y && a.x !== b.x) return 'h';
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cornerPadForRect(rect: Rect): number {
  const maxPad = Math.max(1, Math.min(rect.w, rect.h) / 4);
  return Math.min(10, maxPad);
}

function anchorOnRect(rect: Rect, side: BrowserRoutingAnchorSide, coord: number): BrowserRoutingPoint {
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

function simplifyPolyline(points: BrowserRoutingPoint[]): BrowserRoutingPoint[] {
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

function manhattanLength(points: BrowserRoutingPoint[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    len += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
  }
  return len;
}

function inflateRect(rect: Rect, margin: number): Rect {
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

function segmentIntersectsRect(a: BrowserRoutingPoint, b: BrowserRoutingPoint, rect: Rect): boolean {
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

function obstacleHitCount(points: BrowserRoutingPoint[], obstacles: Rect[], margin: number): number {
  if (!obstacles.length || points.length < 2) return 0;
  const inflated = obstacles.map((obstacle) => inflateRect(obstacle, margin));
  const hit = new Set<number>();
  for (let i = 0; i < points.length - 1; i += 1) {
    for (let j = 0; j < inflated.length; j += 1) {
      if (hit.has(j)) continue;
      if (segmentIntersectsRect(points[i], points[i + 1], inflated[j])) {
        hit.add(j);
      }
    }
  }
  return hit.size;
}

function laneOffsets(maxSteps: number): number[] {
  const offsets: number[] = [0];
  for (let i = 1; i <= maxSteps; i += 1) {
    offsets.push(i);
    offsets.push(-i);
  }
  return offsets;
}

function scoreCandidate(points: BrowserRoutingPoint[], hints?: BrowserOrthogonalRoutingHints): number {
  const simplified = simplifyPolyline(points);
  if (simplified.length < 2) return Number.POSITIVE_INFINITY;

  const firstAxis = axisOfSegment(simplified[0], simplified[1]);
  const lastAxis = axisOfSegment(simplified[simplified.length - 2], simplified[simplified.length - 1]);
  if (!firstAxis || !lastAxis) return Number.POSITIVE_INFINITY;

  let score = manhattanLength(simplified);
  score += (simplified.length - 2) * 5;

  if (hints?.preferStartAxis && firstAxis !== hints.preferStartAxis) score += 10_000;
  if (hints?.preferEndAxis && lastAxis !== hints.preferEndAxis) score += 10_000;

  return score;
}

function selfLoopPolyline(input: BrowserEdgeRoutingInput, hints?: BrowserOrthogonalRoutingHints): BrowserRoutingPoint[] {
  const a = input.defaultStart;
  const b = input.defaultEnd;
  const rect = input.sourceRect;
  const grid = hints?.gridSize ?? 0;
  const baseStep = grid > 0 ? Math.max(2 * grid, 40) : 40;
  const outX = rect.x + rect.width + baseStep;
  const outY = rect.y - baseStep;

  if (a.x === b.x && a.y === b.y) {
    return simplifyPolyline([a, { x: outX, y: a.y }, { x: outX, y: outY }, { x: a.x, y: outY }, b]);
  }

  if (a.y === b.y) {
    return simplifyPolyline([a, { x: a.x, y: outY }, { x: b.x, y: outY }, b]);
  }

  if (a.x === b.x) {
    return simplifyPolyline([a, { x: outX, y: a.y }, { x: outX, y: b.y }, b]);
  }

  return simplifyPolyline([a, { x: outX, y: a.y }, { x: outX, y: b.y }, b]);
}

function orthogonalAutoPolyline(input: BrowserEdgeRoutingInput, hints?: BrowserOrthogonalRoutingHints): BrowserRoutingPoint[] {
  if (input.selfLoop) {
    return selfLoopPolyline(input, hints);
  }

  const a = input.defaultStart;
  const b = input.defaultEnd;
  const aligned = a.x === b.x || a.y === b.y;
  const obstacles: Rect[] = input.obstacles.map((obstacle) => ({
    x: obstacle.x,
    y: obstacle.y,
    w: obstacle.width,
    h: obstacle.height,
  }));
  const hasObstacles = obstacles.length > 0;
  const laneOffset = hints?.laneOffset ?? 0;

  if (aligned && !hasObstacles && laneOffset === 0) {
    return [a, b];
  }

  const straight: BrowserRoutingPoint[] = [a, b];
  const verticalThenHorizontal: BrowserRoutingPoint[] = [a, { x: a.x, y: b.y }, b];
  const horizontalThenVertical: BrowserRoutingPoint[] = [a, { x: b.x, y: a.y }, b];
  const baseCandidates: BrowserRoutingPoint[][] = aligned
    ? (hasObstacles || laneOffset !== 0 ? [] : [straight])
    : [verticalThenHorizontal, horizontalThenVertical];

  const margin = hints?.obstacleMargin ?? (hints?.gridSize ? hints.gridSize / 2 : 12);
  const laneSpacing = hints?.laneSpacing ?? (hints?.gridSize ? hints.gridSize / 2 : 18);
  const maxShiftSteps = hints?.maxChannelShiftSteps ?? 10;

  const scored = new Map<string, { points: BrowserRoutingPoint[]; hits: number; score: number }>();
  const pushCandidate = (points: BrowserRoutingPoint[], extraScore = 0) => {
    const simplified = simplifyPolyline(points);
    if (simplified.length < 2) return;
    if (aligned && (hasObstacles || laneOffset !== 0) && simplified.length < 3) return;
    const hits = obstacleHitCount(simplified, obstacles, margin);
    const score = scoreCandidate(simplified, hints) + extraScore + hits * 100_000;
    const key = JSON.stringify(simplified);
    const current = scored.get(key);
    if (!current || score < current.score) {
      scored.set(key, { points: simplified, hits, score });
    }
  };

  baseCandidates.forEach((candidate) => pushCandidate(candidate));

  for (const laneIndex of laneOffsets(maxShiftSteps)) {
    const shift = laneOffset + laneIndex * laneSpacing;
    if (aligned && shift === 0) {
      continue;
    }

    pushCandidate([a, { x: a.x + shift, y: a.y }, { x: a.x + shift, y: b.y }, b], Math.abs(shift));
    pushCandidate([a, { x: a.x, y: a.y + shift }, { x: b.x, y: a.y + shift }, b], Math.abs(shift));

    if (!aligned) {
      pushCandidate([a, { x: a.x + shift, y: a.y }, { x: a.x + shift, y: b.y }, { x: b.x, y: b.y }, b], Math.abs(shift) + 8);
      pushCandidate([a, { x: a.x, y: a.y + shift }, { x: b.x, y: a.y + shift }, { x: b.x, y: b.y }, b], Math.abs(shift) + 8);
    }
  }

  const candidates = Array.from(scored.values()).sort((left, right) => {
    if (left.hits !== right.hits) {
      return left.hits - right.hits;
    }
    return left.score - right.score;
  });

  return simplifyPolyline(candidates[0]?.points ?? [a, b]);
}

function adjustOrthogonalConnectionEndpoints(
  points: BrowserRoutingPoint[],
  input: BrowserEdgeRoutingInput,
  opts?: { stubLength?: number },
): BrowserRoutingPoint[] {
  if (points.length < 2) return points;

  const res = points.map((point) => ({ ...point }));
  const sourceRect: Rect = {
    x: input.sourceRect.x,
    y: input.sourceRect.y,
    w: input.sourceRect.width,
    h: input.sourceRect.height,
  };
  const targetRect: Rect = {
    x: input.targetRect.x,
    y: input.targetRect.y,
    w: input.targetRect.width,
    h: input.targetRect.height,
  };

  {
    const p0 = res[0];
    const p1 = res[1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    if (dx === 0 && dy !== 0) {
      const side: BrowserRoutingAnchorSide = dy > 0 ? 'bottom' : 'top';
      const anchor = anchorOnRect(sourceRect, side, p0.x);
      res[0] = anchor;
      const nextY = side === 'bottom' ? Math.max(res[1].y, anchor.y) : Math.min(res[1].y, anchor.y);
      res[1] = { ...res[1], x: anchor.x, y: nextY };
    } else if (dy === 0 && dx !== 0) {
      const side: BrowserRoutingAnchorSide = dx > 0 ? 'right' : 'left';
      const anchor = anchorOnRect(sourceRect, side, p0.y);
      res[0] = anchor;
      const nextX = side === 'right' ? Math.max(res[1].x, anchor.x) : Math.min(res[1].x, anchor.x);
      res[1] = { ...res[1], y: anchor.y, x: nextX };
    }
  }

  {
    const last = res.length - 1;
    const prev = res[last - 1];
    const end = res[last];
    const dx = end.x - prev.x;
    const dy = end.y - prev.y;
    if (dx === 0 && dy !== 0) {
      const side: BrowserRoutingAnchorSide = dy > 0 ? 'top' : 'bottom';
      const anchor = anchorOnRect(targetRect, side, end.x);
      res[last] = anchor;
      const prevY = side === 'top' ? Math.min(res[last - 1].y, anchor.y) : Math.max(res[last - 1].y, anchor.y);
      res[last - 1] = { ...res[last - 1], x: anchor.x, y: prevY };
    } else if (dy === 0 && dx !== 0) {
      const side: BrowserRoutingAnchorSide = dx > 0 ? 'left' : 'right';
      const anchor = anchorOnRect(targetRect, side, end.y);
      res[last] = anchor;
      const prevX = side === 'left' ? Math.min(res[last - 1].x, anchor.x) : Math.max(res[last - 1].x, anchor.x);
      res[last - 1] = { ...res[last - 1], y: anchor.y, x: prevX };
    }
  }

  const stub = Math.max(6, opts?.stubLength ?? 10);
  const withStubs = res.map((point) => ({ ...point }));

  if (withStubs.length >= 2) {
    const a = withStubs[0];
    const b = withStubs[1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dy === 0 && dx !== 0) {
      const dir = dx > 0 ? 1 : -1;
      const desiredX = dir > 0 ? sourceRect.x + sourceRect.w + stub : sourceRect.x - stub;
      const stubX = dir > 0 ? Math.max(desiredX, b.x) : Math.min(desiredX, b.x);
      const stubPoint = { x: stubX, y: a.y };
      if (stubPoint.x !== a.x) {
        withStubs.splice(1, 0, stubPoint);
      }
      const next = withStubs[2];
      if (next && next.y === a.y) {
        next.x = dir > 0 ? Math.max(next.x, stubPoint.x) : Math.min(next.x, stubPoint.x);
      }
    } else if (dx === 0 && dy !== 0) {
      const dir = dy > 0 ? 1 : -1;
      const desiredY = dir > 0 ? sourceRect.y + sourceRect.h + stub : sourceRect.y - stub;
      const stubY = dir > 0 ? Math.max(desiredY, b.y) : Math.min(desiredY, b.y);
      const stubPoint = { x: a.x, y: stubY };
      if (stubPoint.y !== a.y) {
        withStubs.splice(1, 0, stubPoint);
      }
      const next = withStubs[2];
      if (next && next.x === a.x) {
        next.y = dir > 0 ? Math.max(next.y, stubPoint.y) : Math.min(next.y, stubPoint.y);
      }
    }
  }

  if (withStubs.length >= 3) {
    const last = withStubs.length - 1;
    const a = withStubs[last - 1];
    const b = withStubs[last];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dy === 0 && dx !== 0) {
      const dir = dx > 0 ? 1 : -1;
      const desiredX = dir > 0 ? targetRect.x - stub : targetRect.x + targetRect.w + stub;
      const stubX = dir > 0 ? Math.min(desiredX, a.x) : Math.max(desiredX, a.x);
      const stubPoint = { x: stubX, y: b.y };
      if (stubPoint.x !== b.x) {
        withStubs.splice(last, 0, stubPoint);
      }
      const preIndex = withStubs.length - 3;
      const pre = withStubs[preIndex];
      if (pre) {
        const oldX = pre.x;
        pre.x = stubPoint.x;
        if (preIndex - 1 >= 0 && withStubs[preIndex - 1].x === oldX) {
          withStubs[preIndex - 1].x = stubPoint.x;
        }
      }
    } else if (dx === 0 && dy !== 0) {
      const dir = dy > 0 ? 1 : -1;
      const desiredY = dir > 0 ? targetRect.y - stub : targetRect.y + targetRect.h + stub;
      const stubY = dir > 0 ? Math.min(desiredY, a.y) : Math.max(desiredY, a.y);
      const stubPoint = { x: b.x, y: stubY };
      if (stubPoint.y !== b.y) {
        withStubs.splice(last, 0, stubPoint);
      }
      const preIndex = withStubs.length - 3;
      const pre = withStubs[preIndex];
      if (pre) {
        const oldY = pre.y;
        pre.y = stubPoint.y;
        if (preIndex - 1 >= 0 && withStubs[preIndex - 1].y === oldY) {
          withStubs[preIndex - 1].y = stubPoint.y;
        }
      }
    }
  }

  return simplifyPolyline(withStubs);
}

function buildPath(points: BrowserRoutingPoint[]): string {
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildLabelPosition(points: BrowserRoutingPoint[]): BrowserRoutingPoint {
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

function preferredAxisFromSide(side: BrowserEdgeRoutingInput['preferredStartSide']): BrowserRoutingAxis {
  return side === 'left' || side === 'right' ? 'h' : 'v';
}

export function buildBrowserEdgeRoute(input: BrowserEdgeRoutingInput, options?: BrowserEdgeRouteBuildOptions): BrowserBuiltEdgeRoute {
  const useOrthogonalRouting = options?.orthogonalRouting ?? true;
  const rawPoints = useOrthogonalRouting
    ? orthogonalAutoPolyline(input, {
        preferStartAxis: preferredAxisFromSide(input.preferredStartSide),
        preferEndAxis: preferredAxisFromSide(input.preferredEndSide),
        gridSize: options?.gridSize ?? 20,
        laneOffset: options?.laneOffset,
        laneSpacing: options?.laneSpacing ?? 16,
        obstacleMargin: options?.obstacleMargin ?? 10,
        maxChannelShiftSteps: options?.maxChannelShiftSteps ?? 12,
      })
    : [input.defaultStart, input.defaultEnd];
  const points = useOrthogonalRouting
    ? adjustOrthogonalConnectionEndpoints(rawPoints, input, { stubLength: options?.endpointStubLength ?? 10 })
    : rawPoints;

  return {
    kind: points.length > 2 ? 'polyline' : 'straight',
    points,
    path: buildPath(points),
    labelPosition: buildLabelPosition(points),
  };
}
