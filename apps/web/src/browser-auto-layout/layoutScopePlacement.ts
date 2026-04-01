import { avoidBrowserCanvasCollisions } from '../browser-canvas-placement/collision';
import type { BrowserCanvasNode } from '../browserSessionStore.types';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from './config';
import type { BrowserAutoLayoutRequest } from './types';

export function placeScopeNodes(
  originalNodes: BrowserCanvasNode[],
  arranged: BrowserCanvasNode[],
  request: BrowserAutoLayoutRequest,
) {
  const config = getBrowserAutoLayoutConfig(request);
  const anchoredScopes = originalNodes
    .filter((node) => node.kind === 'scope' && isHardAnchorCanvasNode(node, config))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((node) => ({ ...node }));
  let nextArranged = [...arranged, ...anchoredScopes.filter((scope) => !arranged.some((node) => node.kind === 'scope' && node.id === scope.id))];

  const movableScopes = originalNodes
    .filter((node) => node.kind === 'scope' && !isHardAnchorCanvasNode(node, config))
    .sort((left, right) => left.id.localeCompare(right.id));

  for (const [index, scopeNode] of movableScopes.entries()) {
    const placement = avoidBrowserCanvasCollisions(nextArranged, 'scope', {
      x: 56,
      y: 64 + index * Math.max(96, Math.round(config.verticalSpacing * 1.15)),
    }, request.options);
    nextArranged = [...nextArranged, {
      ...scopeNode,
      ...placement,
      manuallyPlaced: false,
    }];
  }

  return nextArranged;
}
