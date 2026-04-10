import { useMemo } from 'react';
import type { BrowserSearchResult, BrowserSnapshotIndex, BrowserScopeTreeNode, BrowserTreeMode } from '../../browser-snapshot';
import { collectNavigationSearchVisibility } from './browserNavigationTree.search';
import { buildNavigationTreeSummary } from './browserNavigationTree.summary';
import { computeNavigationRootPresentation } from './browserNavigationTree.rootPresentation';
import { computeBrowserNavigationTreeDerivedState } from './browserNavigationTree.derivedStatePolicy';

export function useBrowserNavigationTreeDerivedState(
  index: BrowserSnapshotIndex | null,
  treeMode: BrowserTreeMode,
  searchQuery: string,
  searchResults: BrowserSearchResult[],
) {
  const summary = useMemo(() => index ? buildNavigationTreeSummary(index, treeMode) : null, [index, treeMode]);
  const rawRoots = summary?.roots ?? ([] as BrowserScopeTreeNode[]);
  const normalizedSearchQuery = searchQuery.trim();
  const searchVisibility = useMemo(() => index && normalizedSearchQuery
    ? collectNavigationSearchVisibility(index, treeMode, searchResults)
    : null, [index, normalizedSearchQuery, searchResults, treeMode]);
  const rootPresentation = useMemo(() => computeNavigationRootPresentation({
    index,
    treeMode,
    roots: rawRoots,
    visibleScopeIds: searchVisibility?.scopeIds ?? null,
  }), [index, rawRoots, searchVisibility, treeMode]);

  return computeBrowserNavigationTreeDerivedState({
    summary,
    rootPresentation,
    searchVisibility,
  });
}
