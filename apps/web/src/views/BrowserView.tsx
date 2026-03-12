import { useEffect, useMemo, useState } from 'react';
import { DependenciesTab } from '../browser/DependenciesTab';
import { EntryPointsTab } from '../browser/EntryPointsTab';
import { LayoutTab } from '../browser/LayoutTab';
import { OverviewTab } from '../browser/OverviewTab';
import { SearchTab } from '../browser/SearchTab';
import { BrowserTabNav } from '../components/BrowserTabNav';
import { ContextHeader } from '../components/ContextHeader';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserExplorer } from '../hooks/useBrowserExplorer';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { buildBrowserTabSearch, DEFAULT_BROWSER_TAB, readBrowserTabFromSearch } from '../routing/browserTabState';
import { type BrowserTabKey } from '../routing/browserTabs';

function readBrowserTabFromLocation(): BrowserTabKey {
  if (typeof window === 'undefined') {
    return DEFAULT_BROWSER_TAB;
  }
  return readBrowserTabFromSearch(window.location.search);
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
    const nextSearch = buildBrowserTabSearch(window.location.search, activeTab);
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
    <div className="content-stack browser-view browser-route-shell">
      <section className="card browser-hero browser-shell-header">
        <div className="browser-hero__main">
          <p className="eyebrow">Browser</p>
          <h2>Focused architecture workspace</h2>
          <p className="lead browser-hero__lead">
            Step 12 makes Browser the obvious destination after indexing. The header now explains snapshot status directly, especially when the selected snapshot is partial, so users understand what they are browsing before they dive into the tabs.
          </p>
        </div>
        <div className="browser-hero__actions">
          <button type="button" onClick={onOpenSnapshots}>Choose snapshot</button>
          <button type="button" className="button-secondary" onClick={onOpenRepositories}>Manage repositories and runs</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
        </div>
        <div className="browser-health-bar">
          <span className="badge">API {workspaceData.health.status}</span>
          <span className="badge">{workspaceData.health.service}</span>
          <span className="badge">{workspaceData.health.version}</span>
          {workspaceData.health.time ? <span className="badge">{workspaceData.health.time}</span> : null}
          {busyMessage ? <span className="badge badge--warning">{busyMessage}</span> : null}
          {error ? <span className="badge badge--danger">{error}</span> : null}
        </div>
      </section>

      <section className="browser-shell-layout">
        <aside className="browser-shell-rail">
          <ContextHeader
            selectedWorkspace={workspaceData.selectedWorkspace}
            repositoryLabel={repositoryLabel}
            selectedSnapshot={browserExplorer.selectedSnapshot}
            snapshotOverview={browserExplorer.snapshotOverview}
          />

          <BrowserTabNav activeTab={activeTab} onSelectTab={setActiveTab} />
        </aside>

        <section className="browser-shell-body browser-main-content">
          {tabContent}
        </section>
      </section>
    </div>
  );
}
