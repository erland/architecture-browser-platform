/**
 * BrowserView screen application layer.
 *
 * This hook composes the feature controllers that drive the Browser screen and
 * exposes one application-facing controller object for the page shell.
 */
import { type BrowserViewProps } from '../browserView.shared';
import {
  useBrowserViewCanvasController,
  useBrowserViewDialogController,
  useBrowserViewWorkspaceController,
} from '../controllers';
import {
  useBrowserViewPageSections,
  type BrowserViewApplicationCore,
  type BrowserViewPageSections,
} from './useBrowserViewPageSections';

export type BrowserViewApplicationController = BrowserViewApplicationCore & {
  page: BrowserViewPageSections;
};

export function useBrowserViewApplicationController(_: BrowserViewProps): BrowserViewApplicationController {
  const workspace = useBrowserViewWorkspaceController();
  const canvas = useBrowserViewCanvasController({
    browserSession: workspace.browserSession,
    browserLayout: workspace.browserLayout,
  });
  const dialogs = useBrowserViewDialogController({
    browserSession: workspace.browserSession,
    selection: workspace.selection,
    workspaceData: workspace.workspaceData,
    derivedState: workspace.derivedState,
    sourceTreeController: workspace.sourceTreeController,
  });

  const controller: BrowserViewApplicationCore = {
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
    dialogs: dialogs.dialogs,
    search: canvas.search,
    savedCanvas: dialogs.savedCanvas,
    handlers: workspace.handlers,
  };

  return {
    ...controller,
    page: useBrowserViewPageSections(controller),
  };
}
