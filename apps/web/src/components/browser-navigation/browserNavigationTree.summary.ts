import { detectDefaultBrowserTreeMode, getScopeTreeNodesForMode, type BrowserSnapshotIndex, type BrowserTreeMode } from '../../browser-snapshot';

export function buildNavigationTreeSummary(index: BrowserSnapshotIndex, treeMode: BrowserTreeMode) {
  const roots = getScopeTreeNodesForMode(index, null, treeMode);
  return {
    roots,
    totalDescendants: roots.reduce((sum, node) => sum + node.descendantScopeCount, 0),
    totalDirectEntities: roots.reduce((sum, node) => sum + node.directEntityIds.length, 0),
    defaultTreeMode: detectDefaultBrowserTreeMode(index),
  };
}
