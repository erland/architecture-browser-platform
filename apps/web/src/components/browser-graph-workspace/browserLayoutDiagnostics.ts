import type { BrowserWorkspaceNodeModel } from '../../browser-graph';
import type { BrowserSessionState } from '../../browser-session';
import { isBrowserAutoLayoutDebugEnabled } from '../../browser-auto-layout/debug';

type LayoutRect = {
  id: string;
  title: string;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  estimatedWidth: number;
  estimatedHeight: number;
  renderedWidth: number;
  renderedHeight: number;
};

function overlaps(a: LayoutRect, b: LayoutRect) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

export function collectRenderedBrowserLayoutRects(
  surface: HTMLElement,
  nodes: BrowserWorkspaceNodeModel[],
  state: BrowserSessionState,
): LayoutRect[] {
  const zoom = state.canvasViewport.zoom > 0 ? state.canvasViewport.zoom : 1;
  return nodes.map((node) => {
    const element = surface.querySelector<HTMLElement>(`[data-browser-node-id="${CSS.escape(node.id)}"]`);
    const rect = element?.getBoundingClientRect();
    const renderedWidth = rect ? rect.width / zoom : node.width;
    const renderedHeight = rect ? rect.height / zoom : node.height;
    return {
      id: node.id,
      title: node.title,
      kind: node.kind,
      x: node.x,
      y: node.y,
      width: Math.max(node.width, renderedWidth),
      height: Math.max(node.height, renderedHeight),
      estimatedWidth: node.width,
      estimatedHeight: node.height,
      renderedWidth,
      renderedHeight,
    };
  });
}

export function reconcileRenderedBrowserNodeClearance(
  surface: HTMLElement,
  nodes: BrowserWorkspaceNodeModel[],
  state: BrowserSessionState,
  options?: { clearance?: number },
): Array<{ kind: 'entity'; id: string; x?: number; y?: number }> {
  const rects = collectRenderedBrowserLayoutRects(surface, nodes, state);
  const canvasNodesById = new Map(state.canvasNodes.filter((node) => node.kind === 'entity').map((node) => [node.id, node] as const));
  const candidates = rects
    .filter((rect) => rect.kind !== 'scope')
    .filter((rect) => {
      const canvasNode = canvasNodesById.get(rect.id);
      return Boolean(canvasNode) && !canvasNode?.pinned && !canvasNode?.manuallyPlaced;
    })
    .sort((left, right) => left.x - right.x || left.y - right.y || left.id.localeCompare(right.id));

  const clearance = options?.clearance ?? 24;
  const accepted: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
  const updates: Array<{ kind: 'entity'; id: string; x?: number; y?: number }> = [];

  for (const rect of candidates) {
    let nextY = rect.y;
    for (const other of accepted) {
      const horizontalOverlap = Math.min(rect.x + rect.width, other.x + other.width) - Math.max(rect.x, other.x);
      if (horizontalOverlap <= 0) {
        continue;
      }
      const minimumY = other.y + other.height + clearance;
      if (nextY < minimumY) {
        nextY = minimumY;
      }
    }
    if (nextY > rect.y) {
      updates.push({ kind: 'entity', id: rect.id, y: nextY });
    }
    accepted.push({ id: rect.id, x: rect.x, y: nextY, width: rect.width, height: rect.height });
  }

  return updates;
}

export function logRenderedBrowserLayoutDiagnostics(surface: HTMLElement, nodes: BrowserWorkspaceNodeModel[], state: BrowserSessionState) {
  if (!isBrowserAutoLayoutDebugEnabled() || typeof console === 'undefined') {
    return;
  }

  const rects = collectRenderedBrowserLayoutRects(surface, nodes, state);

  const oversized = rects
    .filter((rect: LayoutRect) => rect.renderedHeight > rect.estimatedHeight || rect.renderedWidth > rect.estimatedWidth)
    .map((rect: LayoutRect) => ({
      id: rect.id,
      title: rect.title,
      kind: rect.kind,
      estimatedWidth: rect.estimatedWidth,
      estimatedHeight: rect.estimatedHeight,
      renderedWidth: rect.renderedWidth,
      renderedHeight: rect.renderedHeight,
      extraWidth: rect.renderedWidth - rect.estimatedWidth,
      extraHeight: rect.renderedHeight - rect.estimatedHeight,
    }));

  const overlapsFound: Array<Record<string, unknown>> = [];
  for (let index = 0; index < rects.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < rects.length; compareIndex += 1) {
      const left = rects[index]!;
      const right = rects[compareIndex]!;
      if (!overlaps(left, right)) {
        continue;
      }
      overlapsFound.push({
        aId: left.id,
        aTitle: left.title,
        aKind: left.kind,
        aX: left.x,
        aY: left.y,
        aWidth: left.width,
        aHeight: left.height,
        bId: right.id,
        bTitle: right.title,
        bKind: right.kind,
        bX: right.x,
        bY: right.y,
        bWidth: right.width,
        bHeight: right.height,
        horizontalOverlap: Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x),
        verticalOverlap: Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y),
      });
    }
  }

  console.groupCollapsed(`[browser-layout] rendered diagnostics nodes=${rects.length} overlaps=${overlapsFound.length} oversized=${oversized.length}`);
  console.table(rects.map((rect: LayoutRect) => ({
    id: rect.id,
    title: rect.title,
    kind: rect.kind,
    x: rect.x,
    y: rect.y,
    estimatedWidth: rect.estimatedWidth,
    estimatedHeight: rect.estimatedHeight,
    renderedWidth: rect.renderedWidth,
    renderedHeight: rect.renderedHeight,
    extraWidth: rect.renderedWidth - rect.estimatedWidth,
    extraHeight: rect.renderedHeight - rect.estimatedHeight,
  })));
  if (oversized.length > 0) {
    console.warn('[browser-layout] nodes larger after render than layout estimated');
    console.table(oversized);
  }
  if (overlapsFound.length > 0) {
    console.warn('[browser-layout] rendered node overlaps detected');
    console.table(overlapsFound);
  }
  console.groupEnd();
}
