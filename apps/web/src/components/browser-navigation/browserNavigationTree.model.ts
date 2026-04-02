import {
  collectVisibleAncestorScopeIds,
  detectDefaultBrowserTreeMode,
  getScopeTreeNodesForMode,
  isScopeVisibleInTreeMode,
  type BrowserSnapshotIndex,
  type BrowserScopeTreeNode,
  type BrowserTreeMode,
} from '../../browser-snapshot';

export type BrowserScopeCategoryGroup = {
  kind: string;
  label: string;
  nodes: BrowserScopeTreeNode[];
};

export const TREE_MODE_META: Record<BrowserTreeMode, { label: string; description: string }> = {
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

export function collectAllVisibleScopeIds(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode, parentScopeId: string | null = null): string[] {
  const nodes = getScopeTreeNodesForMode(index, parentScopeId, treeMode);
  return nodes.flatMap((node) => [node.scopeId, ...collectAllVisibleScopeIds(index, treeMode, node.scopeId)]);
}

export function buildNavigationTreeSummary(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode) {
  const roots = getScopeTreeNodesForMode(index, null, treeMode);
  return {
    roots,
    categoryGroups: buildScopeCategoryGroups(roots),
    totalDescendants: roots.reduce((sum, node) => sum + node.descendantScopeCount, 0),
    totalDirectEntities: roots.reduce((sum, node) => sum + node.directEntityIds.length, 0),
    defaultTreeMode: detectDefaultBrowserTreeMode(index),
  };
}
