// Compatibility wrapper retained for callers still importing the pre-controller hook.

import type { BrowserSearchResult, BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState } from '../../browser-session/types';
import { useBrowserNavigationTreeController } from './browserNavigationTree.controller';

export function useBrowserNavigationTreeState(
  index: BrowserSnapshotIndex | null,
  selectedScopeId: string | null,
  selectedEntityIds: string[],
  treeMode: BrowserTreeMode,
  persistedTreeState: BrowserNavigationTreeViewState | null,
  onTreeStateChange: ((state: BrowserNavigationTreeViewState) => void) | undefined,
  searchQuery = '',
  searchResults: BrowserSearchResult[] = [],
) {
  return useBrowserNavigationTreeController({
    index,
    selectedScopeId,
    selectedEntityIds,
    treeMode,
    persistedTreeState,
    onTreeStateChange,
    searchQuery,
    searchResults,
  });
}
