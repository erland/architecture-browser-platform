import { BrowserFactsPanel } from '../components/BrowserFactsPanel';
import { BrowserNavigationTree } from '../components/BrowserNavigationTree';
import { buildNavigationTreeSummary } from '../components/browserNavigationTree.model';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';


export type BrowserRailPanelProps = {
  browserSession: BrowserSessionContextValue;
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  onOpenViewpoints: () => void;
};

export function BrowserRailPanel({
  browserSession,
  isCollapsed,
  onExpand,
  onCollapse,
  onAddScopeEntitiesToCanvas,
  onOpenViewpoints,
}: BrowserRailPanelProps) {
  const navigationSummary = browserSession.state.index
    ? buildNavigationTreeSummary(browserSession.state.index, browserSession.state.treeMode)
    : null;

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
            <div className="browser-workspace__panel-header-actions">
              <button type="button" className="button-secondary browser-workspace__panel-toggle" onClick={onOpenViewpoints}>Viewpoints</button>
              <button type="button" className="button-secondary browser-workspace__panel-toggle" onClick={onCollapse}>Hide</button>
            </div>
          </div>

          <BrowserNavigationTree
            index={browserSession.state.index}
            selectedScopeId={browserSession.state.selectedScopeId}
            treeMode={browserSession.state.treeMode}
            onSelectScope={browserSession.navigation.selectScope}
            onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
            onTreeModeChange={browserSession.navigation.setTreeMode}
          />


          {navigationSummary ? (
            <footer className="browser-workspace__rail-footer">
              <div className="browser-navigation-tree__summary">
                <span className="badge">{browserSession.state.index?.payload.scopes.length ?? 0} scopes</span>
                <span className="badge">{navigationSummary.totalDescendants} nested</span>
                <span className="badge">{browserSession.state.index?.payload.entities.length ?? 0} entities</span>
                <span className="badge">{navigationSummary.totalDirectEntities} direct</span>
              </div>
            </footer>
          ) : null}

        </div>
      )}
    </aside>
  );
}

export type BrowserInspectorPanelProps = {
  browserSession: BrowserSessionContextValue;
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onSetActiveTab: (tab: 'layout' | 'search' | 'dependencies') => void;
};

export function BrowserInspectorPanel({
  browserSession,
  isCollapsed,
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
              browserSession.navigation.selectScope(scopeId);
              if (scopeId) {
                browserSession.factsPanel.focusElement({ kind: 'scope', id: scopeId });
                browserSession.factsPanel.open('scope', 'right');
                onSetActiveTab('layout');
              }
            }}
            onFocusEntity={(entityId) => {
              browserSession.canvas.addEntityToCanvas(entityId);
              browserSession.canvas.selectEntity(entityId);
              browserSession.factsPanel.focusElement({ kind: 'entity', id: entityId });
              browserSession.factsPanel.open('entity', 'right');
              onSetActiveTab('search');
            }}
            onFocusRelationship={(relationshipId) => {
              browserSession.factsPanel.focusElement({ kind: 'relationship', id: relationshipId });
              browserSession.factsPanel.open('relationship', 'right');
              onSetActiveTab('dependencies');
            }}
            onAddEntities={(entityIds) => {
              browserSession.canvas.addEntitiesToCanvas(entityIds);
              const focusEntityId = entityIds[0];
              if (focusEntityId) {
                browserSession.canvas.selectEntity(focusEntityId);
                browserSession.factsPanel.focusElement({ kind: 'entity', id: focusEntityId });
                browserSession.factsPanel.open('entity', 'right');
                onSetActiveTab('search');
              }
            }}
            onTogglePinNode={browserSession.canvas.toggleNodePin}
            onIsolateSelection={browserSession.canvas.isolateSelection}
            onRemoveSelection={browserSession.canvas.removeSelection}
            onClose={() => browserSession.factsPanel.open('hidden', 'right')}
          />
        </>
      )}
    </aside>
  );
}
