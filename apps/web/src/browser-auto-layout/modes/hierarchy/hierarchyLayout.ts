import { getBrowserAutoLayoutConfig } from '../../core/config';
import { extractBrowserAutoLayoutGraph } from '../../shared/graph';
import { runBrowserHierarchyAutoLayoutWithContext } from './hierarchyLayoutSupport';
import type { BrowserAutoLayoutPipelineContext, BrowserAutoLayoutStrategy } from '../../core/pipeline';
import type { BrowserAutoLayoutGraph, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';

export const runBrowserHierarchyAutoLayoutStrategy: BrowserAutoLayoutStrategy = {
  mode: 'hierarchy',
  run: runBrowserHierarchyAutoLayoutWithContext,
};

export function runBrowserHierarchyAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const effectiveGraph = graph ?? extractBrowserAutoLayoutGraph(request);
  const context: BrowserAutoLayoutPipelineContext = {
    request,
    config,
    graph: effectiveGraph,
    mode: 'hierarchy',
  };
  return runBrowserHierarchyAutoLayoutWithContext(context);
}
