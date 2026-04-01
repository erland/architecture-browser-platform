import { getBrowserAutoLayoutConfig } from './config';
import { extractBrowserAutoLayoutGraph } from './graph';
import type { BrowserAutoLayoutPipelineContext, BrowserAutoLayoutStrategy } from './pipeline';
import { runBrowserStructureAutoLayoutWithContext } from './structureLayoutSupport';
import type { BrowserAutoLayoutGraph, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from './types';

export const runBrowserStructureAutoLayoutStrategy: BrowserAutoLayoutStrategy = {
  mode: 'structure',
  run: runBrowserStructureAutoLayoutWithContext,
};

export function runBrowserStructureAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const resolvedGraph = graph ?? extractBrowserAutoLayoutGraph(request);
  const context: BrowserAutoLayoutPipelineContext = {
    request,
    config,
    graph: resolvedGraph,
    mode: 'structure',
  };
  return runBrowserStructureAutoLayoutWithContext(context);
}
