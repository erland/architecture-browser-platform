import { BrowserFactsPanel } from '../components/BrowserFactsPanel';
import { BrowserNavigationTree } from '../components/BrowserNavigationTree';
import { BrowserViewpointControls } from '../components/BrowserViewpointControls';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';


export type BrowserRailPanelProps = {
  browserSession: BrowserSessionContextValue;
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  selectedScopeLabel: string | null;
};

export function BrowserRailPanel({
  browserSession,
  isCollapsed,
  onExpand,
  onCollapse,
  onAddScopeEntitiesToCanvas,
  selectedScopeLabel,
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
        </>
      )}
    </aside>
  );
}
