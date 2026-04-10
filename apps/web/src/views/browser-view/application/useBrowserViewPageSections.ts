import type {
  useBrowserViewCanvasController,
  useBrowserViewDialogController,
  useBrowserViewWorkspaceController,
} from '../controllers';
import { buildBrowserViewPageSections } from './browserViewPageSectionPolicy';

export type BrowserViewApplicationCore = {
  browserActions: ReturnType<typeof useBrowserViewCanvasController>['browserActions'];
  browserLayout: ReturnType<typeof useBrowserViewWorkspaceController>['browserLayout'];
  browserSession: ReturnType<typeof useBrowserViewWorkspaceController>['browserSession'];
  selection: ReturnType<typeof useBrowserViewWorkspaceController>['selection'];
  workspaceData: ReturnType<typeof useBrowserViewWorkspaceController>['workspaceData'];
  selectedSnapshot: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['selectedSnapshot'];
  selectedRepository: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['selectedRepository'];
  sourceTreeLauncherItems: ReturnType<typeof useBrowserViewWorkspaceController>['sourceTreeController']['sourceTreeLauncherItems'];
  activeTabMeta: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['activeTabMeta'];
  repositoryLabel: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['repositoryLabel'];
  selectedScopeLabel: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['selectedScopeLabel'];
  selectedSnapshotLabel: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['selectedSnapshotLabel'];
  activeViewpointLabel: ReturnType<typeof useBrowserViewWorkspaceController>['derivedState']['activeViewpointLabel'];
  startup: {
    shouldShowGate: boolean;
    gateMessage: string;
  };
  dialogs: ReturnType<typeof useBrowserViewDialogController>['dialogs'];
  search: ReturnType<typeof useBrowserViewCanvasController>['search'];
  savedCanvas: ReturnType<typeof useBrowserViewDialogController>['savedCanvas'];
  handlers: ReturnType<typeof useBrowserViewWorkspaceController>['handlers'];
};

/**
 * Screen-level presentation mapping for BrowserView.
 *
 * This hook is the last application-layer step before the BrowserView page shell
 * renders UI sections. It delegates the deterministic section-prop mapping to a
 * pure policy function so the application layer remains composition-focused.
 */
export function useBrowserViewPageSections(controller: BrowserViewApplicationCore) {
  return buildBrowserViewPageSections(controller);
}

export type BrowserViewPageSections = ReturnType<typeof useBrowserViewPageSections>;
