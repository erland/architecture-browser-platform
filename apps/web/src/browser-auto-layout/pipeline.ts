import { applyBrowserAutoLayoutNodes } from './apply';
import { getBrowserAutoLayoutConfig } from './config';
import { extractBrowserAutoLayoutGraph } from './graph';
import type {
  BrowserAutoLayoutConfig,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutMode,
  BrowserAutoLayoutRequest,
  BrowserAutoLayoutResult,
} from './types';

export type BrowserAutoLayoutPipelineContext = {
  request: BrowserAutoLayoutRequest;
  config: BrowserAutoLayoutConfig;
  graph: BrowserAutoLayoutGraph;
  mode: BrowserAutoLayoutMode;
};

export type BrowserAutoLayoutPipelineStageResult = Omit<BrowserAutoLayoutResult, 'nodes'> & {
  nodes: BrowserAutoLayoutRequest['nodes'];
};

export type BrowserAutoLayoutStrategy = {
  mode: BrowserAutoLayoutMode;
  run: (context: BrowserAutoLayoutPipelineContext) => BrowserAutoLayoutPipelineStageResult;
};

export function createBrowserAutoLayoutPipelineContext(request: BrowserAutoLayoutRequest): BrowserAutoLayoutPipelineContext {
  const config = getBrowserAutoLayoutConfig(request);
  const graph = extractBrowserAutoLayoutGraph(request);
  return {
    request,
    config,
    graph,
    mode: request.mode ?? config.defaultMode,
  };
}

export function finalizeBrowserAutoLayoutPipelineResult(
  context: BrowserAutoLayoutPipelineContext,
  result: BrowserAutoLayoutPipelineStageResult,
): BrowserAutoLayoutResult {
  return {
    ...result,
    nodes: applyBrowserAutoLayoutNodes(context.request.nodes, result.nodes),
  };
}

export function runBrowserAutoLayoutPipeline(
  request: BrowserAutoLayoutRequest,
  strategies: readonly BrowserAutoLayoutStrategy[],
): BrowserAutoLayoutResult {
  const context = createBrowserAutoLayoutPipelineContext(request);
  const strategy = strategies.find((candidate) => candidate.mode === context.mode) ?? strategies[0];
  const stageResult = strategy.run(context);
  return finalizeBrowserAutoLayoutPipelineResult(context, stageResult);
}
