import { APPEND_CLUSTER_GAP, COLLISION_MARGIN, PEER_SPACING_X, PEER_SPACING_Y } from '../../browser-graph/canvas';
import { BROWSER_ENTITY_NODE_SIZE, getProjectionAwareCanvasNodeSize } from '../../browser-graph';
import type { BrowserCanvasNode } from '../../browser-session';
import type { BrowserAutoLayoutMode, BrowserAutoLayoutRequest } from './types';

export type BrowserAutoLayoutCleanupIntensity = 'none' | 'basic' | 'compact';

export type BrowserAutoLayoutConfig = {
  defaultMode: BrowserAutoLayoutMode;
  horizontalSpacing: number;
  verticalSpacing: number;
  componentSpacing: number;
  maxBreadth: number;
  pinnedNodesAreHardAnchors: boolean;
  manualNodesAreHardAnchors: boolean;
  cleanupIntensity: BrowserAutoLayoutCleanupIntensity;
  enableOrderingHeuristics: boolean;
};

export const DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG: BrowserAutoLayoutConfig = {
  defaultMode: 'structure',
  horizontalSpacing: Math.max(196 + 24, PEER_SPACING_X - 4),
  verticalSpacing: PEER_SPACING_Y,
  componentSpacing: APPEND_CLUSTER_GAP,
  maxBreadth: 6,
  pinnedNodesAreHardAnchors: true,
  manualNodesAreHardAnchors: true,
  cleanupIntensity: 'basic',
  enableOrderingHeuristics: true,
};

export function resolveBrowserAutoLayoutConfig(
  overrides?: Partial<BrowserAutoLayoutConfig>,
): BrowserAutoLayoutConfig {
  return {
    ...DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG,
    ...overrides,
    horizontalSpacing: sanitizePositiveNumber(overrides?.horizontalSpacing, DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG.horizontalSpacing),
    verticalSpacing: sanitizePositiveNumber(overrides?.verticalSpacing, DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG.verticalSpacing),
    componentSpacing: sanitizePositiveNumber(overrides?.componentSpacing, DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG.componentSpacing),
    maxBreadth: sanitizePositiveInteger(overrides?.maxBreadth, DEFAULT_BROWSER_AUTO_LAYOUT_CONFIG.maxBreadth),
  };
}

function sanitizePositiveNumber(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && (value ?? 0) > 0 ? Math.round(value as number) : fallback;
}

function sanitizePositiveInteger(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && (value ?? 0) >= 1 ? Math.max(1, Math.round(value as number)) : fallback;
}

export function getBrowserAutoLayoutConfig(request: BrowserAutoLayoutRequest): BrowserAutoLayoutConfig {
  const resolved = resolveBrowserAutoLayoutConfig(request.config);
  const sizingState = request.state ?? request.options?.state ?? null;
  const maxNodeWidth = request.nodes.reduce<number>((current, node) => Math.max(
    current,
    getProjectionAwareCanvasNodeSize(sizingState, { kind: node.kind, id: node.id }).width,
  ), BROWSER_ENTITY_NODE_SIZE.width);
  const baselineHorizontalGap = Math.max(COLLISION_MARGIN, resolved.horizontalSpacing - BROWSER_ENTITY_NODE_SIZE.width);
  return {
    ...resolved,
    horizontalSpacing: Math.max(resolved.horizontalSpacing, maxNodeWidth + baselineHorizontalGap),
  };
}

export function isHardAnchorCanvasNode(node: Pick<BrowserCanvasNode, 'pinned' | 'manuallyPlaced'>, config: BrowserAutoLayoutConfig) {
  return (config.pinnedNodesAreHardAnchors && Boolean(node.pinned))
    || (config.manualNodesAreHardAnchors && Boolean(node.manuallyPlaced));
}

export function getWrappedBandOffset(index: number, config: BrowserAutoLayoutConfig) {
  const safeBreadth = Math.max(1, config.maxBreadth);
  return {
    wrapGroup: Math.floor(index / safeBreadth),
    indexInGroup: index % safeBreadth,
  };
}
