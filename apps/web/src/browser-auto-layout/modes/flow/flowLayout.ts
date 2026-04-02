import { getBrowserAutoLayoutConfig } from '../../core/config';
import { extractBrowserAutoLayoutGraph } from '../../shared/graph';
import type { BrowserAutoLayoutPipelineContext, BrowserAutoLayoutStrategy } from '../../core/pipeline';
import { runBrowserFlowAutoLayoutWithContext } from './flowLayoutSupport';
import type { BrowserAutoLayoutGraph, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';

export const runBrowserFlowAutoLayoutStrategy: BrowserAutoLayoutStrategy = {
  mode: 'flow',
  run: runBrowserFlowAutoLayoutWithContext,
};

export function runBrowserFlowAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const resolvedGraph = graph ?? extractBrowserAutoLayoutGraph(request);
  const context: BrowserAutoLayoutPipelineContext = {
    request,
    config,
    graph: resolvedGraph,
    mode: 'flow',
  };
  return runBrowserFlowAutoLayoutWithContext(context);
}
