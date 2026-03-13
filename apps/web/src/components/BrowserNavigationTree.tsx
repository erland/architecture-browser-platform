import { useEffect, useMemo, useState } from 'react';
import { getScopeChildren, getScopeFacts, type BrowserSnapshotIndex, type BrowserScopeTreeNode } from '../browserSnapshotIndex';

type BrowserNavigationTreeProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  onSelectScope: (scopeId: string) => void;
  onAddScopeToCanvas: (scopeId: string) => void;
};

function collectAncestorScopeIds(index: BrowserSnapshotIndex, scopeId: string | null) {
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

function computeDefaultExpandedScopeIds(index: BrowserSnapshotIndex | null, selectedScopeId: string | null) {
  if (!index) {
    return [] as string[];
  }
  const rootIds = getScopeChildren(index, null).map((node) => node.scopeId);
  return [...new Set([...rootIds, ...collectAncestorScopeIds(index, selectedScopeId), ...(selectedScopeId ? [selectedScopeId] : [])])];
}

function TreeBranch({
  index,
  node,
  selectedScopeId,
  expandedScopeIds,
  onToggle,
  onSelectScope,
  onAddScopeToCanvas,
}: {
  index: BrowserSnapshotIndex;
  node: BrowserScopeTreeNode;
  selectedScopeId: string | null;
  expandedScopeIds: Set<string>;
  onToggle: (scopeId: string) => void;
  onSelectScope: (scopeId: string) => void;
  onAddScopeToCanvas: (scopeId: string) => void;
}) {
  const children = getScopeChildren(index, node.scopeId);
  const isExpanded = expandedScopeIds.has(node.scopeId);
  const isSelected = selectedScopeId === node.scopeId;
  const facts = getScopeFacts(index, node.scopeId);

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

        <button type="button" className="browser-tree__node-button" onClick={() => onSelectScope(node.scopeId)}>
          <span className="browser-tree__node-title">{node.displayName}</span>
          <span className="browser-tree__node-meta">{node.kind} · {node.directEntityIds.length} direct entities · {node.descendantScopeCount} child scopes</span>
        </button>

        <button
          type="button"
          className="button-secondary browser-tree__canvas-button"
          onClick={() => onAddScopeToCanvas(node.scopeId)}
          aria-label={`Add ${node.displayName} to canvas`}
        >
          Add
        </button>
      </div>

      {isSelected && facts ? (
        <div className="browser-tree__facts-inline">
          <span>{facts.path}</span>
          <span>{facts.descendantEntityCount} entities in subtree</span>
          {facts.diagnostics.length > 0 ? <span>{facts.diagnostics.length} diagnostics</span> : null}
        </div>
      ) : null}

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
              onAddScopeToCanvas={onAddScopeToCanvas}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function BrowserNavigationTree({ index, selectedScopeId, onSelectScope, onAddScopeToCanvas }: BrowserNavigationTreeProps) {
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => computeDefaultExpandedScopeIds(index, selectedScopeId));

  useEffect(() => {
    setExpandedScopeIds((current) => {
      const next = new Set(current);
      for (const scopeId of computeDefaultExpandedScopeIds(index, selectedScopeId)) {
        next.add(scopeId);
      }
      return [...next];
    });
  }, [index, selectedScopeId]);

  const roots = useMemo(() => index ? getScopeChildren(index, null) : [], [index]);
  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);
  const totalDescendants = useMemo(() => roots.reduce((sum, node) => sum + node.descendantScopeCount, 0), [roots]);
  const totalDirectEntities = useMemo(() => roots.reduce((sum, node) => sum + node.directEntityIds.length, 0), [roots]);

  const toggleScope = (scopeId: string) => {
    setExpandedScopeIds((current) => current.includes(scopeId)
      ? current.filter((candidate) => candidate !== scopeId)
      : [...current, scopeId]);
  };

  const expandAll = () => {
    if (!index) {
      return;
    }
    setExpandedScopeIds(index.payload.scopes.map((scope) => scope.externalId));
  };

  const collapseToSelection = () => {
    setExpandedScopeIds(computeDefaultExpandedScopeIds(index, selectedScopeId));
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
          <p className="muted app-nav__lead">
            The left rail now prioritizes scope navigation from the prepared local snapshot instead of server-driven Browser modes.
          </p>
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
        {roots.map((root) => (
          <TreeBranch
            key={root.scopeId}
            index={index}
            node={root}
            selectedScopeId={selectedScopeId}
            expandedScopeIds={expandedSet}
            onToggle={toggleScope}
            onSelectScope={onSelectScope}
            onAddScopeToCanvas={onAddScopeToCanvas}
          />
        ))}
      </ul>
    </section>
  );
}

export { collectAncestorScopeIds, computeDefaultExpandedScopeIds };
