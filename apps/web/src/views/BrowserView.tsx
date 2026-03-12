import { useEffect, useMemo, useState } from 'react';
import { DependencyPanel } from '../components/DependencyPanel';
import { EntryPointPanel } from '../components/EntryPointPanel';
import { LayoutExplorerPanel } from '../components/LayoutExplorerPanel';
import { RecentDiagnosticsPanel } from '../components/RecentDiagnosticsPanel';
import { SearchDetailPanel } from '../components/SearchDetailPanel';
import { SnapshotOverviewPanel } from '../components/SnapshotOverviewPanel';
import { BrowserTabNav, isBrowserTabKey, type BrowserTabKey } from '../components/BrowserTabNav';
import { ContextHeader } from '../components/ContextHeader';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useSnapshotExplorer } from '../hooks/useSnapshotExplorer';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

const DEFAULT_BROWSER_TAB: BrowserTabKey = 'overview';

function readBrowserTabFromLocation(): BrowserTabKey {
  if (typeof window === 'undefined') {
    return DEFAULT_BROWSER_TAB;
  }
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('browserTab');
  return isBrowserTabKey(tab) ? tab : DEFAULT_BROWSER_TAB;
}

type BrowserViewProps = {
  onOpenSnapshots: () => void;
  onOpenRepositories: () => void;
  onOpenLegacy: () => void;
};

export function BrowserView({ onOpenSnapshots, onOpenRepositories, onOpenLegacy }: BrowserViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTabKey>(() => readBrowserTabFromLocation());
  const selection = useAppSelectionContext();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    setBusyMessage,
    setError,
  });
  const snapshotExplorer = useSnapshotExplorer(
    workspaceData.selectedWorkspaceId,
    workspaceData.snapshots,
    selection.selectedSnapshotId,
    selection.setSelectedSnapshotId,
    { setBusyMessage, setError },
  );

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(readBrowserTabFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === DEFAULT_BROWSER_TAB) {
      params.delete('browserTab');
    } else {
      params.set('browserTab', activeTab);
    }
    const rendered = params.toString();
    const nextSearch = rendered.length ? `?${rendered}` : '';
    if (nextSearch !== window.location.search) {
      window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}${window.location.hash}`);
    }
  }, [activeTab]);

  const selectedRepository = useMemo(() => {
    const bySelection = workspaceData.repositories.find((repository) => repository.id === selection.selectedRepositoryId);
    if (bySelection) {
      return bySelection;
    }
    if (!snapshotExplorer.selectedSnapshot) {
      return null;
    }
    return workspaceData.repositories.find((repository) => repository.id === snapshotExplorer.selectedSnapshot?.repositoryRegistrationId) ?? null;
  }, [workspaceData.repositories, selection.selectedRepositoryId, snapshotExplorer.selectedSnapshot]);

  const repositoryLabel = selectedRepository?.name
    ?? snapshotExplorer.selectedSnapshot?.repositoryName
    ?? snapshotExplorer.selectedSnapshot?.repositoryKey
    ?? snapshotExplorer.selectedSnapshot?.repositoryRegistrationId
    ?? '—';

  let tabContent;
  if (!workspaceData.selectedWorkspace) {
    tabContent = (
      <article className="card empty-state-card">
        <h2>No workspace selected</h2>
        <p className="muted">Choose a workspace first, then select a snapshot to enter the focused Browser experience.</p>
        <div className="actions">
          <button type="button" onClick={onOpenRepositories}>Open Repositories</button>
          <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Open Snapshots</button>
        </div>
      </article>
    );
  } else if (!snapshotExplorer.selectedSnapshot || !snapshotExplorer.snapshotOverview) {
    tabContent = (
      <article className="card empty-state-card">
        <h2>No snapshot selected</h2>
        <p className="muted">Use the Snapshots view to choose an imported snapshot, then return here to browse architecture with dedicated tools.</p>
        <div className="actions">
          <button type="button" onClick={onOpenSnapshots}>Open Snapshots</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
        </div>
      </article>
    );
  } else if (activeTab === 'overview') {
    tabContent = (
      <div className="content-stack">
        <SnapshotOverviewPanel selectedSnapshot={snapshotExplorer.selectedSnapshot} snapshotOverview={snapshotExplorer.snapshotOverview} />
        <RecentDiagnosticsPanel snapshotOverview={snapshotExplorer.snapshotOverview} />
      </div>
    );
  } else if (activeTab === 'layout') {
    tabContent = (
      <LayoutExplorerPanel
        flattenedLayoutNodes={snapshotExplorer.flattenedLayoutNodes}
        selectedLayoutScopeId={snapshotExplorer.selectedLayoutScopeId}
        setSelectedLayoutScopeId={snapshotExplorer.setSelectedLayoutScopeId}
        layoutTree={snapshotExplorer.layoutTree}
        layoutScopeDetail={snapshotExplorer.layoutScopeDetail}
      />
    );
  } else if (activeTab === 'dependencies') {
    tabContent = (
      <DependencyPanel
        flattenedLayoutNodes={snapshotExplorer.flattenedLayoutNodes}
        selectedDependencyScopeId={snapshotExplorer.selectedDependencyScopeId}
        setSelectedDependencyScopeId={snapshotExplorer.setSelectedDependencyScopeId}
        dependencyDirection={snapshotExplorer.dependencyDirection}
        setDependencyDirection={snapshotExplorer.setDependencyDirection}
        dependencyView={snapshotExplorer.dependencyView}
        dependencyEntityOptions={snapshotExplorer.dependencyEntityOptions}
        focusedDependencyEntityId={snapshotExplorer.focusedDependencyEntityId}
        setFocusedDependencyEntityId={snapshotExplorer.setFocusedDependencyEntityId}
      />
    );
  } else if (activeTab === 'entry-points') {
    tabContent = (
      <EntryPointPanel
        flattenedLayoutNodes={snapshotExplorer.flattenedLayoutNodes}
        selectedEntryPointScopeId={snapshotExplorer.selectedEntryPointScopeId}
        setSelectedEntryPointScopeId={snapshotExplorer.setSelectedEntryPointScopeId}
        entryCategory={snapshotExplorer.entryCategory}
        setEntryCategory={snapshotExplorer.setEntryCategory}
        entryPointView={snapshotExplorer.entryPointView}
        entryPointOptions={snapshotExplorer.entryPointOptions}
        focusedEntryPointId={snapshotExplorer.focusedEntryPointId}
        setFocusedEntryPointId={snapshotExplorer.setFocusedEntryPointId}
      />
    );
  } else {
    tabContent = (
      <SearchDetailPanel
        flattenedLayoutNodes={snapshotExplorer.flattenedLayoutNodes}
        selectedSearchScopeId={snapshotExplorer.selectedSearchScopeId}
        setSelectedSearchScopeId={snapshotExplorer.setSelectedSearchScopeId}
        searchQuery={snapshotExplorer.searchQuery}
        setSearchQuery={snapshotExplorer.setSearchQuery}
        searchView={snapshotExplorer.searchView}
        searchResultOptions={snapshotExplorer.searchResultOptions}
        selectedSearchEntityId={snapshotExplorer.selectedSearchEntityId}
        setSelectedSearchEntityId={snapshotExplorer.setSelectedSearchEntityId}
        entityDetail={snapshotExplorer.entityDetail}
      />
    );
  }

  return (
    <div className="content-stack browser-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser</p>
        <h2>Dedicated browser shell</h2>
        <p className="lead">
          Step 6 turns architecture browsing into its own route. The existing overview, layout, dependency, entry-point, and search panels now live behind tabbed browser navigation instead of being buried in the temporary stacked screen.
        </p>
        <div className="actions">
          <button type="button" onClick={onOpenSnapshots}>Choose snapshot</button>
          <button type="button" className="button-secondary" onClick={onOpenRepositories}>Manage repositories and runs</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
        </div>
      </section>

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div><dt>Status</dt><dd>{workspaceData.health.status}</dd></div>
            <div><dt>Service</dt><dd>{workspaceData.health.service}</dd></div>
            <div><dt>Version</dt><dd>{workspaceData.health.version}</dd></div>
            <div><dt>Time</dt><dd>{workspaceData.health.time || '—'}</dd></div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <div className="section-heading">
            <h2>Browser route status</h2>
            <span className="badge">Step 6</span>
          </div>
          <p className="muted">
            The Browser route is now live and uses most of the screen for architecture tooling. Compare, customization, and operations stay in other routes or the temporary stacked screen until later steps move them out cleanly.
          </p>
        </article>
      </section>

      <ContextHeader
        selectedWorkspace={workspaceData.selectedWorkspace}
        repositoryLabel={repositoryLabel}
        selectedSnapshot={snapshotExplorer.selectedSnapshot}
        snapshotOverview={snapshotExplorer.snapshotOverview}
      />

      <BrowserTabNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <section className="browser-main-content">
        {tabContent}
      </section>
    </div>
  );
}
