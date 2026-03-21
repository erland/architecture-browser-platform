import { useMemo, useState } from 'react';
import { BrowserTopSearch } from '../components/BrowserTopSearch';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
import { useBrowserSessionBootstrap } from '../hooks/useBrowserSessionBootstrap';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { browserTabs } from '../routing/browserTabs';
import { BrowserViewCenterContent } from './BrowserViewCenterContent';
import { BrowserInspectorPanel, BrowserRailPanel } from './BrowserViewPanels';
import { type BrowserViewProps } from './browserView.shared';
import { useBrowserViewActions } from './useBrowserViewActions';
import { useBrowserViewLayout } from './useBrowserViewLayout';

export function BrowserView({ onOpenWorkspaces, onOpenSnapshots, onOpenRepositories, onOpenLegacy }: BrowserViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selection = useAppSelectionContext();
  const browserSession = useBrowserSession();
  const browserLayout = useBrowserViewLayout();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    setBusyMessage,
    setError,
  });

  const selectedSnapshot = useMemo(() => {
    const sessionSnapshotId = browserSession.state.activeSnapshot?.snapshotId;
    if (sessionSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === sessionSnapshotId) ?? null;
    }
    if (selection.selectedSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === selection.selectedSnapshotId) ?? null;
    }
    return null;
  }, [browserSession.state.activeSnapshot?.snapshotId, selection.selectedSnapshotId, workspaceData.snapshots]);

  const browserSessionBootstrap = useBrowserSessionBootstrap({
    workspaceId: workspaceData.selectedWorkspaceId,
    repositoryId: selection.selectedRepositoryId,
    snapshot: selectedSnapshot,
  });

  const selectedRepository = useMemo(() => {
    const bySelection = workspaceData.repositories.find((repository) => repository.id === selection.selectedRepositoryId);
    if (bySelection) {
      return bySelection;
    }
    if (!selectedSnapshot) {
      return null;
    }
    return workspaceData.repositories.find((repository) => repository.id === selectedSnapshot.repositoryRegistrationId) ?? null;
  }, [workspaceData.repositories, selection.selectedRepositoryId, selectedSnapshot]);

  const repositoryLabel = selectedRepository?.name
    ?? selectedSnapshot?.repositoryName
    ?? selectedSnapshot?.repositoryKey
    ?? selectedSnapshot?.repositoryRegistrationId
    ?? '—';

  const browserSessionSummary = browserSession.state.activeSnapshot ? [
    `${browserSession.state.canvasNodes.length} canvas nodes`,
    `${browserSession.state.canvasEdges.length} canvas edges`,
    `${browserSession.state.searchResults.length} local search hits`,
  ].join(' · ') : null;

  const activeTabMeta = browserTabs.find((tab) => tab.key === browserLayout.activeTab) ?? browserTabs[0];
  const localSnapshotCounts = browserSession.state.payload ? {
    scopes: browserSession.state.payload.scopes.length,
    entities: browserSession.state.payload.entities.length,
    relationships: browserSession.state.payload.relationships.length,
    diagnostics: browserSession.state.payload.diagnostics.length,
  } : null;

  const selectedScopeLabel = useMemo(() => {
    if (!browserSession.state.index || !browserSession.state.selectedScopeId) {
      return null;
    }
    return browserSession.state.index.scopePathById.get(browserSession.state.selectedScopeId)
      ?? browserSession.state.selectedScopeId
      ?? null;
  }, [browserSession.state.index, browserSession.state.selectedScopeId]);

  const selectedSnapshotLabel = selectedSnapshot?.snapshotKey
    ?? browserSession.state.activeSnapshot?.snapshotKey
    ?? '—';

  const browserActions = useBrowserViewActions({
    browserSession,
    activeTab: browserLayout.activeTab,
    setActiveTab: browserLayout.setActiveTab,
    topSearchScopeMode: browserLayout.topSearchScopeMode,
  });

  return (
    <div className="browser-workspace" aria-label="Browser analysis workspace">
      <header className="card browser-workspace__topbar">
        <div className="browser-workspace__topbar-main">
          <div>
            <p className="eyebrow">Browser</p>
            <h2>Analysis workspace</h2>
          </div>
          <div className="browser-workspace__context-strip" aria-label="Current browser context">
            <span className="badge">Workspace {workspaceData.selectedWorkspace?.name ?? '—'}</span>
            <span className="badge">Repository {repositoryLabel}</span>
            <span className="badge">Snapshot {selectedSnapshotLabel}</span>
            <span className="badge">Mode {activeTabMeta.label}</span>
            {browserSession.state.activeSnapshot ? <span className="badge badge--status">Prepared locally</span> : null}
          </div>
        </div>
        <BrowserTopSearch
          query={browserSession.state.searchQuery}
          onQueryChange={(query) => browserSession.setSearch(query, browserActions.effectiveTopSearchScopeId)}
          scopeMode={browserLayout.topSearchScopeMode}
          onScopeModeChange={(mode) => {
            browserLayout.setTopSearchScopeMode(mode);
            const nextScopeId = mode === 'selected-scope' ? browserSession.state.selectedScopeId : null;
            browserSession.setSearch(browserSession.state.searchQuery, nextScopeId);
          }}
          selectedScopeLabel={selectedScopeLabel}
          results={browserSession.state.searchResults}
          onActivateResult={browserActions.handleTopSearchResult}
          disabled={!browserSession.state.index}
        />
        <div className="browser-workspace__topbar-actions">
          <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Change snapshot</button>
          <button type="button" className="button-secondary" onClick={onOpenRepositories}>Repositories</button>
          <button type="button" className="button-secondary" onClick={onOpenWorkspaces}>Workspaces</button>
          <button type="button" onClick={onOpenLegacy}>Exit Browser</button>
        </div>
      </header>

      <div className="browser-workspace__statusbar">
        <div className="browser-health-bar browser-health-bar--compact">
          <span className="badge">API {workspaceData.health.status}</span>
          <span className="badge">{workspaceData.health.service}</span>
          {browserSession.state.activeSnapshot ? <span className="badge">Session {browserSession.state.activeSnapshot.snapshotKey}</span> : null}
          {busyMessage ? <span className="badge badge--warning">{busyMessage}</span> : null}
          {error ? <span className="badge badge--danger">{error}</span> : null}
        </div>
        {browserSessionBootstrap.message ? (
          <p className={browserSessionBootstrap.status === 'failed' ? 'error browser-workspace__status-message' : 'notice browser-workspace__status-message'}>{browserSessionBootstrap.message}</p>
        ) : null}
      </div>

      <div className="browser-workspace__layout" style={browserLayout.layoutStyle}>
        <BrowserRailPanel
          browserSession={browserSession}
          isCollapsed={browserLayout.isRailCollapsed}
          onExpand={() => browserLayout.setIsRailCollapsed(false)}
          onCollapse={() => browserLayout.setIsRailCollapsed(true)}
          onAddScopeEntitiesToCanvas={browserActions.handleAddPrimaryScopeEntitiesToCanvas}
          selectedScopeLabel={selectedScopeLabel}
          workspaceName={workspaceData.selectedWorkspace?.name}
          repositoryLabel={repositoryLabel}
          snapshot={selectedSnapshot}
        />

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--rail ${browserLayout.isRailCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation tree"
          onMouseDown={browserLayout.isRailCollapsed ? undefined : browserLayout.startPaneResize('rail')}
        />

        <section className="browser-workspace__center">
          <BrowserViewCenterContent
            activeModeLabel={activeTabMeta.label}
            browserSession={browserSession}
            hasSelectedWorkspace={Boolean(workspaceData.selectedWorkspace)}
            hasSelectedSnapshot={Boolean(selectedSnapshot)}
            hasPreparedSession={Boolean(browserSession.state.index && browserSession.state.payload)}
            onOpenRepositories={onOpenRepositories}
            onOpenSnapshots={onOpenSnapshots}
            onOpenLegacy={onOpenLegacy}
            onAddScopeAnalysis={browserActions.handleAddScopeAnalysisToCanvas}
            onAddContainedEntities={browserActions.handleAddContainedEntitiesToCanvas}
            onAddPeerEntities={browserActions.handleAddPeerEntitiesToCanvas}
          />
        </section>

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--inspector ${browserLayout.isInspectorCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize facts panel"
          onMouseDown={browserLayout.isInspectorCollapsed ? undefined : browserLayout.startPaneResize('inspector')}
        />

        <BrowserInspectorPanel
          activeTabLabel={activeTabMeta.label}
          browserSession={browserSession}
          browserSessionSummary={browserSessionSummary}
          isCollapsed={browserLayout.isInspectorCollapsed}
          localSnapshotCounts={localSnapshotCounts}
          onExpand={() => browserLayout.setIsInspectorCollapsed(false)}
          onCollapse={() => browserLayout.setIsInspectorCollapsed(true)}
          onSetActiveTab={browserLayout.setActiveTab}
        />
      </div>
    </div>
  );
}
