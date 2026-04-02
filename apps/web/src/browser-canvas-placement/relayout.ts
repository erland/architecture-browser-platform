import { BROWSER_SCOPE_NODE_SIZE } from '../browser-graph/canvas';
import { PEER_SPACING_X, PEER_SPACING_Y } from '../browser-graph/canvas';
import type { BrowserCanvasEdge, BrowserCanvasNode } from '../browser-session';
import { type BrowserCanvasPlacementOptions } from './types';
import { avoidBrowserCanvasCollisions, isAnchoredCanvasNode } from './collision';
import { placeAppendedCanvasNode } from './initialPlacement';
import { placeCanvasNodeNearAnchor } from './incrementalPlacement';
import { cleanupArrangedCanvasNodes } from './postLayoutCleanup';

export function arrangeCanvasNodesInGrid(nodes: BrowserCanvasNode[], options?: BrowserCanvasPlacementOptions): BrowserCanvasNode[] {
  const fixedNodes = nodes
    .filter((node) => isAnchoredCanvasNode(node))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  const movableScopeNodes = nodes
    .filter((node) => node.kind === 'scope' && !isAnchoredCanvasNode(node))
    .sort((left, right) => left.id.localeCompare(right.id));
  const movableEntityNodes = nodes
    .filter((node) => node.kind === 'entity' && !isAnchoredCanvasNode(node))
    .sort((left, right) => left.id.localeCompare(right.id));

  let arranged: BrowserCanvasNode[] = fixedNodes.map((node) => ({ ...node }));
  for (const [index, node] of movableScopeNodes.entries()) {
    const placement = avoidBrowserCanvasCollisions(arranged, 'scope', {
      x: 56,
      y: 64 + index * 132,
    }, options);
    arranged = [...arranged, {
      ...node,
      ...placement,
      manuallyPlaced: false,
    }];
  }

  const visibleScopeNodes = arranged.filter((node) => node.kind === 'scope');
  const fallbackEntityStartX = visibleScopeNodes.length > 0
    ? Math.max(...visibleScopeNodes.map((node) => node.x + BROWSER_SCOPE_NODE_SIZE.width)) + 60
    : 96;
  const columnCount = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(Math.max(movableEntityNodes.length, 1)))));
  const entityStartY = 96;
  for (const [index, node] of movableEntityNodes.entries()) {
    const placement = avoidBrowserCanvasCollisions(arranged, 'entity', {
      x: fallbackEntityStartX + (index % columnCount) * PEER_SPACING_X,
      y: entityStartY + Math.floor(index / columnCount) * PEER_SPACING_Y,
    }, options);
    arranged = [...arranged, {
      ...node,
      ...placement,
      manuallyPlaced: false,
    }];
  }

  const merged = nodes.map((node) => arranged.find((candidate) => candidate.kind === node.kind && candidate.id === node.id) ?? { ...node });
  return options?.state?.routingLayoutConfig.features.postLayoutCleanup === false
    ? merged
    : cleanupArrangedCanvasNodes(merged, options);
}

export function arrangeCanvasNodesAroundEntityFocus(
  nodes: BrowserCanvasNode[],
  edges: BrowserCanvasEdge[],
  focusEntityId: string,
  options?: BrowserCanvasPlacementOptions,
): BrowserCanvasNode[] {
  const focusNode = nodes.find((node) => node.kind === 'entity' && node.id === focusEntityId);
  if (!focusNode) {
    return arrangeCanvasNodesInGrid(nodes, options);
  }

  const fixedNodes = nodes
    .filter((node) => isAnchoredCanvasNode(node))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  const movableScopeNodes = nodes
    .filter((node) => node.kind === 'scope' && !isAnchoredCanvasNode(node))
    .sort((left, right) => left.id.localeCompare(right.id));

  let arranged: BrowserCanvasNode[] = fixedNodes.map((node) => ({ ...node }));
  for (const [index, node] of movableScopeNodes.entries()) {
    const placement = avoidBrowserCanvasCollisions(arranged, 'scope', {
      x: 56,
      y: 64 + index * 132,
    }, options);
    arranged = [...arranged, {
      ...node,
      ...placement,
      manuallyPlaced: false,
    }];
  }

  const focusPlaced: BrowserCanvasNode = isAnchoredCanvasNode(focusNode)
    ? { ...focusNode }
    : {
        ...focusNode,
        ...avoidBrowserCanvasCollisions(arranged, 'entity', { x: 560, y: 280 }, options),
        manuallyPlaced: false,
      };

  if (!arranged.some((node) => node.kind === 'entity' && node.id === focusEntityId)) {
    arranged = [...arranged, focusPlaced];
  }

  const inboundIds = new Set(edges.filter((edge) => edge.toEntityId === focusEntityId).map((edge) => edge.fromEntityId));
  const outboundIds = new Set(edges.filter((edge) => edge.fromEntityId === focusEntityId).map((edge) => edge.toEntityId));

  const remainingEntityNodes = nodes
    .filter((node) => node.kind === 'entity' && node.id !== focusEntityId && !isAnchoredCanvasNode(node))
    .sort((left, right) => left.id.localeCompare(right.id));

  const inboundNodes = remainingEntityNodes.filter((node) => inboundIds.has(node.id) && !outboundIds.has(node.id));
  const outboundNodes = remainingEntityNodes.filter((node) => outboundIds.has(node.id) && !inboundIds.has(node.id));
  const mixedNodes = remainingEntityNodes.filter((node) => inboundIds.has(node.id) && outboundIds.has(node.id));
  const otherNodes = remainingEntityNodes.filter((node) => !inboundIds.has(node.id) && !outboundIds.has(node.id));

  for (const [index, node] of inboundNodes.entries()) {
    const placement = placeCanvasNodeNearAnchor(arranged, 'entity', focusPlaced, index, inboundNodes.length, 'left', options);
    arranged = [...arranged, { ...node, ...placement, manuallyPlaced: false }];
  }
  for (const [index, node] of outboundNodes.entries()) {
    const placement = placeCanvasNodeNearAnchor(arranged, 'entity', focusPlaced, index, outboundNodes.length, 'right', options);
    arranged = [...arranged, { ...node, ...placement, manuallyPlaced: false }];
  }
  for (const [index, node] of mixedNodes.entries()) {
    const placement = placeCanvasNodeNearAnchor(arranged, 'entity', focusPlaced, index, mixedNodes.length, 'around', options);
    arranged = [...arranged, { ...node, ...placement, manuallyPlaced: false }];
  }
  for (const [index, node] of otherNodes.entries()) {
    const placement = placeAppendedCanvasNode(arranged, 'entity', index, options);
    arranged = [...arranged, { ...node, ...placement, manuallyPlaced: false }];
  }

  const merged = nodes.map((node) => arranged.find((candidate) => candidate.kind === node.kind && candidate.id === node.id) ?? { ...node });
  return options?.state?.routingLayoutConfig.features.postLayoutCleanup === false
    ? merged
    : cleanupArrangedCanvasNodes(merged, options);
}
