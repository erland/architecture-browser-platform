import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { BrowserFactsPanel } from '../components/BrowserFactsPanel';
import { BrowserGraphWorkspace } from '../components/BrowserGraphWorkspace';
import { BrowserOverviewStrip } from '../components/BrowserOverviewStrip';
import { BrowserNavigationTree } from '../components/BrowserNavigationTree';
import { getContainedEntitiesForEntity, getContainingEntitiesForEntity, getDirectEntitiesForScopeByKind, getPrimaryEntitiesForScope, getSubtreeEntitiesForScopeByKind } from '../browserSnapshotIndex';
import { BrowserTabNav } from '../components/BrowserTabNav';
import { BrowserTopSearch, type BrowserTopSearchResultAction, type BrowserTopSearchScopeMode } from '../components/BrowserTopSearch';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
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
function clampWidth(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readStoredPaneWidth(key: string, fallback: number) {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}


export function BrowserView({ onOpenWorkspaces, onOpenSnapshots, onOpenRepositories, onOpenCompare, onOpenOperations, onOpenLegacy }: BrowserViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BrowserTabKey>(() => readBrowserTabFromLocation());
  const [topSearchScopeMode, setTopSearchScopeMode] = useState<BrowserTopSearchScopeMode>('selected-scope');
  const [railWidth, setRailWidth] = useState<number>(() => readStoredPaneWidth('browser.railWidth', 280));
  const [inspectorWidth, setInspectorWidth] = useState<number>(() => readStoredPaneWidth('browser.inspectorWidth', 320));
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(() => readStoredPaneWidth('browser.railCollapsed', 0) === 1);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(() => readStoredPaneWidth('browser.inspectorCollapsed', 0) === 1);
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
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.railWidth', String(railWidth));
  }, [railWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.inspectorWidth', String(inspectorWidth));
  }, [inspectorWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.railCollapsed', isRailCollapsed ? '1' : '0');
  }, [isRailCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('browser.inspectorCollapsed', isInspectorCollapsed ? '1' : '0');
  }, [isInspectorCollapsed]);

  const startPaneResize = (pane: 'rail' | 'inspector') => (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startingX = event.clientX;
    const startingRailWidth = railWidth;
    const startingInspectorWidth = inspectorWidth;
    document.body.classList.add('browser-resize-active');

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startingX;
      if (pane === 'rail') {
        setRailWidth(clampWidth(startingRailWidth + delta, 220, 460));
        return;
      }
      setInspectorWidth(clampWidth(startingInspectorWidth - delta, 260, 520));
    };

    const handleMouseUp = () => {
      document.body.classList.remove('browser-resize-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const layoutStyle = {
    '--browser-rail-width': `${railWidth}px`,
    '--browser-inspector-width': `${inspectorWidth}px`,
    '--browser-layout-columns': `${isRailCollapsed ? '48px' : `minmax(220px, ${railWidth}px)`} ${isRailCollapsed ? '0px' : '8px'} minmax(0, 1fr) ${isInspectorCollapsed ? '0px' : '8px'} ${isInspectorCollapsed ? '48px' : `minmax(260px, ${inspectorWidth}px)`}`,
  } as CSSProperties;


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
    const targetScopeId = action.kind === 'scope' ? action.id : action.scopeId;
    if (targetScopeId) {
      browserSession.selectScope(targetScopeId);
    }
    if (action.type === 'select-scope') {
      browserSession.focusElement({ kind: 'scope', id: action.id });
      browserSession.openFactsPanel('scope', 'right');
      setActiveTab('layout');
      return;
    }
    if (action.type === 'add-scope-primary-entities') {
      handleAddPrimaryScopeEntitiesToCanvas(action.id);
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

  const focusCanvasEntities = (entityIds: string[], fallbackScopeId?: string) => {
    const trimmedEntityIds = [...new Set(entityIds)].slice(0, 24);
    browserSession.addEntitiesToCanvas(trimmedEntityIds);
    if (fallbackScopeId) {
      browserSession.selectScope(fallbackScopeId);
    }
    if (trimmedEntityIds[0]) {
      browserSession.focusElement({ kind: 'entity', id: trimmedEntityIds[0] });
      browserSession.openFactsPanel('entity', 'right');
    } else if (fallbackScopeId) {
      browserSession.focusElement({ kind: 'scope', id: fallbackScopeId });
      browserSession.openFactsPanel('scope', 'right');
    }
    setActiveTab('layout');
  };

  const handleAddScopeAnalysisToCanvas = (scopeId: string, mode: 'primary' | 'direct' | 'subtree' | 'children-primary', kinds?: string[], childScopeKinds?: string[]) => {
    const index = browserSession.state.index;
    if (!index) {
      return;
    }

    let entityIds: string[] = [];
    if (mode === 'primary') {
      entityIds = getPrimaryEntitiesForScope(index, scopeId).map((entity) => entity.externalId);
    } else if (mode === 'direct') {
      entityIds = getDirectEntitiesForScopeByKind(index, scopeId, kinds).map((entity) => entity.externalId);
    } else if (mode === 'subtree') {
      entityIds = getSubtreeEntitiesForScopeByKind(index, scopeId, kinds).map((entity) => entity.externalId);
    } else {
      const allowedChildKinds = childScopeKinds && childScopeKinds.length > 0 ? new Set(childScopeKinds) : null;
      const childScopeIds = (index.childScopeIdsByParentId.get(scopeId) ?? []).filter((childScopeId) => {
        if (!allowedChildKinds) {
          return true;
        }
        return allowedChildKinds.has(index.scopesById.get(childScopeId)?.kind ?? '');
      });
      const collected = childScopeIds.flatMap((childScopeId) => getPrimaryEntitiesForScope(index, childScopeId).map((entity) => entity.externalId));
      entityIds = kinds && kinds.length > 0
        ? collected.filter((entityId) => kinds.includes(index.entitiesById.get(entityId)?.kind ?? ''))
        : collected;
    }

    focusCanvasEntities(entityIds, scopeId);
  };

  const handleAddPrimaryScopeEntitiesToCanvas = (scopeId: string) => {
    handleAddScopeAnalysisToCanvas(scopeId, 'primary');
  };

  const handleAddContainedEntitiesToCanvas = (entityId: string, kinds?: string[]) => {
    const index = browserSession.state.index;
    if (!index) {
      return;
    }
    const entityIds = getContainedEntitiesForEntity(index, entityId)
      .filter((entity) => !kinds || kinds.includes(entity.kind))
      .map((entity) => entity.externalId);
    const fallbackScopeId = index.entitiesById.get(entityId)?.scopeId ?? undefined;
    focusCanvasEntities(entityIds, fallbackScopeId);
  };

  const handleAddPeerEntitiesToCanvas = (entityId: string, containerKinds?: string[], peerKinds?: string[]) => {
    const index = browserSession.state.index;
    if (!index) {
      return;
    }
    const allowedContainerKinds = containerKinds && containerKinds.length > 0 ? new Set(containerKinds) : null;
    const containers = getContainingEntitiesForEntity(index, entityId).filter((entity) => !allowedContainerKinds || allowedContainerKinds.has(entity.kind));
    const peerIds = new Set<string>();
    for (const container of containers) {
      for (const peer of getContainedEntitiesForEntity(index, container.externalId)) {
        if (peer.externalId === entityId) {
          continue;
        }
        if (peerKinds && peerKinds.length > 0 && !peerKinds.includes(peer.kind)) {
          continue;
        }
        peerIds.add(peer.externalId);
      }
    }
    const fallbackScopeId = index.entitiesById.get(entityId)?.scopeId ?? undefined;
    focusCanvasEntities([...peerIds], fallbackScopeId);
  };

  const selectedSnapshotLabel = selectedSnapshot?.snapshotKey
    ?? browserSession.state.activeSnapshot?.snapshotKey
    ?? '—';

  const centerContent = !workspaceData.selectedWorkspace ? (
    <article className="card empty-state-card browser-empty-state">
      <h2>No workspace selected</h2>
      <p className="muted">Choose a workspace first, then select a snapshot to enter the focused Browser experience.</p>
      <div className="actions">
        <button type="button" onClick={onOpenRepositories}>Open Repositories</button>
        <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Open Snapshots</button>
      </div>
    </article>
  ) : !selectedSnapshot ? (
    <article className="card empty-state-card browser-empty-state">
      <h2>No snapshot selected</h2>
      <p className="muted">Use the Snapshots view to choose an imported snapshot, prepare it locally, then return here to browse the architecture fully in-browser.</p>
      <div className="actions">
        <button type="button" onClick={onOpenSnapshots}>Open Snapshots</button>
        <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
      </div>
    </article>
  ) : !browserSession.state.index || !browserSession.state.payload ? (
    <article className="card empty-state-card browser-empty-state">
      <h2>Prepared Browser session required</h2>
      <p className="muted">This Browser route now depends entirely on the prepared local snapshot payload and indexes. Prepare the snapshot from Snapshots before continuing.</p>
      <div className="actions">
        <button type="button" onClick={onOpenSnapshots}>Prepare snapshot</button>
        <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
      </div>
    </article>
  ) : (
    <>
      <div className="browser-workspace__stage">
        <BrowserGraphWorkspace
          state={browserSession.state}
          activeModeLabel={activeTabMeta.label}
          onShowScopeContainer={(scopeId) => {
            const focusedScopeId = browserSession.state.focusedElement?.kind === 'scope'
              ? browserSession.state.focusedElement.id
              : null;
            const targetScopeId = scopeId ?? focusedScopeId ?? browserSession.state.selectedScopeId;
            if (!targetScopeId) {
              return;
            }
            browserSession.addScopeToCanvas(targetScopeId);
            browserSession.selectScope(targetScopeId);
            browserSession.focusElement({ kind: 'scope', id: targetScopeId });
            browserSession.openFactsPanel('scope', 'right');
          }}
          onAddScopeAnalysis={handleAddScopeAnalysisToCanvas}
          onAddContainedEntities={handleAddContainedEntitiesToCanvas}
          onAddPeerEntities={handleAddPeerEntitiesToCanvas}
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
          onMoveCanvasNode={browserSession.moveCanvasNode}
          onSetCanvasViewport={browserSession.setCanvasViewport}
          onArrangeAllCanvasNodes={browserSession.arrangeAllCanvasNodes}
          onArrangeCanvasAroundFocus={browserSession.arrangeCanvasAroundFocus}
          onClearCanvas={browserSession.clearCanvas}
          onFitView={browserSession.fitCanvasView}
        />
      </div>
    </>
  );

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

      <div className="browser-workspace__layout" style={layoutStyle}>
        <aside className={`browser-workspace__rail ${isRailCollapsed ? 'browser-workspace__side-panel--collapsed' : ''}`}>
          {isRailCollapsed ? (
            <button
              type="button"
              className="browser-workspace__collapsed-toggle"
              aria-label="Expand navigation tree"
              onClick={() => setIsRailCollapsed(false)}
            >
              <span aria-hidden="true">☰</span>
              <span>Navigation</span>
            </button>
          ) : (
            <div className="browser-workspace__rail-sticky">
              <div className="browser-workspace__panel-header">
                <p className="eyebrow">Navigation</p>
                <button type="button" className="button-secondary browser-workspace__panel-toggle" onClick={() => setIsRailCollapsed(true)}>Hide</button>
              </div>

              <BrowserNavigationTree
                index={browserSession.state.index}
                selectedScopeId={browserSession.state.selectedScopeId}
                treeMode={browserSession.state.treeMode}
                onSelectScope={browserSession.selectScope}
                onAddScopeEntitiesToCanvas={handleAddPrimaryScopeEntitiesToCanvas}
                onTreeModeChange={browserSession.setTreeMode}
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
                    <strong>{formatTimestamp(selectedSnapshot?.importedAt)}</strong>
                  </div>
                </div>
              </section>
            </div>
          )}
        </aside>

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--rail ${isRailCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation tree"
          onMouseDown={isRailCollapsed ? undefined : startPaneResize('rail')}
        />

        <section className="browser-workspace__center">
          {centerContent}
        </section>

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--inspector ${isInspectorCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize facts panel"
          onMouseDown={isInspectorCollapsed ? undefined : startPaneResize('inspector')}
        />

        <aside className={`browser-workspace__inspector ${isInspectorCollapsed ? 'browser-workspace__side-panel--collapsed' : ''}`}>
          {isInspectorCollapsed ? (
            <button
              type="button"
              className="browser-workspace__collapsed-toggle"
              aria-label="Expand facts panel"
              onClick={() => setIsInspectorCollapsed(false)}
            >
              <span aria-hidden="true">ⓘ</span>
              <span>Details</span>
            </button>
          ) : (
            <>
              <div className="browser-workspace__panel-header browser-workspace__panel-header--inspector">
                <p className="eyebrow">Details</p>
                <button type="button" className="button-secondary browser-workspace__panel-toggle" onClick={() => setIsInspectorCollapsed(true)}>Hide</button>
              </div>

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
                onAddEntities={(entityIds) => {
                  browserSession.addEntitiesToCanvas(entityIds);
                  const focusEntityId = entityIds[0];
                  if (focusEntityId) {
                    browserSession.selectCanvasEntity(focusEntityId);
                    browserSession.focusElement({ kind: 'entity', id: focusEntityId });
                    browserSession.openFactsPanel('entity', 'right');
                    setActiveTab('search');
                  }
                }}
                onTogglePinNode={browserSession.toggleCanvasNodePin}
                onIsolateSelection={browserSession.isolateCanvasSelection}
                onRemoveSelection={browserSession.removeCanvasSelection}
                onClose={() => browserSession.openFactsPanel('hidden', 'right')}
              />

              <section className="card browser-workspace__inspector-card">
                <p className="eyebrow">Local analysis focus</p>
                <div className="browser-mini-kv">
                  <div>
                    <span>Mode</span>
                    <strong>{activeTabMeta.label}</strong>
                  </div>
                  <div>
                    <span>Focused element</span>
                    <strong>{browserSession.state.focusedElement ? `${browserSession.state.focusedElement.kind}:${browserSession.state.focusedElement.id}` : 'None'}</strong>
                  </div>
                  <div>
                    <span>Session</span>
                    <strong>{browserSession.state.activeSnapshot ? 'Open' : 'Not loaded'}</strong>
                  </div>
                </div>
                <div className="browser-workspace__mode-meta browser-workspace__mode-meta--compact">
                  {browserSessionSummary ? <span className="badge">{browserSessionSummary}</span> : null}
                  {browserSession.state.selectedScopeId ? <span className="badge">Scope {browserSession.state.selectedScopeId}</span> : null}
                  {browserSession.state.selectedEntityIds.length > 0 ? <span className="badge">{browserSession.state.selectedEntityIds.length} selected entities</span> : null}
                  <span className="badge badge--status">Local-only Browser</span>
                </div>
              </section>

              <BrowserOverviewStrip state={browserSession.state} />

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
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
