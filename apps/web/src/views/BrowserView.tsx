import { useEffect, useMemo, useState } from 'react';
import { DependenciesTab } from '../browser/DependenciesTab';
import { EntryPointsTab } from '../browser/EntryPointsTab';
import { LayoutTab } from '../browser/LayoutTab';
import { OverviewTab } from '../browser/OverviewTab';
import { SearchTab } from '../browser/SearchTab';
import { BrowserTabNav, isBrowserTabKey, type BrowserTabKey } from '../components/BrowserTabNav';
import { ContextHeader } from '../components/ContextHeader';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserExplorer } from '../hooks/useBrowserExplorer';
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
  const browserExplorer = useBrowserExplorer({
    selectedWorkspaceId: workspaceData.selectedWorkspaceId,
    snapshots: workspaceData.snapshots,
    selectedSnapshotId: selection.selectedSnapshotId,
    setSelectedSnapshotId: selection.setSelectedSnapshotId,
    feedback: { setError },
  });

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
    if (!browserExplorer.selectedSnapshot) {
      return null;
    }
    return workspaceData.repositories.find((repository) => repository.id === browserExplorer.selectedSnapshot?.repositoryRegistrationId) ?? null;
  }, [workspaceData.repositories, selection.selectedRepositoryId, browserExplorer.selectedSnapshot]);

  const repositoryLabel = selectedRepository?.name
    ?? browserExplorer.selectedSnapshot?.repositoryName
    ?? browserExplorer.selectedSnapshot?.repositoryKey
    ?? browserExplorer.selectedSnapshot?.repositoryRegistrationId
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
  } else if (!browserExplorer.selectedSnapshot || !browserExplorer.snapshotOverview) {
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
      <OverviewTab
        selectedSnapshot={browserExplorer.selectedSnapshot}
        snapshotOverview={browserExplorer.snapshotOverview}
      />
    );
  } else if (activeTab === 'layout') {
    tabContent = (
      <LayoutTab
        flattenedLayoutNodes={browserExplorer.flattenedLayoutNodes}
        selectedLayoutScopeId={browserExplorer.selectedLayoutScopeId}
        setSelectedLayoutScopeId={browserExplorer.setSelectedLayoutScopeId}
        layoutTree={browserExplorer.layoutTree}
        layoutScopeDetail={browserExplorer.layoutScopeDetail}
      />
    );
  } else if (activeTab === 'dependencies') {
    tabContent = (
      <DependenciesTab
        flattenedLayoutNodes={browserExplorer.flattenedLayoutNodes}
        selectedDependencyScopeId={browserExplorer.selectedDependencyScopeId}
        setSelectedDependencyScopeId={browserExplorer.setSelectedDependencyScopeId}
        dependencyDirection={browserExplorer.dependencyDirection}
        setDependencyDirection={browserExplorer.setDependencyDirection}
        dependencyView={browserExplorer.dependencyView}
        dependencyEntityOptions={browserExplorer.dependencyEntityOptions}
        focusedDependencyEntityId={browserExplorer.focusedDependencyEntityId}
        setFocusedDependencyEntityId={browserExplorer.setFocusedDependencyEntityId}
      />
    );
  } else if (activeTab === 'entry-points') {
    tabContent = (
      <EntryPointsTab
        flattenedLayoutNodes={browserExplorer.flattenedLayoutNodes}
        selectedEntryPointScopeId={browserExplorer.selectedEntryPointScopeId}
        setSelectedEntryPointScopeId={browserExplorer.setSelectedEntryPointScopeId}
        entryCategory={browserExplorer.entryCategory}
        setEntryCategory={browserExplorer.setEntryCategory}
        entryPointView={browserExplorer.entryPointView}
        entryPointOptions={browserExplorer.entryPointOptions}
        focusedEntryPointId={browserExplorer.focusedEntryPointId}
        setFocusedEntryPointId={browserExplorer.setFocusedEntryPointId}
      />
    );
  } else {
    tabContent = (
      <SearchTab
        flattenedLayoutNodes={browserExplorer.flattenedLayoutNodes}
        selectedSearchScopeId={browserExplorer.selectedSearchScopeId}
        setSelectedSearchScopeId={browserExplorer.setSelectedSearchScopeId}
        searchQuery={browserExplorer.searchQuery}
        setSearchQuery={browserExplorer.setSearchQuery}
        searchView={browserExplorer.searchView}
        searchResultOptions={browserExplorer.searchResultOptions}
        selectedSearchEntityId={browserExplorer.selectedSearchEntityId}
        setSelectedSearchEntityId={browserExplorer.setSelectedSearchEntityId}
        entityDetail={browserExplorer.entityDetail}
      />
    );
  }

  return (
    <div className="content-stack browser-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser</p>
        <h2>Dedicated browser shell</h2>
        <p className="lead">
          Step 8 keeps the dedicated Browser route but now drives it from a browser-specific orchestration hook instead of the broader legacy snapshot hook, making the Browser route a cleaner target for further refactoring.
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
            <span className="badge">Step 8</span>
          </div>
          <p className="muted">
The Browser route now uses dedicated browser orchestration. The legacy snapshot hook still handles customization and comparison for the temporary stacked flow, which reduces coupling before Compare and Operations move into their own routes.
          </p>
        </article>
      </section>

      <ContextHeader
        selectedWorkspace={workspaceData.selectedWorkspace}
        repositoryLabel={repositoryLabel}
        selectedSnapshot={browserExplorer.selectedSnapshot}
        snapshotOverview={browserExplorer.snapshotOverview}
      />

      <BrowserTabNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <section className="browser-main-content">
        {tabContent}
      </section>
    </div>
  );
}
