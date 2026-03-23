import { getScopeTreeNodesForMode, type BrowserSnapshotIndex, type BrowserScopeTreeNode, type BrowserTreeMode } from '../browserSnapshotIndex';
import { TREE_MODE_META, buildScopeCategoryGroups, collectAncestorScopeIds, computeDefaultExpandedCategories, computeDefaultExpandedScopeIds } from './browserNavigationTree.model';
import { useBrowserNavigationTreeState } from './browserNavigationTree.state';

type BrowserNavigationTreeProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  treeMode: BrowserTreeMode;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  onTreeModeChange: (treeMode: BrowserTreeMode) => void;
};

function TreeBranch({
  index,
  node,
  treeMode,
  selectedScopeId,
  expandedScopeIds,
  onToggle,
  onSelectScope,
  onAddScopeEntitiesToCanvas,
}: {
  index: BrowserSnapshotIndex;
  node: BrowserScopeTreeNode;
  treeMode: BrowserTreeMode;
  selectedScopeId: string | null;
  expandedScopeIds: Set<string>;
  onToggle: (scopeId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
}) {
  const children = getScopeTreeNodesForMode(index, node.scopeId, treeMode);
  const isExpanded = expandedScopeIds.has(node.scopeId);
  const isSelected = selectedScopeId === node.scopeId;
  return (
    <li className="browser-tree__item">
      <div className={isSelected ? 'browser-tree__row browser-tree__row--active' : 'browser-tree__row'}>
        <button
          type="button"
          className={children.length > 0 ? 'browser-tree__toggle' : 'browser-tree__toggle browser-tree__toggle--empty'}
          onClick={() => children.length > 0 && onToggle(node.scopeId)}
          aria-label={children.length > 0 ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.displayName}` : `${node.displayName} has no child scopes`}
          aria-expanded={children.length > 0 ? isExpanded : undefined}
          disabled={children.length === 0}
        >
          {children.length > 0 ? (isExpanded ? '▾' : '▸') : '•'}
        </button>

        <button
          type="button"
          className="browser-tree__node-button"
          onClick={() => onSelectScope(node.scopeId)}
          onDoubleClick={() => onAddScopeEntitiesToCanvas(node.scopeId)}
          title={`${node.displayName} — double-click to add primary entities to canvas`}
        >
          <span className="browser-tree__node-title">{node.displayName}</span>
        </button>

        <button
          type="button"
          className="browser-tree__canvas-button"
          onClick={() => onAddScopeEntitiesToCanvas(node.scopeId)}
          aria-label={`Add primary entities for ${node.displayName} to canvas`}
          title={`Add primary entities for ${node.displayName} to canvas`}
        >
          +
        </button>
      </div>

      {children.length > 0 && isExpanded ? (
        <ul className="browser-tree__children" role="group">
          {children.map((child) => (
            <TreeBranch
              key={child.scopeId}
              index={index}
              node={child}
              treeMode={treeMode}
              selectedScopeId={selectedScopeId}
              expandedScopeIds={expandedScopeIds}
              onToggle={onToggle}
              onSelectScope={onSelectScope}
              onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function BrowserNavigationTree({ index, selectedScopeId, treeMode, onSelectScope, onAddScopeEntitiesToCanvas, onTreeModeChange }: BrowserNavigationTreeProps) {
  const {
    categoryGroups,
    totalDescendants,
    totalDirectEntities,
    defaultTreeMode,
    expandedSet,
    expandedCategorySet,
    toggleScope,
    toggleCategory,
    expandAll,
    collapseToSelection,
  } = useBrowserNavigationTreeState(index, selectedScopeId, treeMode);

  if (!index) {
    return (
      <section className="card browser-navigation-tree browser-navigation-tree--empty">
        <p className="eyebrow">Navigation tree</p>
        <h2 className="app-nav__title">Scope explorer</h2>
        <p className="muted app-nav__lead">Prepare a snapshot locally to browse its scope tree in the Browser left rail.</p>
      </section>
    );
  }

  return (
    <section className="card browser-navigation-tree" aria-label="Scope navigation tree">
      <div className="browser-navigation-tree__header">
        <div>
          <p className="eyebrow">Navigation tree</p>
          <h2 className="app-nav__title">Scope explorer</h2>
        </div>
        <div className="browser-navigation-tree__actions">
          <button type="button" className="button-secondary" onClick={expandAll}>Expand</button>
          <button type="button" className="button-secondary" onClick={collapseToSelection}>Focus</button>
        </div>
      </div>

      <div className="browser-navigation-tree__modes" role="group" aria-label="Tree mode">
        {(Object.entries(TREE_MODE_META) as Array<[BrowserTreeMode, { label: string; description: string }]>)
          .map(([mode, meta]) => (
            <button
              key={mode}
              type="button"
              className={treeMode === mode ? 'button-secondary browser-navigation-tree__mode-button browser-navigation-tree__mode-button--active' : 'button-secondary browser-navigation-tree__mode-button'}
              onClick={() => onTreeModeChange(mode)}
              title={meta.description}
              aria-pressed={treeMode === mode}
            >
              {meta.label}
            </button>
          ))}
      </div>

      <div className="browser-navigation-tree__summary">
        <span className="badge">{index.payload.scopes.length} scopes</span>
        <span className="badge">{index.payload.entities.length} entities</span>
        <span className="badge">{totalDescendants} nested scopes</span>
        <span className="badge">{totalDirectEntities} direct entities</span>
      </div>

      <ul className="browser-tree" role="tree">
        {categoryGroups.map((group) => {
          const isExpanded = expandedCategorySet.has(group.kind);
          return (
            <li key={group.kind} className="browser-tree__item">
              <div className="browser-tree__row browser-tree__row--category">
                <button
                  type="button"
                  className="browser-tree__toggle"
                  onClick={() => toggleCategory(group.kind)}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.label}`}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? '▾' : '▸'}
                </button>
                <div className="browser-tree__node-button browser-tree__node-button--static">
                  <span className="browser-tree__node-title">{group.label}</span>
                </div>
              </div>

              {isExpanded ? (
                <ul className="browser-tree__children" role="group">
                  {group.nodes.map((root) => (
                    <TreeBranch
                      key={root.scopeId}
                      index={index}
                      node={root}
                      treeMode={treeMode}
                      selectedScopeId={selectedScopeId}
                      expandedScopeIds={expandedSet}
                      onToggle={toggleScope}
                      onSelectScope={onSelectScope}
                      onAddScopeEntitiesToCanvas={onAddScopeEntitiesToCanvas}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      <footer className="browser-navigation-tree__footer">
        <div className="browser-navigation-tree__summary">
          <span className="badge">{index.payload.scopes.length} scopes</span>
          <span className="badge">{index.payload.entities.length} entities</span>
          <span className="badge">{totalDescendants} nested</span>
          <span className="badge">{totalDirectEntities} direct</span>
        </div>
        <p className="muted browser-navigation-tree__footer-note">
          {TREE_MODE_META[treeMode].description}. Default: <strong>{TREE_MODE_META[defaultTreeMode].label}</strong>.
        </p>
      </footer>
    </section>
  );
}

export {
  buildScopeCategoryGroups,
  collectAncestorScopeIds,
  computeDefaultExpandedCategories,
  computeDefaultExpandedScopeIds,
};
