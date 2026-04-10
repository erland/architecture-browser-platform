import type { BrowserCanvasNode } from '../../browser-graph/contracts';
import type { BrowserAutoLayoutNode } from './types';

export function applyBrowserAutoLayoutNodes(
  originalNodes: BrowserCanvasNode[],
  arrangedNodes: BrowserCanvasNode[],
): BrowserCanvasNode[] {
  const arrangedByKey = new Map<string, BrowserCanvasNode>();
  for (const node of arrangedNodes) {
    arrangedByKey.set(`${node.kind}:${node.id}`, node);
  }
  return originalNodes.map((node) => arrangedByKey.get(`${node.kind}:${node.id}`) ?? { ...node });
}

export function getAnchoredBrowserAutoLayoutNodes(nodes: BrowserAutoLayoutNode[]): BrowserAutoLayoutNode[] {
  return nodes
    .filter((node) => node.pinned || node.manuallyPlaced)
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
}
