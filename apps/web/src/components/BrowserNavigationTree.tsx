import { useEffect, useMemo, useState } from 'react';
import { getScopeChildren, type BrowserSnapshotIndex, type BrowserScopeTreeNode } from '../browserSnapshotIndex';

type BrowserNavigationTreeProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
};

type BrowserScopeCategoryGroup = {
  kind: string;
  label: string;
  nodes: BrowserScopeTreeNode[];
};

export function collectAncestorScopeIds(index: BrowserSnapshotIndex, scopeId: string | null) {
  if (!scopeId) {
    return [] as string[];
  }
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

export function computeDefaultExpandedScopeIds(index: BrowserSnapshotIndex | null, selectedScopeId: string | null) {
  if (!index) {
    return [] as string[];
  }
  const rootIds = getScopeChildren(index, null).map((node) => node.scopeId);
  return [...new Set([...rootIds, ...collectAncestorScopeIds(index, selectedScopeId), ...(selectedScopeId ? [selectedScopeId] : [])])];
}

function toCategoryLabel(kind: string) {
  return kind.replace(/_/g, ' ').toLocaleLowerCase().replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase());
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

function findTopLevelScopeKind(index: BrowserSnapshotIndex, scopeId: string | null) {
  if (!scopeId) {
    return null;
  }
  const seen = new Set<string>();
  let current = index.scopesById.get(scopeId);
  while (current && !seen.has(current.externalId)) {
    seen.add(current.externalId);
    if (!current.parentScopeId) {
      return current.kind;
    }
    current = index.scopesById.get(current.parentScopeId);
  }
  return null;
}

export function computeDefaultExpandedCategories(groups: BrowserScopeCategoryGroup[], index: BrowserSnapshotIndex | null, selectedScopeId: string | null) {
  if (!groups.length) {
    return [] as string[];
  }
  const selectedKind = index ? findTopLevelScopeKind(index, selectedScopeId) : null;
  if (!selectedKind) {
    return groups.map((group) => group.kind);
  }
  return groups.map((group) => group.kind === selectedKind ? group.kind : group.kind).filter((kind, position, values) => values.indexOf(kind) === position);
}

function TreeBranch({
  index,
  node,
  selectedScopeId,
  expandedScopeIds,
  onToggle,
  onSelectScope,
  onAddScopeEntitiesToCanvas,
}: {
  index: BrowserSnapshotIndex;
  node: BrowserScopeTreeNode;
  selectedScopeId: string | null;
  expandedScopeIds: Set<string>;
  onToggle: (scopeId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onAddScopeEntitiesToCanvas: (scopeId: string) => void;
}) {
  const children = getScopeChildren(index, node.scopeId);
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

export function BrowserNavigationTree({ index, selectedScopeId, onSelectScope, onAddScopeEntitiesToCanvas }: BrowserNavigationTreeProps) {
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => computeDefaultExpandedScopeIds(index, selectedScopeId));
  const roots = useMemo(() => index ? getScopeChildren(index, null) : [], [index]);
  const categoryGroups = useMemo(() => buildScopeCategoryGroups(roots), [roots]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId));

  useEffect(() => {
    setExpandedScopeIds((current) => {
      const next = new Set(current);
      for (const scopeId of computeDefaultExpandedScopeIds(index, selectedScopeId)) {
        next.add(scopeId);
      }
      return [...next];
    });
  }, [index, selectedScopeId]);

  useEffect(() => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      for (const kind of computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId)) {
        next.add(kind);
      }
      return categoryGroups.map((group) => group.kind).filter((kind) => next.has(kind));
    });
  }, [categoryGroups, index, selectedScopeId]);

  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);
  const expandedCategorySet = useMemo(() => new Set(expandedCategories), [expandedCategories]);
  const totalDescendants = useMemo(() => roots.reduce((sum, node) => sum + node.descendantScopeCount, 0), [roots]);
  const totalDirectEntities = useMemo(() => roots.reduce((sum, node) => sum + node.directEntityIds.length, 0), [roots]);

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
    setExpandedScopeIds(index.payload.scopes.map((scope) => scope.externalId));
    setExpandedCategories(categoryGroups.map((group) => group.kind));
  };

  const collapseToSelection = () => {
    setExpandedScopeIds(computeDefaultExpandedScopeIds(index, selectedScopeId));
    setExpandedCategories(computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId));
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

      <div className="browser-navigation-tree__summary">
        <span className="badge">{index.payload.scopes.length} scopes</span>
        <span className="badge">{index.payload.entities.length} entities</span>
        <span className="badge">{totalDescendants} nested scopes</span>
        <span className="badge">{totalDirectEntities} root-scope entities</span>
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

