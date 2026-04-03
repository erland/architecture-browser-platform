import { createBrowserAutoLayoutModeEngine } from '../shared/modeEngine';
import type { BrowserAutoLayoutGraph, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';
import { runBrowserFlowAutoLayoutWithContext } from './flowLayoutSupport';

export const browserFlowAutoLayoutModeEngine = createBrowserAutoLayoutModeEngine(
  'flow',
  runBrowserFlowAutoLayoutWithContext,
);

export const runBrowserFlowAutoLayoutStrategy = browserFlowAutoLayoutModeEngine.strategy;

export function runBrowserFlowAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  return browserFlowAutoLayoutModeEngine.run(request, graph);
}
