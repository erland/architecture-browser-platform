import { applyBrowserAutoLayoutNodes } from './apply';
import { getBrowserAutoLayoutConfig } from './config';
import { extractBrowserAutoLayoutGraph } from './graph';
import { runBrowserFlowAutoLayout } from './flowLayout';
import { runBrowserHierarchyAutoLayout } from './hierarchyLayout';
import { runBrowserStructureAutoLayout } from './structureLayout';
import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from './types';

export function runBrowserAutoLayout(request: BrowserAutoLayoutRequest): BrowserAutoLayoutResult {
  const config = getBrowserAutoLayoutConfig(request);
  const graph = extractBrowserAutoLayoutGraph(request);
  const mode = request.mode ?? config.defaultMode;

  const result = mode === 'flow'
    ? runBrowserFlowAutoLayout(request, graph)
    : mode === 'hierarchy'
      ? runBrowserHierarchyAutoLayout(request, graph)
      : runBrowserStructureAutoLayout(request, graph);

  return {
    ...result,
    nodes: applyBrowserAutoLayoutNodes(request.nodes, result.nodes),
  };
}
