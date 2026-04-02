import { useBrowserViewActions } from './internal/useBrowserViewActions';
import { useBrowserViewSearchController } from './internal/useBrowserViewSearchController';
import type { BrowserViewWorkspaceController } from './useBrowserViewWorkspaceController';

/**
 * Owns Browser canvas-facing view controllers: layout-dependent browser actions
 * and top-search behavior. BrowserView consumes this as a cohesive feature
 * controller instead of wiring each hook separately.
 */
export function useBrowserViewCanvasController({
  browserSession,
  browserLayout,
}: Pick<BrowserViewWorkspaceController, 'browserSession' | 'browserLayout'>) {
  const browserActions = useBrowserViewActions({
    browserSession,
    setActiveTab: browserLayout.setActiveTab,
    topSearchScopeMode: browserLayout.topSearchScopeMode,
  });

  const search = useBrowserViewSearchController({
    browserSession,
    browserActions,
    browserLayout,
  });

  return {
    browserActions,
    search,
  };
}

export type BrowserViewCanvasController = ReturnType<typeof useBrowserViewCanvasController>;
