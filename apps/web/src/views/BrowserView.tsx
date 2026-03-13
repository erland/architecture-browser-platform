import { useEffect, useMemo, useState } from 'react';
import { DependenciesTab } from '../browser/DependenciesTab';
import { EntryPointsTab } from '../browser/EntryPointsTab';
import { LayoutTab } from '../browser/LayoutTab';
import { OverviewTab } from '../browser/OverviewTab';
import { SearchTab } from '../browser/SearchTab';
import { BrowserFactsPanel } from '../components/BrowserFactsPanel';
import { BrowserGraphWorkspace } from '../components/BrowserGraphWorkspace';
import { BrowserNavigationTree } from '../components/BrowserNavigationTree';
import { BrowserTabNav } from '../components/BrowserTabNav';
import { BrowserTopSearch, type BrowserTopSearchResultAction, type BrowserTopSearchScopeMode } from '../components/BrowserTopSearch';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
import { useBrowserExplorer } from '../hooks/useBrowserExplorer';
import { useBrowserSessionBootstrap } from '../hooks/useBrowserSessionBootstrap';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { buildBrowserTabSearch, DEFAULT_BROWSER_TAB, readBrowserTabFromSearch } from '../routing/browserTabState';
import { browserTabs, type BrowserTabKey } from '../routing/browserTabs';

function readBrowserTabFromLocation(): BrowserTabKey {
  if (typeof window === 'undefined') {
    return DEFAULT_BROWSER_TAB;
  }
  return readBrowserTabFromSearch(window.location.search);
}

type BrowserViewProps = {
  onOpenWorkspaces: () => void;
  onOpenSnapshots: () => void;
  onOpenRepositories: () => void;
  onOpenCompare: () => void;
  onOpenOperations: () => void;
  onOpenLegacy: () => void;
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return 'No timestamp recorded';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function BrowserView({ onOpenWorkspaces, onOpenSnapshots, onOpenRepositories, onOpenCompare, onOpenOperations, onOpenLegacy }: BrowserViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTabKey>(() => readBrowserTabFromLocation());
  const selection = useAppSelectionContext();
  const browserSession = useBrowserSession();

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
  const browserSessionBootstrap = useBrowserSessionBootstrap({
    workspaceId: workspaceData.selectedWorkspaceId,
    repositoryId: selection.selectedRepositoryId,
    snapshot: browserExplorer.selectedSnapshot,
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

  const [topSearchScopeMode, setTopSearchScopeMode] = useState<BrowserTopSearchScopeMode>('selected-scope');

  const browserSessionSummary = browserSession.state.activeSnapshot ? [
    `${browserSession.state.canvasNodes.length} canvas nodes`,
    `${browserSession.state.canvasEdges.length} canvas edges`,
    `${browserSession.state.searchResults.length} local search hits`,
  ].join(' · ') : null;

  const activeTabMeta = browserTabs.find((tab) => tab.key === activeTab) ?? browserTabs[0];
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

  const effectiveTopSearchScopeId = topSearchScopeMode === 'selected-scope'
    ? browserSession.state.selectedScopeId
    : null;

  useEffect(() => {
    if (topSearchScopeMode !== 'selected-scope') {
      return;
    }
    if (browserSession.state.searchScopeId === browserSession.state.selectedScopeId) {
      return;
    }
    browserSession.setSearch(browserSession.state.searchQuery, browserSession.state.selectedScopeId);
  }, [browserSession.state.searchQuery, browserSession.state.searchScopeId, browserSession.state.selectedScopeId, topSearchScopeMode]);

  const handleTopSearchResult = (action: BrowserTopSearchResultAction) => {
    if (action.scopeId) {
      browserSession.selectScope(action.scopeId);
    }
    if (action.type === 'select-scope') {
      browserSession.focusElement({ kind: 'scope', id: action.id });
      browserSession.openFactsPanel('scope', 'right');
      setActiveTab('layout');
      return;
    }
    if (action.type === 'open-entity') {
      browserSession.addEntityToCanvas(action.id);
      browserSession.focusElement({ kind: 'entity', id: action.id });
      browserSession.openFactsPanel('entity', 'right');
      setActiveTab('search');
      return;
    }
    if (action.type === 'open-relationship') {
      browserSession.focusElement({ kind: 'relationship', id: action.id });
      browserSession.openFactsPanel('relationship', 'right');
      setActiveTab('dependencies');
      return;
    }
    browserSession.focusElement(null);
    browserSession.openFactsPanel('hidden', 'right');
    setActiveTab('search');
  };

  const handleAddScopeEntitiesToCanvas = (scopeId: string) => {
    const entityIds = browserSession.state.index?.entityIdsByScopeId.get(scopeId) ?? [];
    entityIds.slice(0, 24).forEach((entityId) => {
      browserSession.addEntityToCanvas(entityId);
    });
    if (entityIds[0]) {
      browserSession.focusElement({ kind: 'entity', id: entityIds[0] });
      browserSession.openFactsPanel('entity', 'right');
    }
    setActiveTab('layout');
  };

  let tabContent;
  if (!workspaceData.selectedWorkspace) {
    tabContent = (
      <article className="card empty-state-card browser-empty-state">
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
      <article className="card empty-state-card browser-empty-state">
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
    <div className="browser-workspace" aria-label="Browser analysis workspace">
      <header className="card browser-workspace__topbar">
        <div className="browser-workspace__topbar-main">
          <div>
            <p className="eyebrow">Browser</p>
            <h2>Analysis workspace</h2>
            <p className="muted browser-workspace__lead">
              Browser is now treated as a dedicated workspace with reduced chrome and top-level local search so the analysis surface can use most of the viewport while keeping navigation and discovery close at hand.
            </p>
          </div>
          <div className="browser-workspace__context-strip" aria-label="Current browser context">
            <span className="badge">Workspace {workspaceData.selectedWorkspace?.name ?? '—'}</span>
            <span className="badge">Repository {repositoryLabel}</span>
            <span className="badge">Snapshot {browserExplorer.selectedSnapshot?.snapshotKey ?? '—'}</span>
            <span className="badge">Mode {activeTabMeta.label}</span>
            {browserSession.state.activeSnapshot ? <span className="badge badge--status">Prepared locally</span> : null}
          </div>
        </div>
        <BrowserTopSearch
          query={browserSession.state.searchQuery}
          onQueryChange={(query) => browserSession.setSearch(query, effectiveTopSearchScopeId)}
          scopeMode={topSearchScopeMode}
          onScopeModeChange={(mode) => {
            setTopSearchScopeMode(mode);
            const nextScopeId = mode === 'selected-scope' ? browserSession.state.selectedScopeId : null;
            browserSession.setSearch(browserSession.state.searchQuery, nextScopeId);
          }}
          selectedScopeLabel={selectedScopeLabel}
          results={browserSession.state.searchResults}
          onActivateResult={handleTopSearchResult}
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

      <div className="browser-workspace__layout">
        <aside className="browser-workspace__rail">
          <div className="browser-workspace__rail-sticky">
            <BrowserNavigationTree
              index={browserSession.state.index}
              selectedScopeId={browserSession.state.selectedScopeId}
              onSelectScope={browserSession.selectScope}
              onAddScopeToCanvas={browserSession.addScopeToCanvas}
            />

            <BrowserTabNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onOpenCompare={onOpenCompare}
              onOpenOperations={onOpenOperations}
              onOpenLegacy={onOpenLegacy}
            />

            <section className="card browser-workspace__mini-context">
              <p className="eyebrow">Current snapshot</p>
              <div className="browser-mini-kv">
                <div>
                  <span>Workspace</span>
                  <strong>{workspaceData.selectedWorkspace?.name ?? '—'}</strong>
                </div>
                <div>
                  <span>Repository</span>
                  <strong>{repositoryLabel}</strong>
                </div>
                <div>
                  <span>Captured</span>
                  <strong>{formatTimestamp(browserExplorer.selectedSnapshot?.importedAt)}</strong>
                </div>
              </div>
            </section>
          </div>
        </aside>

        <section className="browser-workspace__center">
          <section className="card browser-workspace__mode-header">
            <div>
              <p className="eyebrow">Focused mode</p>
              <h3>{activeTabMeta.label}</h3>
              <p className="muted">{activeTabMeta.description}</p>
              <p className="muted browser-workspace__mode-note">The local canvas now owns the Browser center stage. Mode switching still exposes the old detail tooling underneath as a migration tray while later steps complete the move to canvas and facts-driven analysis.</p>
            </div>
            <div className="browser-workspace__mode-meta">
              {browserSessionSummary ? <span className="badge">{browserSessionSummary}</span> : null}
              {browserSession.state.selectedScopeId ? <span className="badge">Scope {browserSession.state.selectedScopeId}</span> : null}
              {browserSession.state.selectedEntityIds.length > 0 ? <span className="badge">{browserSession.state.selectedEntityIds.length} selected entities</span> : null}
            </div>
          </section>

          <div className="browser-workspace__stage">
            <BrowserGraphWorkspace
              state={browserSession.state}
              activeModeLabel={activeTabMeta.label}
              onAddSelectedScope={() => {
                if (!browserSession.state.selectedScopeId) {
                  return;
                }
                browserSession.addScopeToCanvas(browserSession.state.selectedScopeId);
                browserSession.focusElement({ kind: 'scope', id: browserSession.state.selectedScopeId });
                browserSession.openFactsPanel('scope', 'right');
              }}
              onAddScopeEntities={handleAddScopeEntitiesToCanvas}
              onFocusScope={(scopeId) => {
                browserSession.selectScope(scopeId);
                browserSession.focusElement({ kind: 'scope', id: scopeId });
                browserSession.openFactsPanel('scope', 'right');
                setActiveTab('layout');
              }}
              onFocusEntity={(entityId) => {
                browserSession.selectCanvasEntity(entityId);
                browserSession.focusElement({ kind: 'entity', id: entityId });
                browserSession.openFactsPanel('entity', 'right');
                setActiveTab('search');
              }}
              onSelectEntity={(entityId, additive) => {
                browserSession.selectCanvasEntity(entityId, additive);
                browserSession.openFactsPanel('entity', 'right');
              }}
              onFocusRelationship={(relationshipId) => {
                browserSession.focusElement({ kind: 'relationship', id: relationshipId });
                browserSession.openFactsPanel('relationship', 'right');
                setActiveTab('dependencies');
              }}
              onExpandEntityDependencies={(entityId) => {
                browserSession.addDependenciesToCanvas(entityId);
                browserSession.selectCanvasEntity(entityId);
                browserSession.focusElement({ kind: 'entity', id: entityId });
                browserSession.openFactsPanel('entity', 'right');
                setActiveTab('dependencies');
              }}
              onExpandInboundDependencies={(entityId) => {
                browserSession.addDependenciesToCanvas(entityId, 'INBOUND');
                browserSession.selectCanvasEntity(entityId);
                browserSession.focusElement({ kind: 'entity', id: entityId });
                browserSession.openFactsPanel('entity', 'right');
                setActiveTab('dependencies');
              }}
              onExpandOutboundDependencies={(entityId) => {
                browserSession.addDependenciesToCanvas(entityId, 'OUTBOUND');
                browserSession.selectCanvasEntity(entityId);
                browserSession.focusElement({ kind: 'entity', id: entityId });
                browserSession.openFactsPanel('entity', 'right');
                setActiveTab('dependencies');
              }}
              onRemoveEntity={(entityId) => browserSession.removeEntityFromCanvas(entityId)}
              onRemoveSelection={browserSession.removeCanvasSelection}
              onIsolateSelection={browserSession.isolateCanvasSelection}
              onTogglePinNode={browserSession.toggleCanvasNodePin}
              onRelayoutCanvas={browserSession.relayoutCanvas}
              onClearCanvas={browserSession.clearCanvas}
              onFitView={browserSession.fitCanvasView}
            />

            <section className="card browser-workspace__detail-tray">
              <div className="browser-workspace__detail-tray-header">
                <div>
                  <p className="eyebrow">Migration detail tray</p>
                  <h3>{activeTabMeta.label} details</h3>
                  <p className="muted">The old Browser explorer components remain available here during the transition so you can compare the new local canvas workflow with the existing tab-specific detail views.</p>
                </div>
                <div className="browser-workspace__detail-tray-meta">
                  <span className="badge">Legacy detail surface</span>
                  {browserSession.state.focusedElement ? <span className="badge">Focused {browserSession.state.focusedElement.kind}</span> : null}
                </div>
              </div>
              <div className="browser-workspace__detail-tray-body">
                {tabContent}
              </div>
            </section>
          </div>
        </section>

        <aside className="browser-workspace__inspector">
          <BrowserFactsPanel
            state={browserSession.state}
            onSelectScope={(scopeId) => {
              browserSession.selectScope(scopeId);
              if (scopeId) {
                browserSession.focusElement({ kind: 'scope', id: scopeId });
                browserSession.openFactsPanel('scope', 'right');
                setActiveTab('layout');
              }
            }}
            onFocusEntity={(entityId) => {
              browserSession.addEntityToCanvas(entityId);
              browserSession.selectCanvasEntity(entityId);
              browserSession.focusElement({ kind: 'entity', id: entityId });
              browserSession.openFactsPanel('entity', 'right');
              setActiveTab('search');
            }}
            onFocusRelationship={(relationshipId) => {
              browserSession.focusElement({ kind: 'relationship', id: relationshipId });
              browserSession.openFactsPanel('relationship', 'right');
              setActiveTab('dependencies');
            }}
            onTogglePinNode={browserSession.toggleCanvasNodePin}
            onIsolateSelection={browserSession.isolateCanvasSelection}
            onRemoveSelection={browserSession.removeCanvasSelection}
            onClose={() => browserSession.openFactsPanel('hidden', 'right')}
          />

          <section className="card browser-workspace__inspector-card">
            <p className="eyebrow">Session status</p>
            <div className="browser-mini-kv">
              <div>
                <span>Browser session</span>
                <strong>{browserSession.state.activeSnapshot ? 'Open' : 'Not loaded'}</strong>
              </div>
              <div>
                <span>Facts panel mode</span>
                <strong>{browserSession.state.factsPanelMode}</strong>
              </div>
              <div>
                <span>Focused element</span>
                <strong>{browserSession.state.focusedElement ? `${browserSession.state.focusedElement.kind}:${browserSession.state.focusedElement.id}` : 'None'}</strong>
              </div>
            </div>
          </section>

          <section className="card browser-workspace__inspector-card">
            <p className="eyebrow">Prepared model</p>
            {localSnapshotCounts ? (
              <div className="browser-count-grid">
                <div><strong>{localSnapshotCounts.scopes}</strong><span>Scopes</span></div>
                <div><strong>{localSnapshotCounts.entities}</strong><span>Entities</span></div>
                <div><strong>{localSnapshotCounts.relationships}</strong><span>Relationships</span></div>
                <div><strong>{localSnapshotCounts.diagnostics}</strong><span>Diagnostics</span></div>
              </div>
            ) : (
              <p className="muted">Open a prepared snapshot to see local counts.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
