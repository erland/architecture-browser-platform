import { type BrowserViewProps } from './browserView.shared';
import { BrowserViewCenterContent } from './BrowserViewCenterContent';
import { BrowserViewDialogs } from './BrowserViewDialogs';
import { BrowserViewFooter } from './BrowserViewFooter';
import { BrowserInspectorPanel, BrowserRailPanel } from './BrowserViewPanels';
import { BrowserViewTopBar } from './BrowserViewTopBar';
import { useBrowserViewScreenController } from './useBrowserViewScreenController';

export function BrowserView(props: BrowserViewProps) {
  const controller = useBrowserViewScreenController(props);
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

  return (
    <div className="browser-workspace" aria-label="Browser">
      <BrowserViewTopBar
        search={search}
        onOpenSourceTreeDialog={dialogs.handleOpenSourceTreeDialog}
        onOpenSavedCanvasDialog={dialogs.openSavedCanvasDialog}
      />

      <BrowserViewDialogs
        browserSession={browserSession}
        dialogs={dialogs}
        selectedScopeLabel={selectedScopeLabel}
        selectedSnapshot={selectedSnapshot}
        selectedSnapshotLabel={selectedSnapshotLabel}
        sourceTreeLauncherItems={sourceTreeLauncherItems}
        repositories={workspaceData.repositories}
        selectedWorkspace={workspaceData.selectedWorkspace}
        savedCanvas={savedCanvas}
        handlers={handlers}
      />

      <div className="browser-workspace__layout" style={browserLayout.layoutStyle}>
        <BrowserRailPanel
          browserSession={browserSession}
          isCollapsed={browserLayout.isRailCollapsed}
          onExpand={() => browserLayout.setIsRailCollapsed(false)}
          onCollapse={() => browserLayout.setIsRailCollapsed(true)}
          onAddScopeEntitiesToCanvas={browserActions.handleAddPrimaryScopeEntitiesToCanvas}
          onOpenViewpoints={dialogs.openViewpointDialog}
        />

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--rail ${browserLayout.isRailCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation tree"
          onMouseDown={browserLayout.isRailCollapsed ? undefined : browserLayout.startPaneResize('rail')}
        />

        <section className="browser-workspace__center">
          {startup.shouldShowGate ? (
            <div className="browser-workspace__stage">
              <section className="card browser-workspace__startup-gate" aria-live="polite">
                <p className="eyebrow">Opening Browser</p>
                <h3>Preparing Browser</h3>
                <p className="muted">{startup.gateMessage}</p>
              </section>
            </div>
          ) : (
            <BrowserViewCenterContent
              activeModeLabel={activeTabMeta.label}
              browserSession={browserSession}
              hasSelectedWorkspace={Boolean(workspaceData.selectedWorkspace)}
              hasSelectedSnapshot={Boolean(selectedSnapshot)}
              hasPreparedSession={Boolean(browserSession.state.index && browserSession.state.payload)}
              sourceTreeLauncherItems={sourceTreeLauncherItems}
              onSelectSourceTree={handlers.handleSelectSourceTree}
              onOpenSourceTreeDialog={dialogs.handleOpenSourceTreeDialog}
              onAddScopeAnalysis={browserActions.handleAddScopeAnalysisToCanvas}
              onAddContainedEntities={browserActions.handleAddContainedEntitiesToCanvas}
              onAddPeerEntities={browserActions.handleAddPeerEntitiesToCanvas}
            />
          )}
        </section>

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--inspector ${browserLayout.isInspectorCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize facts panel"
          onMouseDown={browserLayout.isInspectorCollapsed ? undefined : browserLayout.startPaneResize('inspector')}
        />

        <BrowserInspectorPanel
          browserSession={browserSession}
          isCollapsed={browserLayout.isInspectorCollapsed}
          onExpand={() => browserLayout.setIsInspectorCollapsed(false)}
          onCollapse={() => browserLayout.setIsInspectorCollapsed(true)}
          onSetActiveTab={browserLayout.setActiveTab}
        />
      </div>

      <BrowserViewFooter
        repositoryLabel={repositoryLabel}
        activeModeLabel={activeTabMeta.label}
        selectedScopeLabel={selectedScopeLabel}
        activeViewpointLabel={activeViewpointLabel}
        selectedSnapshotLabel={selectedSnapshotLabel}
        selectedSnapshotImportedAt={selectedSnapshot?.importedAt}
        hasPreparedSnapshot={Boolean(browserSession.state.activeSnapshot)}
      />
    </div>
  );
}
