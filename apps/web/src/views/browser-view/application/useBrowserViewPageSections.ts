import type {
  useBrowserViewCanvasController,
  useBrowserViewDialogController,
  useBrowserViewWorkspaceController,
} from '../controllers';

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
 * renders UI sections. It keeps section prop assembly out of `BrowserView.tsx`
 * so the page shell remains a thin composition layer.
 */
export function useBrowserViewPageSections(controller: BrowserViewApplicationCore) {
  const {
    browserActions,
    browserLayout,
    browserSession,
    dialogs,
    search,
    workspaceData,
    selectedSnapshot,
    sourceTreeLauncherItems,
    activeTabMeta,
    repositoryLabel,
    selectedScopeLabel,
    selectedSnapshotLabel,
    activeViewpointLabel,
    startup,
    savedCanvas,
    handlers,
  } = controller;

  return {
    topBar: {
      search,
      onOpenSourceTreeDialog: dialogs.handleOpenSourceTreeDialog,
      onOpenSavedCanvasDialog: dialogs.openSavedCanvasDialog,
    },
    dialogs: {
      browserSession,
      dialogs,
      selectedScopeLabel,
      selectedSnapshot,
      selectedSnapshotLabel,
      sourceTreeLauncherItems,
      repositories: workspaceData.repositories,
      selectedWorkspace: workspaceData.selectedWorkspace,
      savedCanvas,
      handlers,
    },
    layout: {
      layoutStyle: browserLayout.layoutStyle,
      isRailCollapsed: browserLayout.isRailCollapsed,
      isInspectorCollapsed: browserLayout.isInspectorCollapsed,
      startPaneResize: browserLayout.startPaneResize,
      expandRail: () => browserLayout.setIsRailCollapsed(false),
      collapseRail: () => browserLayout.setIsRailCollapsed(true),
      expandInspector: () => browserLayout.setIsInspectorCollapsed(false),
      collapseInspector: () => browserLayout.setIsInspectorCollapsed(true),
      setActiveTab: browserLayout.setActiveTab,
    },
    rail: {
      browserSession,
      onAddScopeEntitiesToCanvas: browserActions.handleAddPrimaryScopeEntitiesToCanvas,
      onSelectEntity: browserActions.handleSelectEntity,
      onAddEntityToCanvas: browserActions.handleAddEntityToCanvas,
      onOpenViewpoints: dialogs.openViewpointDialog,
    },
    center: {
      activeModeLabel: activeTabMeta.label,
      browserSession,
      hasSelectedWorkspace: Boolean(workspaceData.selectedWorkspace),
      hasSelectedSnapshot: Boolean(selectedSnapshot),
      hasPreparedSession: Boolean(browserSession.state.index && browserSession.state.payload),
      sourceTreeLauncherItems,
      onSelectSourceTree: handlers.handleSelectSourceTree,
      onOpenSourceTreeDialog: dialogs.handleOpenSourceTreeDialog,
      onAddScopeAnalysis: browserActions.handleAddScopeAnalysisToCanvas,
      onAddContainedEntities: browserActions.handleAddContainedEntitiesToCanvas,
      onAddPeerEntities: browserActions.handleAddPeerEntitiesToCanvas,
    },
    inspector: {
      browserSession,
      onSetActiveTab: browserLayout.setActiveTab,
    },
    footer: {
      repositoryLabel,
      activeModeLabel: activeTabMeta.label,
      selectedScopeLabel,
      activeViewpointLabel,
      selectedSnapshotLabel,
      selectedSnapshotImportedAt: selectedSnapshot?.importedAt,
      hasPreparedSnapshot: Boolean(browserSession.state.activeSnapshot),
    },
    startup,
  };
}

export type BrowserViewPageSections = ReturnType<typeof useBrowserViewPageSections>;
