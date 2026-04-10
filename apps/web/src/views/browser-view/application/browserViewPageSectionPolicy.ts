import type { BrowserGraphWorkspaceProps } from '../../../components/browser-graph-workspace/BrowserGraphWorkspace';
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

  const hasSelectedWorkspace = Boolean(workspaceData.selectedWorkspace);
  const hasSelectedSnapshot = Boolean(selectedSnapshot);
  const hasPreparedSession = Boolean(browserSession.state.index && browserSession.state.payload);

  const launcherTitle = !hasSelectedWorkspace
    ? 'Open a source tree'
    : !hasSelectedSnapshot
      ? 'Choose an indexed version to open'
      : 'Finishing Browser session preparation';

  const launcherDescription = !hasSelectedWorkspace
    ? 'Choose a previously indexed source tree or add a new one to start exploring the latest imported architecture snapshot in Browser.'
    : !hasSelectedSnapshot
      ? 'Select a source tree below or open the Source tree dialog to pick which indexed version should be loaded into Browser.'
      : 'Browser is waiting for the prepared local snapshot payload. You can select another indexed source tree or open the Source tree dialog.';

  const graphWorkspace: BrowserGraphWorkspaceProps | null = hasPreparedSession
    ? {
        state: browserSession.state,
        activeModeLabel: activeTabMeta.label,
        onShowScopeContainer: (scopeId) => {
          const focusedScopeId = browserSession.state.focusedElement?.kind === 'scope'
            ? browserSession.state.focusedElement.id
            : null;
          const targetScopeId = scopeId ?? focusedScopeId ?? browserSession.state.selectedScopeId;
          if (!targetScopeId) {
            return;
          }
          browserSession.canvas.addScopeToCanvas(targetScopeId);
          browserSession.navigation.selectScope(targetScopeId);
          browserSession.factsPanel.focusElement({ kind: 'scope', id: targetScopeId });
          browserSession.factsPanel.open('scope', 'right');
        },
        onAddScopeAnalysis: browserActions.handleAddScopeAnalysisToCanvas,
        onAddContainedEntities: browserActions.handleAddContainedEntitiesToCanvas,
        onAddPeerEntities: browserActions.handleAddPeerEntitiesToCanvas,
        onFocusScope: (scopeId) => {
          browserSession.navigation.selectScope(scopeId);
          browserSession.factsPanel.focusElement({ kind: 'scope', id: scopeId });
          browserSession.factsPanel.open('scope', 'right');
        },
        onFocusEntity: (entityId) => {
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        },
        onSelectEntity: (entityId, additive) => {
          browserSession.canvas.selectEntity(entityId, additive);
          browserSession.factsPanel.open('entity', 'right');
        },
        onFocusRelationship: (relationshipId) => {
          browserSession.factsPanel.focusElement({ kind: 'relationship', id: relationshipId });
          browserSession.factsPanel.open('relationship', 'right');
        },
        onExpandEntityDependencies: (entityId) => {
          browserSession.canvas.addDependenciesToCanvas(entityId);
          browserSession.canvas.selectEntity(entityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        },
        onExpandInboundDependencies: (entityId) => {
          browserSession.canvas.addDependenciesToCanvas(entityId, 'INBOUND');
          browserSession.canvas.selectEntity(entityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        },
        onExpandOutboundDependencies: (entityId) => {
          browserSession.canvas.addDependenciesToCanvas(entityId, 'OUTBOUND');
          browserSession.canvas.selectEntity(entityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
          browserSession.factsPanel.open('entity', 'right');
        },
        onRemoveEntity: (entityId) => browserSession.canvas.removeEntityFromCanvas(entityId),
        onRemoveSelection: browserSession.canvas.removeSelection,
        onClearSelection: browserSession.canvas.clearSelection,
        onSelectAllEntities: browserSession.canvas.selectAllEntities,
        onIsolateSelection: browserSession.canvas.isolateSelection,
        onTogglePinNode: browserSession.canvas.toggleNodePin,
        onSetClassPresentationMode: browserSession.canvas.setClassPresentationMode,
        onToggleClassPresentationMembers: browserSession.canvas.toggleClassPresentationMembers,
        onMoveCanvasNode: browserSession.canvas.moveNode,
        onReconcileCanvasNodePositions: browserSession.canvas.reconcileNodePositions,
        onSetCanvasViewport: browserSession.canvas.setViewport,
        onArrangeAllCanvasNodes: browserSession.canvas.arrangeAllNodes,
        onArrangeCanvasWithMode: browserSession.canvas.arrangeWithMode,
        onArrangeCanvasAroundFocus: browserSession.canvas.arrangeAroundFocus,
        onClearCanvas: browserSession.canvas.clear,
        onFitView: browserSession.canvas.fitView,
        onSetRelationshipRoutingMode: browserSession.canvas.setRelationshipRoutingMode,
        onReceiveTreeEntitiesDrop: (entityIds) => {
          browserSession.canvas.addEntitiesToCanvas(entityIds);
          const focusEntityId = entityIds[0];
          if (!focusEntityId) {
            return;
          }
          browserSession.canvas.selectEntity(focusEntityId);
          browserSession.factsPanel.focusElement({ kind: 'entity', id: focusEntityId });
          browserSession.factsPanel.open('entity', 'right');
        },
      }
    : null;

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
      launcher: {
        title: launcherTitle,
        description: launcherDescription,
        items: sourceTreeLauncherItems,
        onSelectSourceTree: handlers.handleSelectSourceTree,
        onOpenSourceTreeDialog: dialogs.handleOpenSourceTreeDialog,
      },
      graphWorkspace,
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
