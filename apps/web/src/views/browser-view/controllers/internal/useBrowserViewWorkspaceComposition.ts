import { useBrowserSessionBootstrap } from '../../../../hooks/useBrowserSessionBootstrap';
import type { BrowserViewWorkspaceState } from './useBrowserViewWorkspaceState';
import { useBrowserViewDerivedState } from './useBrowserViewDerivedState';
import { useBrowserViewHandlers } from './useBrowserViewHandlers';
import { useBrowserViewRepositoryActions } from './useBrowserViewRepositoryActions';
import { useBrowserViewSourceTreeController } from './useBrowserViewSourceTreeController';
import { useBrowserViewStartup } from './useBrowserViewStartup';

/**
 * Composes BrowserView workspace workflows from the shared workspace state.
 *
 * The top-level workspace controller should use this helper rather than wiring
 * bootstrap, derived labels, source-tree launchers, and repository actions
 * inline.
 */
export function useBrowserViewWorkspaceComposition(workspace: BrowserViewWorkspaceState) {
  const derivedState = useBrowserViewDerivedState({
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
    browserSession: workspace.browserSession,
    browserLayout: workspace.browserLayout,
  });

  const browserBootstrap = useBrowserSessionBootstrap({
    workspaceId: workspace.workspaceData.selectedWorkspaceId,
    repositoryId: workspace.selection.selectedRepositoryId,
    snapshot: derivedState.selectedSnapshot,
  });

  const startup = useBrowserViewStartup({
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
    browserBootstrap,
    browserSession: workspace.browserSession,
    selectedSnapshot: derivedState.selectedSnapshot,
  });

  const sourceTreeController = useBrowserViewSourceTreeController({
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
  });

  const repositoryActions = useBrowserViewRepositoryActions({
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
    setBusyMessage: workspace.setBusyMessage,
    setError: workspace.setError,
  });

  const handlers = useBrowserViewHandlers({
    sourceTreeController,
    repositoryActions,
  });

  return {
    derivedState,
    browserBootstrap,
    startup,
    sourceTreeController,
    repositoryActions,
    handlers,
  };
}

export type BrowserViewWorkspaceComposition = ReturnType<typeof useBrowserViewWorkspaceComposition>;
