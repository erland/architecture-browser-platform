import type { BrowserScopeTreeNode, BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationSearchVisibility } from './browserNavigationTree.shared';
import type { BrowserNavigationRootPresentation } from './browserNavigationTree.rootPresentation';

export type BrowserNavigationTreeDerivedStatePolicyInput = {
  summary: {
    roots: BrowserScopeTreeNode[];
    totalDescendants: number;
    totalDirectEntities: number;
    defaultTreeMode: BrowserTreeMode;
  } | null;
  rootPresentation: BrowserNavigationRootPresentation;
  searchVisibility: BrowserNavigationSearchVisibility | null;
};

export function computeBrowserNavigationTreeDerivedState(input: BrowserNavigationTreeDerivedStatePolicyInput) {
  return {
    roots: input.rootPresentation.roots,
    searchVisibility: input.searchVisibility,
    totalDescendants: input.summary?.totalDescendants ?? 0,
    totalDirectEntities: input.summary?.totalDirectEntities ?? 0,
    defaultTreeMode: input.summary?.defaultTreeMode ?? 'filesystem' as BrowserTreeMode,
  };
}
