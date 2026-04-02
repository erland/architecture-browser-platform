/**
 * Coordinates BrowserView page composition by delegating to cohesive feature
 * controllers. Workspace/startup, canvas/search, and dialog/saved-canvas wiring
 * are grouped so this hook remains a thin composition boundary.
 */
import { type BrowserViewProps } from './browserView.shared';
import {
  useBrowserViewCanvasController,
  useBrowserViewDialogController,
  useBrowserViewWorkspaceController,
} from './controllers';

export type BrowserViewScreenController = ReturnType<typeof useBrowserViewScreenController>;

export function useBrowserViewScreenController(_: BrowserViewProps) {
  const workspace = useBrowserViewWorkspaceController();
  const canvas = useBrowserViewCanvasController({
    browserSession: workspace.browserSession,
    browserLayout: workspace.browserLayout,
  });
  const dialog = useBrowserViewDialogController({
    browserSession: workspace.browserSession,
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
    derivedState: workspace.derivedState,
    sourceTreeController: workspace.sourceTreeController,
  });

  return {
    browserActions: canvas.browserActions,
    browserLayout: workspace.browserLayout,
    browserSession: workspace.browserSession,
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
    selectedSnapshot: workspace.derivedState.selectedSnapshot,
    selectedRepository: workspace.derivedState.selectedRepository,
    sourceTreeLauncherItems: workspace.sourceTreeController.sourceTreeLauncherItems,
    activeTabMeta: workspace.derivedState.activeTabMeta,
    repositoryLabel: workspace.derivedState.repositoryLabel,
    selectedScopeLabel: workspace.derivedState.selectedScopeLabel,
    selectedSnapshotLabel: workspace.derivedState.selectedSnapshotLabel,
    activeViewpointLabel: workspace.derivedState.activeViewpointLabel,
    startup: {
      shouldShowGate: workspace.startup.shouldShowGate,
      gateMessage: workspace.startup.gateMessage,
    },
    dialogs: dialog.dialogs,
    search: canvas.search,
    savedCanvas: dialog.savedCanvas,
    handlers: workspace.handlers,
  };
}
