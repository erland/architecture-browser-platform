import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import { computeSingleChildAutoExpandState } from './browserNavigationTree.expansion';
import type { BrowserNavigationAutoExpandState } from './browserNavigationTree.autoExpandTraversal';
import { computeNavigationFocusRevealState } from './browserNavigationTree.focusPolicy';

export type BrowserNavigationCollapseInput = {
  index: BrowserSnapshotIndex | null;
  treeMode?: BrowserTreeMode;
};

export type BrowserNavigationCollapseToSelectionInput = BrowserNavigationCollapseInput & {
  selectedScopeId: string | null;
  selectedEntityIds: string[];
};

export function computeNavigationCollapsedState({
  index,
  treeMode = 'advanced',
}: BrowserNavigationCollapseInput): BrowserNavigationAutoExpandState {
  if (!index) {
    return { scopeIds: [], entityIds: [] };
  }
  return computeSingleChildAutoExpandState(index, treeMode);
}

export function computeNavigationCollapseToSelectionState({
  index,
  selectedScopeId,
  selectedEntityIds,
  treeMode = 'advanced',
}: BrowserNavigationCollapseToSelectionInput): BrowserNavigationAutoExpandState & { hasExplicitFocusTarget: boolean } {
  const focusState = computeNavigationFocusRevealState({
    index,
    selectedScopeId,
    selectedEntityIds,
    treeMode,
  });

  if (!focusState.hasExplicitFocusTarget) {
    return {
      ...computeNavigationCollapsedState({ index, treeMode }),
      hasExplicitFocusTarget: false,
    };
  }

  return {
    scopeIds: focusState.scopeIds,
    entityIds: focusState.entityIds,
    hasExplicitFocusTarget: true,
  };
}
