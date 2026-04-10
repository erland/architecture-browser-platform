import type { BrowserSearchResult, BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState } from '../../browser-session/focus-types';
import { TREE_MODE_META } from './browserNavigationTree.shared';
import { useBrowserNavigationTreeController } from './browserNavigationTree.controller';
import { resolveBrowsableNavigationTreeMode } from './browserNavigationTree.rootPresentation';
import {
  BrowserNavigationTreeModeButtons,
  BrowserNavigationTreeNode,
  toRootNavigationScopeNode,
} from './browserNavigationTree.presentation';

type BrowserNavigationTreeProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  treeMode: BrowserTreeMode;
  onSelectScope: (scopeId: string) => void;
  selectedEntityIds: string[];
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  onSelectEntity: (entityId: string, scopeId: string, additive?: boolean) => void;
  onAddEntityToCanvas: (entityId: string, scopeId: string) => void;
  onTreeModeChange: (treeMode: BrowserTreeMode) => void;
  persistedTreeState?: BrowserNavigationTreeViewState | null;
  onTreeStateChange?: (state: BrowserNavigationTreeViewState) => void;
  searchQuery?: string;
  searchResults?: BrowserSearchResult[];
  selectedViewpointId?: string | null;
};

function BrowserNavigationTreeHeader({
  onExpand,
  onCollapse,
  onFocus,
}: {
  onExpand: () => void;
  onCollapse: () => void;
  onFocus: () => void;
}) {
  return (
    <div className="browser-navigation-tree__header">
      <div>
        <p className="eyebrow">Navigation tree</p>
        <h2 className="app-nav__title">Scope explorer</h2>
      </div>
      <div className="browser-navigation-tree__actions">
        <button type="button" className="button-secondary" onClick={onExpand}>Expand</button>
        <button type="button" className="button-secondary" onClick={onCollapse}>Collapse</button>
        <button type="button" className="button-secondary" onClick={onFocus}>Focus</button>
      </div>
    </div>
  );
}

function BrowserNavigationTreeStatus({
  selectedEntityIds,
  searchQuery,
  searchResultsCount,
  selectedViewpointId,
}: {
  selectedEntityIds: string[];
  searchQuery: string;
  searchResultsCount: number;
  selectedViewpointId: string | null;
}) {
  return (
    <>
      {selectedEntityIds.length > 0 ? (
        <div className="browser-navigation-tree__search-meta">
          <span className="badge">{selectedEntityIds.length} selected</span>
          <span className="muted">Drag selected entities into the canvas or use the row + button to add them.</span>
        </div>
      ) : null}

      {searchQuery.trim() ? (
        <div className="browser-navigation-tree__search-meta">
          <span className="badge">Filtered by local search</span>
          <span className="muted">{searchResultsCount} matching results</span>
        </div>
      ) : null}

      {selectedViewpointId ? (
        <div className="browser-navigation-tree__search-meta">
          <span className="badge">Biased by viewpoint</span>
          <span className="muted">Relevant entity kinds are prioritized, but all entity kinds remain visible.</span>
        </div>
      ) : null}
    </>
  );
}

function BrowserNavigationTreeEmptyState() {
  return (
    <section className="card browser-navigation-tree browser-navigation-tree--empty">
      <p className="eyebrow">Navigation tree</p>
      <h2 className="app-nav__title">Scope explorer</h2>
      <p className="muted app-nav__lead">Prepare a snapshot locally to browse its scope tree in the Browser left rail.</p>
    </section>
  );
}

export function BrowserNavigationTree({ index, selectedScopeId, selectedEntityIds, treeMode, onSelectScope, onAddScopeEntitiesToCanvas, onSelectEntity, onAddEntityToCanvas, onTreeModeChange, persistedTreeState = null, onTreeStateChange, searchQuery = '', searchResults = [], selectedViewpointId = null }: BrowserNavigationTreeProps) {
  const effectiveTreeMode = resolveBrowsableNavigationTreeMode(index, treeMode);

  const {
    roots,
    defaultTreeMode,
    expandedSet,
    expandedEntitySet,
    expandedChildListSet,
    toggleScope,
    toggleEntity,
    toggleChildList,
    expandAll,
    collapseToSelection,
    collapseAll,
    searchVisibility,
  } = useBrowserNavigationTreeController({
    index,
    selectedScopeId,
    selectedEntityIds,
    treeMode: effectiveTreeMode,
    persistedTreeState,
    onTreeStateChange,
    searchQuery,
    searchResults,
  });

  const visibleScopeIds = searchVisibility?.scopeIds ?? null;
  const visibleEntityIds = searchVisibility?.entityIds ?? null;
  const isSearchActive = searchQuery.trim().length > 0;

  if (!index) {
    return <BrowserNavigationTreeEmptyState />;
  }

  return (
    <section className="card browser-navigation-tree" aria-label="Scope navigation tree">
      <BrowserNavigationTreeHeader onExpand={expandAll} onCollapse={collapseAll} onFocus={collapseToSelection} />

      <BrowserNavigationTreeStatus
        selectedEntityIds={selectedEntityIds}
        searchQuery={searchQuery}
        searchResultsCount={searchResults.length}
        selectedViewpointId={selectedViewpointId}
      />

      <BrowserNavigationTreeModeButtons
        effectiveTreeMode={effectiveTreeMode}
        onTreeModeChange={onTreeModeChange}
      />

      <ul className="browser-tree" role="tree">
        {roots.map((root) => (
          <BrowserNavigationTreeNode
            key={root.scopeId}
            index={index}
            node={toRootNavigationScopeNode(root)}
            treeMode={effectiveTreeMode}
            selectedScopeId={selectedScopeId}
            expandedScopeIds={expandedSet}
            expandedEntityIds={expandedEntitySet}
            onToggle={toggleScope}
            onToggleEntity={toggleEntity}
            onToggleChildList={toggleChildList}
            onSelectScope={onSelectScope}
            onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
            selectedEntityIds={selectedEntityIds}
            onSelectEntity={onSelectEntity}
            onAddEntityToCanvas={onAddEntityToCanvas}
            visibleScopeIds={visibleScopeIds}
            visibleEntityIds={visibleEntityIds}
            expandedChildListIds={expandedChildListSet}
            isSearchActive={isSearchActive}
            selectedViewpointId={selectedViewpointId}
          />
        ))}
      </ul>

      <footer className="browser-navigation-tree__footer">
        <p className="muted browser-navigation-tree__footer-note">
          {TREE_MODE_META[effectiveTreeMode].description}. Default: <strong>{TREE_MODE_META[defaultTreeMode === 'package' ? 'package' : 'filesystem'].label}</strong>.
        </p>
      </footer>
    </section>
  );
}

export {
  buildNavigationChildNodes,
  buildNavigationEntityChildNodes,
} from './browserNavigationTree.nodes';
export { buildScopeCategoryGroups } from './browserNavigationTree.expansion';
export {
  collectAncestorScopeIds,
  computeCollapsedAutoExpandState,
  computeCollapsedScopeIds,
  computeDefaultExpandedCategories,
  computeDefaultExpandedScopeIds,
  computeFocusExpandedState,
  computeSingleChildAutoExpandState,
} from './browserNavigationTree.expansion';
