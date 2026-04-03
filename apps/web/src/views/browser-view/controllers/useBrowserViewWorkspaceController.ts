import {
  useBrowserViewWorkspaceComposition,
  useBrowserViewWorkspaceState,
} from './internal';

/**
 * Owns workspace, repository, snapshot, and startup orchestration for BrowserView.
 *
 * Keep this controller as a composition layer only. Workspace selection, browser
 * session access, and workspace loading should stay in the workspace-state hook,
 * while derived labels and startup/source-tree/repository workflows should stay
 * in the workspace-composition hook.
 */
export function useBrowserViewWorkspaceController() {
  const workspace = useBrowserViewWorkspaceState();
  const composition = useBrowserViewWorkspaceComposition(workspace);

  return {
    selection: workspace.selection,
    browserSession: workspace.browserSession,
    browserLayout: workspace.browserLayout,
    workspaceData: workspace.workspaceData,
    derivedState: composition.derivedState,
    startup: composition.startup,
    sourceTreeController: composition.sourceTreeController,
    repositoryActions: composition.repositoryActions,
    handlers: composition.handlers,
  };
}

export type BrowserViewWorkspaceController = ReturnType<typeof useBrowserViewWorkspaceController>;
