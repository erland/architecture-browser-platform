import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState } from '../../browser-session/focus-types';
import { createEmptyBrowserNavigationTreeViewState, normalizeBrowserNavigationTreeViewState } from '../../browser-session/state';
import {
  collectSafeNavigationAncestorEntityIds,
  computeDefaultExpandedScopeIds,
} from './browserNavigationTree.expansion';
import type { BrowserNavigationSearchVisibility } from './browserNavigationTree.shared';
import { computeSingleChildAutoExpandState } from './browserNavigationTree.expansion';
import { collectAllExpandableEntityIds, collectAllVisibleScopeIds } from './browserNavigationTree.expansion';
import { computeNavigationCollapsedState, computeNavigationCollapseToSelectionState } from './browserNavigationTree.collapsePolicy';

export type BrowserNavigationExpansionArrays = {
  expandedScopeIds: string[];
  expandedEntityIds: string[];
  expandedChildListNodeIds: string[];
};

export function computeInitialBrowserNavigationExpansionState(args: {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  treeMode: BrowserTreeMode;
  persistedTreeState: BrowserNavigationTreeViewState | null;
}): BrowserNavigationExpansionArrays {
  const initialTreeState = normalizeBrowserNavigationTreeViewState(args.persistedTreeState ?? createEmptyBrowserNavigationTreeViewState());
  return {
    expandedScopeIds: initialTreeState.expandedScopeIds.length > 0
      ? initialTreeState.expandedScopeIds
      : computeDefaultExpandedScopeIds(args.index, args.selectedScopeId, args.treeMode),
    expandedEntityIds: initialTreeState.expandedEntityIds.length > 0
      ? initialTreeState.expandedEntityIds
      : (args.index ? args.selectedEntityIds.flatMap((entityId) => collectSafeNavigationAncestorEntityIds(args.index as BrowserSnapshotIndex, entityId)) : []),
    expandedChildListNodeIds: initialTreeState.expandedChildListNodeIds,
  };
}

export function computeHydratedBrowserNavigationExpansionState(persistedTreeState: BrowserNavigationTreeViewState): Partial<BrowserNavigationExpansionArrays> {
  const normalized = normalizeBrowserNavigationTreeViewState(persistedTreeState);
  return {
    expandedScopeIds: normalized.expandedScopeIds,
    expandedEntityIds: normalized.expandedEntityIds,
    expandedChildListNodeIds: normalized.expandedChildListNodeIds,
  };
}

export function mergeExpandedIds(current: string[], additional: Iterable<string>): string[] {
  const next = new Set(current);
  let changed = false;
  for (const id of additional) {
    if (!next.has(id)) {
      next.add(id);
      changed = true;
    }
  }
  return changed ? [...next] : current;
}

export function buildBrowserNavigationTreeViewState(expansion: BrowserNavigationExpansionArrays): BrowserNavigationTreeViewState {
  return {
    expandedScopeIds: expansion.expandedScopeIds,
    expandedCategories: [],
    expandedEntityIds: expansion.expandedEntityIds,
    expandedChildListNodeIds: expansion.expandedChildListNodeIds,
  };
}

export function computeSearchExpandedScopeIds(current: string[], searchVisibility: BrowserNavigationSearchVisibility | null): string[] {
  if (!searchVisibility) {
    return current;
  }
  return mergeExpandedIds(current, searchVisibility.scopeIds);
}

export function computeSearchExpandedEntityIds(current: string[], searchVisibility: BrowserNavigationSearchVisibility | null): string[] {
  if (!searchVisibility) {
    return current;
  }
  return mergeExpandedIds(current, searchVisibility.entityIds);
}

export function computeSelectionExpandedEntityIds(index: BrowserSnapshotIndex | null, selectedEntityIds: string[], current: string[]): string[] {
  if (!index || selectedEntityIds.length === 0) {
    return current;
  }
  return mergeExpandedIds(current, selectedEntityIds.flatMap((selectedId) => collectSafeNavigationAncestorEntityIds(index, selectedId)));
}

export function computeDefaultExpandedScopeIdsMerge(index: BrowserSnapshotIndex | null, selectedScopeId: string | null, treeMode: BrowserTreeMode, current: string[]): string[] {
  return mergeExpandedIds(current, computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
}

export function computeToggledScopeExpansion(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode, expandedScopeIds: string[], expandedEntityIds: string[], scopeId: string) {
  if (!index) {
    return { expandedScopeIds, expandedEntityIds };
  }
  if (expandedScopeIds.includes(scopeId)) {
    return {
      expandedScopeIds: expandedScopeIds.filter((candidate) => candidate !== scopeId),
      expandedEntityIds,
    };
  }
  const autoExpandState = computeSingleChildAutoExpandState(index, treeMode, { scopeId });
  return {
    expandedScopeIds: mergeExpandedIds(expandedScopeIds, [scopeId, ...autoExpandState.scopeIds]),
    expandedEntityIds: autoExpandState.entityIds.length > 0 ? mergeExpandedIds(expandedEntityIds, autoExpandState.entityIds) : expandedEntityIds,
  };
}

export function computeToggledEntityExpansion(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode, expandedScopeIds: string[], expandedEntityIds: string[], entityId: string) {
  if (!index) {
    return { expandedScopeIds, expandedEntityIds };
  }
  if (expandedEntityIds.includes(entityId)) {
    return {
      expandedScopeIds,
      expandedEntityIds: expandedEntityIds.filter((candidate) => candidate !== entityId),
    };
  }
  const autoExpandState = computeSingleChildAutoExpandState(index, treeMode, { entityId });
  return {
    expandedScopeIds: autoExpandState.scopeIds.length > 0 ? mergeExpandedIds(expandedScopeIds, autoExpandState.scopeIds) : expandedScopeIds,
    expandedEntityIds: mergeExpandedIds(expandedEntityIds, [entityId, ...autoExpandState.entityIds]),
  };
}

export function computeToggledChildListNodeIds(current: string[], nodeId: string) {
  return current.includes(nodeId)
    ? current.filter((candidate) => candidate !== nodeId)
    : [...current, nodeId];
}

export function computeExpandAllNavigationExpansion(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode): BrowserNavigationExpansionArrays {
  if (!index) {
    return {
      expandedScopeIds: [],
      expandedEntityIds: [],
      expandedChildListNodeIds: [],
    };
  }
  return {
    expandedScopeIds: collectAllVisibleScopeIds(index, treeMode),
    expandedEntityIds: collectAllExpandableEntityIds(index),
    expandedChildListNodeIds: [],
  };
}

export function computeCollapseToSelectionNavigationExpansion(args: {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  treeMode: BrowserTreeMode;
}): BrowserNavigationExpansionArrays {
  const collapsedState = computeNavigationCollapseToSelectionState(args);
  return {
    expandedScopeIds: collapsedState.scopeIds,
    expandedEntityIds: collapsedState.entityIds,
    expandedChildListNodeIds: [],
  };
}

export function computeCollapseAllNavigationExpansion(args: {
  index: BrowserSnapshotIndex | null;
  treeMode: BrowserTreeMode;
}): BrowserNavigationExpansionArrays {
  const collapsedState = computeNavigationCollapsedState(args);
  return {
    expandedScopeIds: collapsedState.scopeIds,
    expandedEntityIds: collapsedState.entityIds,
    expandedChildListNodeIds: [],
  };
}
