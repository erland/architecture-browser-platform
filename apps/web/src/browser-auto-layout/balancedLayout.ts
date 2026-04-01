import { createBrowserAutoLayoutPipelineContext } from './pipeline';
import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from './types';
import type { BrowserAutoLayoutStrategy } from './pipeline';
import { runBrowserBalancedAutoLayoutWithContext } from './balancedLayoutSupport';

export const runBrowserBalancedAutoLayoutStrategy: BrowserAutoLayoutStrategy = {
  mode: 'balanced',
  run: runBrowserBalancedAutoLayoutWithContext,
};

export function runBrowserBalancedAutoLayout(
  request: Omit<BrowserAutoLayoutRequest, 'mode'>,
): BrowserAutoLayoutResult {
  const context = createBrowserAutoLayoutPipelineContext({
    ...request,
    mode: 'balanced',
  });
  return runBrowserBalancedAutoLayoutWithContext(context);
}
