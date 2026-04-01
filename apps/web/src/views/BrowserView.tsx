import { BrowserSavedCanvasDialog } from '../components/BrowserSavedCanvasDialog';
import { BrowserSourceTreeSwitcherDialog } from '../components/BrowserSourceTreeSwitcherDialog';
import { BrowserTopSearch } from '../components/BrowserTopSearch';
import { BrowserViewpointDialog } from '../components/BrowserViewpointDialog';
import { type BrowserViewProps } from './browserView.shared';
import { BrowserViewCenterContent } from './BrowserViewCenterContent';
import { BrowserInspectorPanel, BrowserRailPanel } from './BrowserViewPanels';
import { useBrowserViewScreenController } from './useBrowserViewScreenController';


function formatFooterTimestamp(value: string | null | undefined) {
  if (!value) {
    return 'Captured —';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `Captured ${value}`;
  }

  return `Captured ${date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function BrowserView(props: BrowserViewProps) {
  const controller = useBrowserViewScreenController(props);
  const {
    browserActions,
    browserLayout,
    browserSession,
    dialogs,
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
      <header className="card browser-workspace__topbar">
        <div className="browser-workspace__header-row browser-workspace__header-row--compact">
          <div className="browser-workspace__title-block">
            <p className="eyebrow">Browser</p>
            <h2>Architecture Browser</h2>
          </div>

          <div className="browser-workspace__search-slot">
            <BrowserTopSearch
              query={browserSession.state.searchQuery}
              onQueryChange={(query) => browserSession.navigation.setSearch(query, browserActions.effectiveTopSearchScopeId)}
              scopeMode={browserLayout.topSearchScopeMode}
              onScopeModeChange={(mode) => {
                browserLayout.setTopSearchScopeMode(mode);
                const nextScopeId = mode === 'selected-scope' ? browserSession.state.selectedScopeId : null;
                browserSession.navigation.setSearch(browserSession.state.searchQuery, nextScopeId);
              }}
              results={browserSession.state.searchResults}
              onActivateResult={browserActions.handleTopSearchResult}
              disabled={!browserSession.state.index}
            />
          </div>

          <div className="browser-workspace__header-actions">
            <button type="button" className="browser-workspace__source-tree-button" onClick={dialogs.handleOpenSourceTreeDialog}>Source tree</button>
            <button type="button" className="button-secondary browser-workspace__saved-canvas-button" onClick={() => void savedCanvas.handleOpenDialog()}>Canvases</button>
          </div>
        </div>
      </header>

      <BrowserViewpointDialog
        isOpen={dialogs.isViewpointDialogOpen}
        index={browserSession.state.index}
        selectedScopeLabel={selectedScopeLabel}
        selection={browserSession.state.viewpointSelection}
        appliedViewpoint={browserSession.state.appliedViewpoint}
        presentationPreference={browserSession.state.viewpointPresentationPreference}
        onSelectViewpoint={browserSession.viewpoint.setSelectedViewpoint}
        onSelectScopeMode={browserSession.viewpoint.setScopeMode}
        onSelectApplyMode={browserSession.viewpoint.setApplyMode}
        onSelectVariant={browserSession.viewpoint.setVariant}
        onSelectPresentationPreference={browserSession.viewpoint.setPresentationPreference}
        onApplyViewpoint={browserSession.viewpoint.applySelectedViewpoint}
        onClose={() => dialogs.setIsViewpointDialogOpen(false)}
      />

      <BrowserSavedCanvasDialog
        isOpen={dialogs.isSavedCanvasDialogOpen}
        draftName={savedCanvas.draftName}
        onDraftNameChange={savedCanvas.setDraftName}
        onClose={() => dialogs.setIsSavedCanvasDialogOpen(false)}
        onSaveCurrentCanvas={() => void savedCanvas.handleSaveCurrentCanvas()}
        records={savedCanvas.records}
        currentCanvasId={savedCanvas.currentCanvasId}
        isBusy={savedCanvas.isBusy}
        statusMessage={savedCanvas.statusMessage}
        selectedSnapshotId={selectedSnapshot?.id ?? browserSession.state.activeSnapshot?.snapshotId ?? null}
        selectedSnapshotLabel={selectedSnapshotLabel}
        pendingSyncCount={savedCanvas.pendingSyncCount}
        currentCanvasHasLocalEdits={savedCanvas.currentCanvasHasLocalEdits}
        rebindingCanvasId={savedCanvas.rebindingCanvasId}
        rebindingSummary={savedCanvas.rebindingSummary}
        isOffline={savedCanvas.isOffline}
        availabilityByCanvasId={savedCanvas.availabilityByCanvasId}
        onOpenOriginalCanvas={(canvasId) => void savedCanvas.handleOpenCanvas(canvasId, 'original')}
        onOpenCurrentCanvas={(canvasId) => void savedCanvas.handleOpenCanvas(canvasId, 'currentTarget')}
        onOpenSelectedCanvas={(canvasId) => void savedCanvas.handleOpenCanvasOnSelectedSnapshot(canvasId)}
        onDeleteCanvas={(canvasId) => void savedCanvas.handleDeleteCanvas(canvasId)}
        onRefresh={() => void savedCanvas.handleRefreshRecords()}
        onSyncNow={() => void savedCanvas.handleSyncNow()}
      />

      <BrowserSourceTreeSwitcherDialog
        isOpen={dialogs.isSourceTreeSwitcherOpen}
        items={sourceTreeLauncherItems}
        repositories={workspaceData.repositories}
        selectedWorkspace={workspaceData.selectedWorkspace}
        onInitializeWorkspace={handlers.handleInitializeImplicitWorkspace}
        onSelectSourceTree={handlers.handleSelectSourceTree}
        onCreateRepository={handlers.handleCreateRepositoryFromDialog}
        onRequestReindex={handlers.handleRequestReindexFromDialog}
        onArchiveRepository={handlers.handleArchiveRepositoryFromDialog}
        onUpdateRepository={handlers.handleUpdateRepositoryFromDialog}
        onClose={() => dialogs.setIsSourceTreeSwitcherOpen(false)}
      />

      <div className="browser-workspace__layout" style={browserLayout.layoutStyle}>
        <BrowserRailPanel
          browserSession={browserSession}
          isCollapsed={browserLayout.isRailCollapsed}
          onExpand={() => browserLayout.setIsRailCollapsed(false)}
          onCollapse={() => browserLayout.setIsRailCollapsed(true)}
          onAddScopeEntitiesToCanvas={browserActions.handleAddPrimaryScopeEntitiesToCanvas}
          onOpenViewpoints={() => dialogs.setIsViewpointDialogOpen(true)}
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

      <footer className="card browser-workspace__footer" aria-label="Current browser context">
        <p className="browser-workspace__lead muted">
          {repositoryLabel} · {activeTabMeta.label}
        </p>
        <div className="browser-workspace__context-strip">
          <span className="badge">Scope {selectedScopeLabel ?? 'Entire snapshot'}</span>
          <span className="badge">{activeViewpointLabel}</span>
          <span
            className="badge"
            title={selectedSnapshotLabel !== '—' ? `Snapshot ${selectedSnapshotLabel}` : undefined}
          >
            {formatFooterTimestamp(selectedSnapshot?.importedAt)}
          </span>
          {browserSession.state.activeSnapshot ? <span className="badge badge--status">Prepared locally</span> : null}
        </div>
      </footer>
    </div>
  );
}

