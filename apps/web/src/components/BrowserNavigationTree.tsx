import { useEffect, useMemo, useState } from 'react';
import {
  collectVisibleAncestorScopeIds,
  detectDefaultBrowserTreeMode,
  getScopeTreeNodesForMode,
  isScopeVisibleInTreeMode,
  type BrowserSnapshotIndex,
  type BrowserScopeTreeNode,
  type BrowserTreeMode,
} from '../browserSnapshotIndex';

type BrowserNavigationTreeProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  treeMode: BrowserTreeMode;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
  onTreeModeChange: (treeMode: BrowserTreeMode) => void;
};

type BrowserScopeCategoryGroup = {
  kind: string;
  label: string;
  nodes: BrowserScopeTreeNode[];
};

const TREE_MODE_META: Record<BrowserTreeMode, { label: string; description: string }> = {
  filesystem: { label: 'Filesystem', description: 'Directory and file structure' },
  package: { label: 'Package', description: 'Package-focused structure' },
  advanced: { label: 'All scopes', description: 'Full scope/debug view' },
};

function toCategoryLabel(kind: string) {
  return kind.replace(/_/g, ' ').toLocaleLowerCase().replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase());
}

export function collectAncestorScopeIds(index: BrowserSnapshotIndex, scopeId: string | null, treeMode: BrowserTreeMode = 'advanced') {
  if (!scopeId) {
    return [] as string[];
  }
  if (treeMode === 'advanced') {
    const ancestors: string[] = [];
    const seen = new Set<string>();
    let current = index.scopesById.get(scopeId);
    while (current?.parentScopeId && !seen.has(current.parentScopeId)) {
      seen.add(current.parentScopeId);
      ancestors.unshift(current.parentScopeId);
      current = index.scopesById.get(current.parentScopeId);
    }
    return ancestors;
  }
  return collectVisibleAncestorScopeIds(index, scopeId, treeMode);
}

export function computeDefaultExpandedScopeIds(index: BrowserSnapshotIndex | null, selectedScopeId: string | null, treeMode: BrowserTreeMode = 'advanced') {
  if (!index) {
    return [] as string[];
  }
  const rootIds = getScopeTreeNodesForMode(index, null, treeMode).map((node) => node.scopeId);
  const selectedIds = selectedScopeId && isScopeVisibleInTreeMode(index, selectedScopeId, treeMode) ? [selectedScopeId] : [];
  return [...new Set([...rootIds, ...collectAncestorScopeIds(index, selectedScopeId, treeMode), ...selectedIds])];
}

export function buildScopeCategoryGroups(nodes: BrowserScopeTreeNode[]) {
  const grouped = new Map<string, BrowserScopeTreeNode[]>();
  for (const node of nodes) {
    const current = grouped.get(node.kind);
    if (current) {
      current.push(node);
    } else {
      grouped.set(node.kind, [node]);
    }
  }
  return [...grouped.entries()]
    .map(([kind, groupNodes]) => ({
      kind,
      label: toCategoryLabel(kind),
      nodes: groupNodes,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }));
}

function findTopLevelVisibleScopeKind(index: BrowserSnapshotIndex, scopeId: string | null, treeMode: BrowserTreeMode) {
  if (!scopeId) {
    return null;
  }
  for (const root of getScopeTreeNodesForMode(index, null, treeMode)) {
    if (root.scopeId === scopeId) {
      return root.kind;
    }
    const descendants = getScopeTreeNodesForMode(index, root.scopeId, treeMode);
    if (descendants.some((node) => node.scopeId === scopeId)) {
      return root.kind;
    }
  }
  return null;
}

export function computeDefaultExpandedCategories(groups: BrowserScopeCategoryGroup[], index: BrowserSnapshotIndex | null, selectedScopeId: string | null, treeMode: BrowserTreeMode = 'advanced') {
  if (!groups.length) {
    return [] as string[];
  }
  const selectedKind = index ? findTopLevelVisibleScopeKind(index, selectedScopeId, treeMode) : null;
  if (!selectedKind) {
    return groups.map((group) => group.kind);
  }
  return groups.map((group) => group.kind).filter((kind) => kind === selectedKind);
}

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
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
  const roots = useMemo(() => index ? getScopeTreeNodesForMode(index, null, treeMode) : [], [index, treeMode]);
  const categoryGroups = useMemo(() => buildScopeCategoryGroups(roots), [roots]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode));

  useEffect(() => {
    setExpandedScopeIds((current) => {
      const next = new Set(current);
      for (const scopeId of computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode)) {
        next.add(scopeId);
      }
      return [...next];
    });
  }, [index, selectedScopeId, treeMode]);

  useEffect(() => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      for (const kind of computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode)) {
        next.add(kind);
      }
      return categoryGroups.map((group) => group.kind).filter((kind) => next.has(kind));
    });
  }, [categoryGroups, index, selectedScopeId, treeMode]);

  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);
  const expandedCategorySet = useMemo(() => new Set(expandedCategories), [expandedCategories]);
  const totalDescendants = useMemo(() => roots.reduce((sum, node) => sum + node.descendantScopeCount, 0), [roots]);
  const totalDirectEntities = useMemo(() => roots.reduce((sum, node) => sum + node.directEntityIds.length, 0), [roots]);
  const defaultTreeMode = useMemo(() => index ? detectDefaultBrowserTreeMode(index) : 'filesystem', [index]);

  const toggleScope = (scopeId: string) => {
    setExpandedScopeIds((current) => current.includes(scopeId)
      ? current.filter((candidate) => candidate !== scopeId)
      : [...current, scopeId]);
  };

  const toggleCategory = (kind: string) => {
    setExpandedCategories((current) => current.includes(kind)
      ? current.filter((candidate) => candidate !== kind)
      : [...current, kind]);
  };

  const expandAll = () => {
    if (!index) {
      return;
    }
    const collectAll = (parentScopeId: string | null): string[] => {
      const nodes = getScopeTreeNodesForMode(index, parentScopeId, treeMode);
      return nodes.flatMap((node) => [node.scopeId, ...collectAll(node.scopeId)]);
    };
    setExpandedScopeIds(collectAll(null));
    setExpandedCategories(categoryGroups.map((group) => group.kind));
  };

  const collapseToSelection = () => {
    setExpandedScopeIds(computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
    setExpandedCategories(computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode));
  };

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
          <button type="button" className="button-secondary" onClick={expandAll}>Expand all</button>
          <button type="button" className="button-secondary" onClick={collapseToSelection}>Focus selection</button>
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

      <p className="muted app-nav__lead">
        {TREE_MODE_META[treeMode].description}. Default for this snapshot: <strong>{TREE_MODE_META[defaultTreeMode].label}</strong>.
      </p>

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
    </section>
  );
}
