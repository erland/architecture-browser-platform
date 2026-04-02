import { createBrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import type { BrowserAutoLayoutRequest, BrowserAutoLayoutResult } from '../../core/types';
import type { BrowserAutoLayoutStrategy } from '../../core/pipeline';
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
