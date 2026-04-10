import type { BrowserViewApplicationCore } from './useBrowserViewPageSections';

/**
 * Pure page-section mapping policy for BrowserView.
 *
 * Keep BrowserView page-section assembly here so the application-layer hook only
 * orchestrates controller state and invokes a deterministic mapper.
 */
export function buildBrowserViewPageSections(controller: BrowserViewApplicationCore) {
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
