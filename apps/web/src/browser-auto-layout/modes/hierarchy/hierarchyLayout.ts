import { createBrowserAutoLayoutModeEngine } from '../shared/modeEngine';
import type { BrowserAutoLayoutGraph, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';
import { runBrowserHierarchyAutoLayoutWithContext } from './hierarchyLayoutSupport';

export const browserHierarchyAutoLayoutModeEngine = createBrowserAutoLayoutModeEngine(
  'hierarchy',
  runBrowserHierarchyAutoLayoutWithContext,
);

export const runBrowserHierarchyAutoLayoutStrategy = browserHierarchyAutoLayoutModeEngine.strategy;

export function runBrowserHierarchyAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  return browserHierarchyAutoLayoutModeEngine.run(request, graph);
}
