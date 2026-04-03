import { createBrowserAutoLayoutModeEngine } from '../shared/modeEngine';
import type { BrowserAutoLayoutGraph, BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';
import { runBrowserStructureAutoLayoutWithContext } from './structureLayoutSupport';

export const browserStructureAutoLayoutModeEngine = createBrowserAutoLayoutModeEngine(
  'structure',
  runBrowserStructureAutoLayoutWithContext,
);

export const runBrowserStructureAutoLayoutStrategy = browserStructureAutoLayoutModeEngine.strategy;

export function runBrowserStructureAutoLayout(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutResult {
  return browserStructureAutoLayoutModeEngine.run(request, graph);
}
