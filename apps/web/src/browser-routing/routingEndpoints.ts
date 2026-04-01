import type { BrowserEdgeRoutingInput, BrowserRoutingAnchorSide, BrowserRoutingPoint } from './types';
import { anchorOnRect, Rect, simplifyPolyline } from './geometry';

export function adjustOrthogonalConnectionEndpoints(
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
