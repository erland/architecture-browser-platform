import type { BrowserEdgeRoutingInput, BrowserRoutingPoint } from './types';
import { axisOfSegment, inflateRect, manhattanLength, Rect, segmentIntersectsRect, simplifyPolyline } from './geometry';
import type { BrowserRoutingAxis, BrowserOrthogonalRoutingHints } from './engine';

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

export function buildOrthogonalAutoPolyline(input: BrowserEdgeRoutingInput, hints?: BrowserOrthogonalRoutingHints): BrowserRoutingPoint[] {
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

export function preferredAxisFromSide(side: BrowserEdgeRoutingInput['preferredStartSide']): BrowserRoutingAxis {
  return side === 'left' || side === 'right' ? 'h' : 'v';
}
