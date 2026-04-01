import { runBrowserFlowAutoLayoutStrategy } from './flowLayout';
import { runBrowserBalancedAutoLayoutStrategy } from './balancedLayout';
import { runBrowserHierarchyAutoLayoutStrategy } from './hierarchyLayout';
import { runBrowserAutoLayoutPipeline } from './pipeline';
import { runBrowserStructureAutoLayoutStrategy } from './structureLayout';
import { logBrowserAutoLayoutRun } from './debug';
import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from './types';

const BROWSER_AUTO_LAYOUT_STRATEGIES = [
  runBrowserStructureAutoLayoutStrategy,
  runBrowserBalancedAutoLayoutStrategy,
  runBrowserFlowAutoLayoutStrategy,
  runBrowserHierarchyAutoLayoutStrategy,
] as const;

export function runBrowserAutoLayout(request: BrowserAutoLayoutRequest): BrowserAutoLayoutResult {
  const result = runBrowserAutoLayoutPipeline(request, BROWSER_AUTO_LAYOUT_STRATEGIES);
  logBrowserAutoLayoutRun(request, result);
  return result;
}
