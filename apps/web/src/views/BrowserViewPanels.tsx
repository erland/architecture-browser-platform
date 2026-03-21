import { BrowserFactsPanel } from '../components/BrowserFactsPanel';
import { BrowserNavigationTree } from '../components/BrowserNavigationTree';
import { BrowserOverviewStrip } from '../components/BrowserOverviewStrip';
import { BrowserViewpointControls } from '../components/BrowserViewpointControls';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { formatTimestamp } from './browserView.shared';

type SnapshotLike = {
  importedAt?: string | null;
};

export type BrowserRailPanelProps = {
  browserSession: BrowserSessionContextValue;
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  selectedScopeLabel: string | null;
  workspaceName: string | null | undefined;
  repositoryLabel: string;
  snapshot: SnapshotLike | null;
};

export function BrowserRailPanel({
  browserSession,
  isCollapsed,
  onExpand,
  onCollapse,
  onAddScopeEntitiesToCanvas,
  selectedScopeLabel,
  workspaceName,
  repositoryLabel,
  snapshot,
}: BrowserRailPanelProps) {
  return (
    <aside className={`browser-workspace__rail ${isCollapsed ? 'browser-workspace__side-panel--collapsed' : ''}`}>
      {isCollapsed ? (
        <button
          type="button"
          className="browser-workspace__collapsed-toggle"
          aria-label="Expand navigation tree"
          onClick={onExpand}
        >
          <span aria-hidden="true">☰</span>
          <span>Navigation</span>
        </button>
      ) : (
        <div className="browser-workspace__rail-sticky">
          <div className="browser-workspace__panel-header">
            <p className="eyebrow">Navigation</p>
            <button type="button" className="button-secondary browser-workspace__panel-toggle" onClick={onCollapse}>Hide</button>
          </div>

          <BrowserNavigationTree
            index={browserSession.state.index}
            selectedScopeId={browserSession.state.selectedScopeId}
            treeMode={browserSession.state.treeMode}
            onSelectScope={browserSession.selectScope}
            onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
            onTreeModeChange={browserSession.setTreeMode}
          />

          <BrowserViewpointControls
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
          />

          <section className="card browser-workspace__mini-context">
            <p className="eyebrow">Current snapshot</p>
            <div className="browser-mini-kv">
              <div>
                <span>Workspace</span>
                <strong>{workspaceName ?? '—'}</strong>
              </div>
              <div>
                <span>Repository</span>
                <strong>{repositoryLabel}</strong>
              </div>
              <div>
                <span>Captured</span>
                <strong>{formatTimestamp(snapshot?.importedAt)}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

export type BrowserInspectorPanelProps = {
  activeTabLabel: string;
  browserSession: BrowserSessionContextValue;
  browserSessionSummary: string | null;
  isCollapsed: boolean;
  localSnapshotCounts: {
    scopes: number;
    entities: number;
    relationships: number;
    diagnostics: number;
  } | null;
  onExpand: () => void;
  onCollapse: () => void;
  onSetActiveTab: (tab: 'layout' | 'search' | 'dependencies') => void;
};

export function BrowserInspectorPanel({
  activeTabLabel,
  browserSession,
  browserSessionSummary,
  isCollapsed,
  localSnapshotCounts,
  onExpand,
  onCollapse,
  onSetActiveTab,
}: BrowserInspectorPanelProps) {
  return (
    <aside className={`browser-workspace__inspector ${isCollapsed ? 'browser-workspace__side-panel--collapsed' : ''}`}>
      {isCollapsed ? (
        <button
          type="button"
          className="browser-workspace__collapsed-toggle"
          aria-label="Expand facts panel"
          onClick={onExpand}
        >
          <span aria-hidden="true">ⓘ</span>
          <span>Details</span>
        </button>
      ) : (
        <>
          <div className="browser-workspace__panel-header browser-workspace__panel-header--inspector">
            <p className="eyebrow">Details</p>
            <button type="button" className="button-secondary browser-workspace__panel-toggle" onClick={onCollapse}>Hide</button>
          </div>

          <BrowserFactsPanel
            state={browserSession.state}
            onSelectScope={(scopeId) => {
              browserSession.selectScope(scopeId);
              if (scopeId) {
                browserSession.focusElement({ kind: 'scope', id: scopeId });
                browserSession.openFactsPanel('scope', 'right');
                onSetActiveTab('layout');
              }
            }}
            onFocusEntity={(entityId) => {
              browserSession.addEntityToCanvas(entityId);
              browserSession.selectCanvasEntity(entityId);
              browserSession.focusElement({ kind: 'entity', id: entityId });
              browserSession.openFactsPanel('entity', 'right');
              onSetActiveTab('search');
            }}
            onFocusRelationship={(relationshipId) => {
              browserSession.focusElement({ kind: 'relationship', id: relationshipId });
              browserSession.openFactsPanel('relationship', 'right');
              onSetActiveTab('dependencies');
            }}
            onAddEntities={(entityIds) => {
              browserSession.addEntitiesToCanvas(entityIds);
              const focusEntityId = entityIds[0];
              if (focusEntityId) {
                browserSession.selectCanvasEntity(focusEntityId);
                browserSession.focusElement({ kind: 'entity', id: focusEntityId });
                browserSession.openFactsPanel('entity', 'right');
                onSetActiveTab('search');
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
                <strong>{activeTabLabel}</strong>
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
  );
}
