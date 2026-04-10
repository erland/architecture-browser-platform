import type { BrowserSearchResult, BrowserSnapshotIndex, BrowserScopeTreeNode, BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState } from '../../browser-session/focus-types';
import { type BrowserNavigationSearchVisibility } from './browserNavigationTree.shared';
import { useBrowserNavigationTreeDerivedState } from './browserNavigationTree.derivedState';
import { useBrowserNavigationTreeExpansionState } from './browserNavigationTree.expansionState';

export type BrowserNavigationTreeControllerInput = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  treeMode: BrowserTreeMode;
  persistedTreeState?: BrowserNavigationTreeViewState | null;
  onTreeStateChange?: (state: BrowserNavigationTreeViewState) => void;
  searchQuery?: string;
  searchResults?: BrowserSearchResult[];
};

export type BrowserNavigationTreeController = {
  roots: BrowserScopeTreeNode[];
  searchVisibility: BrowserNavigationSearchVisibility | null;
  totalDescendants: number;
  totalDirectEntities: number;
  defaultTreeMode: BrowserTreeMode;
  expandedSet: Set<string>;
  expandedEntitySet: Set<string>;
  expandedChildListSet: Set<string>;
  toggleScope: (scopeId: string) => void;
  toggleEntity: (entityId: string) => void;
  toggleChildList: (nodeId: string) => void;
  expandAll: () => void;
  collapseToSelection: () => void;
  collapseAll: () => void;
};

export function useBrowserNavigationTreeController({
  index,
  selectedScopeId,
  selectedEntityIds,
  treeMode,
  persistedTreeState = null,
  onTreeStateChange,
  searchQuery = '',
  searchResults = [],
}: BrowserNavigationTreeControllerInput): BrowserNavigationTreeController {
  const derivedState = useBrowserNavigationTreeDerivedState(index, treeMode, searchQuery, searchResults);
  const expansionState = useBrowserNavigationTreeExpansionState(
    index,
    selectedScopeId,
    selectedEntityIds,
    treeMode,
    persistedTreeState,
    derivedState.searchVisibility,
    onTreeStateChange,
  );

  return {
    ...derivedState,
    ...expansionState,
  };
}
