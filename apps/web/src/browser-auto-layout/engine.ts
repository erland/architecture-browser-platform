import { runBrowserFlowAutoLayoutStrategy } from './flowLayout';
import { runBrowserHierarchyAutoLayoutStrategy } from './hierarchyLayout';
import { runBrowserAutoLayoutPipeline } from './pipeline';
import { runBrowserStructureAutoLayoutStrategy } from './structureLayout';
import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from './types';

const BROWSER_AUTO_LAYOUT_STRATEGIES = [
  runBrowserStructureAutoLayoutStrategy,
  runBrowserFlowAutoLayoutStrategy,
  runBrowserHierarchyAutoLayoutStrategy,
] as const;

export function runBrowserAutoLayout(request: BrowserAutoLayoutRequest): BrowserAutoLayoutResult {
  return runBrowserAutoLayoutPipeline(request, BROWSER_AUTO_LAYOUT_STRATEGIES);
}
