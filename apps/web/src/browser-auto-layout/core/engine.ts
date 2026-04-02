import { runBrowserFlowAutoLayoutStrategy } from '../modes/flow/flowLayout';
import { runBrowserBalancedAutoLayoutStrategy } from '../modes/balanced/balancedLayout';
import { runBrowserHierarchyAutoLayoutStrategy } from '../modes/hierarchy/hierarchyLayout';
import { runBrowserAutoLayoutPipeline } from './pipeline';
import { runBrowserStructureAutoLayoutStrategy } from '../modes/structure/structureLayout';
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
