import { useMemo, useState } from 'react';
import { buildSourceTreeLauncherItems, type SourceTreeLauncherItem } from '../appModel.sourceTree';
import { BrowserSourceTreeSwitcherDialog } from '../components/BrowserSourceTreeSwitcherDialog';
import { BrowserTopSearch } from '../components/BrowserTopSearch';
import { BrowserViewpointDialog } from '../components/BrowserViewpointDialog';
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

export function BrowserView({ onOpenWorkspaces, onOpenSnapshots, onOpenRepositories }: BrowserViewProps) {
  const [, setBusyMessage] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [isSourceTreeSwitcherOpen, setIsSourceTreeSwitcherOpen] = useState(false);
  const [isViewpointDialogOpen, setIsViewpointDialogOpen] = useState(false);
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
    if (selection.selectedSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === selection.selectedSnapshotId) ?? null;
    }

    const sessionSnapshotId = browserSession.state.activeSnapshot?.snapshotId;
    if (sessionSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === sessionSnapshotId) ?? null;
    }

    return null;
  }, [selection.selectedSnapshotId, browserSession.state.activeSnapshot?.snapshotId, workspaceData.snapshots]);

  useBrowserSessionBootstrap({
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

  const sourceTreeLauncherItems = useMemo(() => buildSourceTreeLauncherItems({
    workspace: workspaceData.selectedWorkspace,
    repositories: workspaceData.repositories,
    snapshots: workspaceData.snapshots,
  }), [workspaceData.selectedWorkspace, workspaceData.repositories, workspaceData.snapshots]);

  const handleSelectSourceTree = (item: SourceTreeLauncherItem) => {
    selection.setSelectedWorkspaceId(item.workspaceId);
    selection.setSelectedRepositoryId(item.repositoryId);
    selection.setSelectedSnapshotId(item.latestSnapshotId);
    setIsSourceTreeSwitcherOpen(false);
  };

  const repositoryLabel = selectedRepository?.name
    ?? selectedSnapshot?.repositoryName
    ?? selectedSnapshot?.repositoryKey
    ?? selectedSnapshot?.repositoryRegistrationId
    ?? '—';


  const activeTabMeta = browserTabs.find((tab) => tab.key === browserLayout.activeTab) ?? browserTabs[0];

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


  const activeViewpointLabel = browserSession.state.appliedViewpoint?.viewpoint.title
    ?? browserSession.state.appliedViewpoint?.viewpoint.id
    ?? (browserSession.state.viewpointSelection.viewpointId ? `Viewpoint ${browserSession.state.viewpointSelection.viewpointId}` : 'Manual canvas');

  const browserActions = useBrowserViewActions({
    browserSession,
    activeTab: browserLayout.activeTab,
    setActiveTab: browserLayout.setActiveTab,
    topSearchScopeMode: browserLayout.topSearchScopeMode,
  });

  return (
    <div className="browser-workspace" aria-label="Browser analysis workspace">
      <header className="card browser-workspace__topbar">
        <div className="browser-workspace__header-row browser-workspace__header-row--compact">
          <div className="browser-workspace__title-block">
            <p className="eyebrow">Browser</p>
            <h2>Analysis workspace</h2>
          </div>

          <div className="browser-workspace__search-slot">
            <BrowserTopSearch
              query={browserSession.state.searchQuery}
              onQueryChange={(query) => browserSession.setSearch(query, browserActions.effectiveTopSearchScopeId)}
              scopeMode={browserLayout.topSearchScopeMode}
              onScopeModeChange={(mode) => {
                browserLayout.setTopSearchScopeMode(mode);
                const nextScopeId = mode === 'selected-scope' ? browserSession.state.selectedScopeId : null;
                browserSession.setSearch(browserSession.state.searchQuery, nextScopeId);
              }}
              results={browserSession.state.searchResults}
              onActivateResult={browserActions.handleTopSearchResult}
              disabled={!browserSession.state.index}
            />
          </div>

          <div className="browser-workspace__header-actions">
            <button type="button" className="browser-workspace__source-tree-button" onClick={() => setIsSourceTreeSwitcherOpen(true)}>Source tree</button>
          </div>
        </div>
      </header>

      <BrowserViewpointDialog
        isOpen={isViewpointDialogOpen}
        index={browserSession.state.index}
        selectedScopeLabel={selectedScopeLabel}
        selection={browserSession.state.viewpointSelection}
        appliedViewpoint={browserSession.state.appliedViewpoint}
        presentationPreference={browserSession.state.viewpointPresentationPreference}
        onSelectViewpoint={browserSession.setSelectedViewpoint}
        onSelectScopeMode={browserSession.setViewpointScopeMode}
        onSelectApplyMode={browserSession.setViewpointApplyMode}
        onSelectVariant={browserSession.setViewpointVariant}
        onSelectPresentationPreference={browserSession.setViewpointPresentationPreference}
        onApplyViewpoint={browserSession.applySelectedViewpoint}
        onClose={() => setIsViewpointDialogOpen(false)}
      />

      <BrowserSourceTreeSwitcherDialog
        isOpen={isSourceTreeSwitcherOpen}
        workspaceName={workspaceData.selectedWorkspace?.name ?? null}
        currentSourceTreeLabel={`Source tree ${repositoryLabel}`}
        currentIndexedVersionLabel={`Indexed version ${selectedSnapshotLabel}`}
        items={sourceTreeLauncherItems}
        onSelectSourceTree={handleSelectSourceTree}
        onOpenRepositories={onOpenRepositories}
        onOpenSnapshots={onOpenSnapshots}
        onOpenWorkspaces={onOpenWorkspaces}
        onClose={() => setIsSourceTreeSwitcherOpen(false)}
      />

      <div className="browser-workspace__layout" style={browserLayout.layoutStyle}>
        <BrowserRailPanel
          browserSession={browserSession}
          isCollapsed={browserLayout.isRailCollapsed}
          onExpand={() => browserLayout.setIsRailCollapsed(false)}
          onCollapse={() => browserLayout.setIsRailCollapsed(true)}
          onAddScopeEntitiesToCanvas={browserActions.handleAddPrimaryScopeEntitiesToCanvas}
          onOpenViewpoints={() => setIsViewpointDialogOpen(true)}
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
            launcherWorkspaceName={workspaceData.selectedWorkspace?.name ?? null}
            sourceTreeLauncherItems={sourceTreeLauncherItems}
            onSelectSourceTree={handleSelectSourceTree}
            onOpenRepositories={onOpenRepositories}
            onOpenSnapshots={onOpenSnapshots}
            onOpenWorkspaces={onOpenWorkspaces}
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
          browserSession={browserSession}
          isCollapsed={browserLayout.isInspectorCollapsed}
          onExpand={() => browserLayout.setIsInspectorCollapsed(false)}
          onCollapse={() => browserLayout.setIsInspectorCollapsed(true)}
          onSetActiveTab={browserLayout.setActiveTab}
        />
      </div>

      <footer className="card browser-workspace__footer" aria-label="Current browser context">
        <p
          className="browser-workspace__lead muted"
          title={workspaceData.selectedWorkspace?.name
            ? `Workspace ${workspaceData.selectedWorkspace.name}`
            : undefined}
        >
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
