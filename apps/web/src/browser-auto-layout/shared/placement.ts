import { avoidBrowserCanvasCollisions, getNodeSize } from '../../browser-canvas-placement/stage';
import type { BrowserCanvasNode } from '../../browser-session/types';
import type { BrowserCanvasPlacement, BrowserCanvasPlacementOptions } from '../../browser-canvas-placement/stage';

function rectanglesOverlap(
  a: Pick<BrowserCanvasNode, 'kind' | 'id' | 'x' | 'y'>,
  b: Pick<BrowserCanvasNode, 'kind' | 'id' | 'x' | 'y'>,
  options?: BrowserCanvasPlacementOptions,
) {
  const aSize = getNodeSize(a, options);
  const bSize = getNodeSize(b, options);
  const margin = 24;
  return !(
    a.x + aSize.width + margin <= b.x ||
    b.x + bSize.width + margin <= a.x ||
    a.y + aSize.height + margin <= b.y ||
    b.y + bSize.height + margin <= a.y
  );
}

export function placeBrowserAutoLayoutNode(
  nodes: BrowserCanvasNode[],
  original: BrowserCanvasNode,
  desired: BrowserCanvasPlacement,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  const exactCandidate = {
    kind: original.kind,
    id: original.id,
    x: Math.max(24, desired.x),
    y: Math.max(24, desired.y),
  } as const;

  if (!nodes.some((node) => rectanglesOverlap(node, exactCandidate, options))) {
    return { x: exactCandidate.x, y: exactCandidate.y };
  }

  return avoidBrowserCanvasCollisions(nodes, original.kind, desired, options);
}
