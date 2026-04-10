import { avoidBrowserCanvasCollisions } from '../../browser-canvas-placement/stage';
import type { BrowserCanvasNode } from '../../browser-graph/contracts';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from '../core/config';
import type { BrowserAutoLayoutRequest } from '../core/types';

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
