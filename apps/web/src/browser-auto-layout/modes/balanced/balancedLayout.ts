import { createBrowserAutoLayoutModeEngine } from '../shared/modeEngine';
import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';
import { runBrowserBalancedAutoLayoutWithContext } from './balancedLayoutSupport';

export const browserBalancedAutoLayoutModeEngine = createBrowserAutoLayoutModeEngine(
  'balanced',
  runBrowserBalancedAutoLayoutWithContext,
);

export const runBrowserBalancedAutoLayoutStrategy = browserBalancedAutoLayoutModeEngine.strategy;

export function runBrowserBalancedAutoLayout(
  request: Omit<BrowserAutoLayoutRequest, 'mode'>,
): BrowserAutoLayoutResult {
  return browserBalancedAutoLayoutModeEngine.run({
    ...request,
    mode: 'balanced',
  });
}
