import { cleanupArrangedCanvasNodes } from '../../browser-canvas-placement/stage';
import type { BrowserCanvasNode } from '../../browser-session/types';
import { getInitialEntityOrigin } from './layoutShared';
import { placeScopeNodes } from './layoutScopePlacement';
import type { BrowserAutoLayoutMode, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../core/types';
import type { BrowserAutoLayoutPipelineContext } from '../core/pipeline';

type CreatePlacementBaselineResult = {
  arranged: BrowserCanvasNode[];
  initialOrigin: { x: number; y: number };
};

export function createAutoLayoutPlacementBaseline(request: BrowserAutoLayoutRequest): CreatePlacementBaselineResult {
  const arranged = placeScopeNodes(request.nodes, [], request);
  return {
    arranged,
    initialOrigin: getInitialEntityOrigin(arranged),
  };
}

export function mergeArrangedNodesWithRequestNodes(
  request: BrowserAutoLayoutRequest,
  arranged: BrowserCanvasNode[],
): BrowserCanvasNode[] {
  const arrangedByKey = new Map(arranged.map((node) => [`${node.kind}:${node.id}`, node]));
  return request.nodes.map((node) => arrangedByKey.get(`${node.kind}:${node.id}`) ?? { ...node });
}

type BuildAutoLayoutResultOptions = {
  cleanupMode?: 'standard' | 'compact-only';
};

export function buildAutoLayoutResult(
  context: BrowserAutoLayoutPipelineContext,
  mode: BrowserAutoLayoutMode,
  arranged: BrowserCanvasNode[],
  options: BuildAutoLayoutResultOptions = {},
): BrowserAutoLayoutResult {
  const cleanupMode = options.cleanupMode ?? 'standard';
  const { request, config } = context;
  const nodes = cleanupMode === 'compact-only'
    ? (config.cleanupIntensity === 'compact'
      ? cleanupArrangedCanvasNodes(arranged, request.options, config.cleanupIntensity)
      : arranged.map((node) => ({ ...node })))
    : (() => {
      const merged = mergeArrangedNodesWithRequestNodes(request, arranged);
      return request.options?.state?.routingLayoutConfig.features.postLayoutCleanup === false || config.cleanupIntensity === 'none'
        ? merged
        : cleanupArrangedCanvasNodes(merged, request.options, config.cleanupIntensity);
    })();

  return {
    mode,
    canvasLayoutMode: mode,
    nodes,
  };
}
