import { useEffect, useMemo, useState } from 'react';
import { emptyRepositoryForm, type Repository, type RepositoryUpdateRequest, type Workspace } from '../appModel';
import { platformApi } from '../platformApi';
import { getBrowserSnapshotCache } from '../snapshotCache';
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

export function BrowserView(_: BrowserViewProps) {
  const [, setBusyMessage] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [isSourceTreeSwitcherOpen, setIsSourceTreeSwitcherOpen] = useState(false);
  const [isViewpointDialogOpen, setIsViewpointDialogOpen] = useState(false);

  const handleOpenSourceTreeDialog = () => setIsSourceTreeSwitcherOpen(true);
  const selection = useAppSelectionContext();
  const browserSession = useBrowserSession();
  const browserLayout = useBrowserViewLayout();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    selectedSnapshotId: selection.selectedSnapshotId,
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

  const browserBootstrap = useBrowserSessionBootstrap({
    workspaceId: workspaceData.selectedWorkspaceId,
    repositoryId: selection.selectedRepositoryId,
    snapshot: selectedSnapshot,
  });

  const startupTargetWorkspaceId = selection.selectedWorkspaceId
    ?? workspaceData.selectedWorkspaceId
    ?? workspaceData.workspaces[0]?.id
    ?? null;

  const shouldShowStartupGate = useMemo(() => {
    if (!workspaceData.workspacesLoaded) {
      return true;
    }

    if (workspaceData.workspaces.length === 0) {
      return false;
    }

    if (!startupTargetWorkspaceId) {
      return true;
    }

    if (workspaceData.workspaceDetailLoadedFor !== startupTargetWorkspaceId) {
      return true;
    }

    if (selectedSnapshot && browserBootstrap.status === 'loading' && !browserSession.state.index) {
      return true;
    }

    return false;
  }, [
    workspaceData.workspacesLoaded,
    workspaceData.workspaces.length,
    workspaceData.workspaceDetailLoadedFor,
    startupTargetWorkspaceId,
    selectedSnapshot,
    browserBootstrap.status,
    browserSession.state.index,
  ]);

  const startupGateMessage = useMemo(() => {
    if (!workspaceData.workspacesLoaded) {
      return 'Loading source trees…';
    }
    if (workspaceData.workspaces.length > 0 && !startupTargetWorkspaceId) {
      return 'Opening source tree catalog…';
    }
    if (startupTargetWorkspaceId && workspaceData.workspaceDetailLoadedFor !== startupTargetWorkspaceId) {
      return 'Loading indexed versions…';
    }
    if (selectedSnapshot && browserBootstrap.status === 'loading') {
      return browserBootstrap.message ?? 'Preparing Browser…';
    }
    return 'Opening Browser…';
  }, [
    workspaceData.workspacesLoaded,
    workspaceData.workspaces.length,
    startupTargetWorkspaceId,
    workspaceData.workspaceDetailLoadedFor,
    selectedSnapshot,
    browserBootstrap.status,
    browserBootstrap.message,
  ]);


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


  useEffect(() => {
    if (!selection.selectedWorkspaceId && workspaceData.workspaces.length > 0) {
      const activeWorkspaces = workspaceData.workspaces.filter((workspace) => workspace.status !== 'ARCHIVED');
      const implicitWorkspace = activeWorkspaces[0] ?? workspaceData.workspaces[0] ?? null;
      if (implicitWorkspace) {
        selection.setSelectedWorkspaceId(implicitWorkspace.id);
      }
    }
  }, [selection.selectedWorkspaceId, selection.setSelectedWorkspaceId, workspaceData.workspaces]);

  const sourceTreeLauncherItems = useMemo(() => buildSourceTreeLauncherItems({
    workspace: workspaceData.selectedWorkspace,
    repositories: workspaceData.repositories,
    snapshots: workspaceData.snapshots,
  }), [workspaceData.selectedWorkspace, workspaceData.repositories, workspaceData.snapshots]);

  const handleSelectSourceTree = async (item: SourceTreeLauncherItem) => {
    const cache = getBrowserSnapshotCache();
    selection.setSelectedWorkspaceId(item.workspaceId);

    const detail = workspaceData.selectedWorkspaceId === item.workspaceId
      ? { snapshotPayload: workspaceData.snapshots }
      : await workspaceData.loadWorkspaceDetail(item.workspaceId);

    const repositorySnapshots = (detail?.snapshotPayload ?? workspaceData.snapshots)
      .filter((snapshot) => snapshot.repositoryRegistrationId === item.repositoryId)
      .sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt));

    let preferredSnapshotId = item.latestSnapshotId;
    for (const snapshot of repositorySnapshots) {
      const record = await cache.getSnapshot(snapshot.id);
      if (cache.isSnapshotCurrent(snapshot, record)) {
        preferredSnapshotId = snapshot.id;
        break;
      }
    }

    selection.setSelectedRepositoryId(item.repositoryId);
    selection.setSelectedSnapshotId(preferredSnapshotId);
    setIsSourceTreeSwitcherOpen(false);
  };


  const handleInitializeImplicitWorkspace = async () => {
    setBusyMessage('Initializing source tree catalog…');
    try {
      const created = await platformApi.createWorkspace<Workspace>({
        workspaceKey: 'default',
        name: 'Default source trees',
        description: 'Implicit Browser workspace for source tree registrations.',
      });
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(created.id);
      selection.setSelectedWorkspaceId(created.id);
      selection.setSelectedRepositoryId(null);
      selection.setSelectedSnapshotId(null);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  };

  const handleCreateRepositoryFromDialog = async (payload: typeof emptyRepositoryForm) => {
    const workspaceId = workspaceData.selectedWorkspace?.id ?? selection.selectedWorkspaceId;
    if (!workspaceId) {
      return;
    }
    setBusyMessage(`Creating source tree ${payload.name || payload.repositoryKey}…`);
    try {
      const created = await platformApi.createRepository<Repository>(workspaceId, payload);
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(workspaceId);
      selection.setSelectedWorkspaceId(workspaceId);
      selection.setSelectedRepositoryId(created.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  };

  const handleRequestReindexFromDialog = async (repository: Repository) => {
    const latestSnapshot = await workspaceData.handleRequestRun(repository, 'SUCCESS');
    selection.setSelectedWorkspaceId(repository.workspaceId);
    selection.setSelectedRepositoryId(repository.id);
    selection.setSelectedSnapshotId(latestSnapshot?.id ?? null);
  };

  const handleArchiveRepositoryFromDialog = async (repository: Repository) => {
    await workspaceData.handleArchiveRepository(repository.id);
    if (selection.selectedRepositoryId === repository.id) {
      selection.setSelectedRepositoryId(null);
      selection.setSelectedSnapshotId(null);
    }
  };

  const handleUpdateRepositoryFromDialog = async (repository: Repository, payload: RepositoryUpdateRequest) => {
    setBusyMessage(`Updating source tree ${payload.name || repository.name}…`);
    try {
      await platformApi.updateRepository<Repository>(repository.workspaceId, repository.id, payload);
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(repository.workspaceId);
      selection.setSelectedWorkspaceId(repository.workspaceId);
      selection.setSelectedRepositoryId(repository.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
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
        items={sourceTreeLauncherItems}
        repositories={workspaceData.repositories}
        selectedWorkspace={workspaceData.selectedWorkspace}
        onInitializeWorkspace={handleInitializeImplicitWorkspace}
        onSelectSourceTree={handleSelectSourceTree}
        onCreateRepository={handleCreateRepositoryFromDialog}
        onRequestReindex={handleRequestReindexFromDialog}
        onArchiveRepository={handleArchiveRepositoryFromDialog}
        onUpdateRepository={handleUpdateRepositoryFromDialog}
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
          {shouldShowStartupGate ? (
            <div className="browser-workspace__stage">
              <section className="card browser-workspace__startup-gate" aria-live="polite">
                <p className="eyebrow">Opening Browser</p>
                <h3>Preparing Browser</h3>
                <p className="muted">{startupGateMessage}</p>
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
              onSelectSourceTree={handleSelectSourceTree}
              onOpenSourceTreeDialog={handleOpenSourceTreeDialog}
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
        <p
          className="browser-workspace__lead muted"
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
