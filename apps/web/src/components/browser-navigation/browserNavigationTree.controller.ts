import { useEffect, useMemo, useRef, useState } from 'react';
import type { BrowserSearchResult, BrowserSnapshotIndex, BrowserScopeTreeNode, BrowserTreeMode } from '../../browser-snapshot';
import {
  createEmptyBrowserNavigationTreeViewState,
  normalizeBrowserNavigationTreeViewState,
  type BrowserNavigationTreeViewState,
} from '../../browser-session';
import { computeSingleChildAutoExpandState } from './browserNavigationTree.expansion';
import { collectAllExpandableEntityIds, collectAllVisibleScopeIds, collectSafeNavigationAncestorEntityIds, computeDefaultExpandedScopeIds } from './browserNavigationTree.expansion';
import { collectNavigationSearchVisibility } from './browserNavigationTree.search';
import { type BrowserNavigationSearchVisibility } from './browserNavigationTree.shared';
import { buildNavigationTreeSummary } from './browserNavigationTree.summary';
import { computeNavigationRootPresentation } from './browserNavigationTree.rootPresentation';
import {
  computeNavigationCollapsedState,
  computeNavigationCollapseToSelectionState,
} from './browserNavigationTree.collapsePolicy';

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

function useNavigationTreeDerivedState(index: BrowserSnapshotIndex | null, treeMode: BrowserTreeMode, searchQuery: string, searchResults: BrowserSearchResult[]) {
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

  return {
    roots: rootPresentation.roots,
    searchVisibility,
    totalDescendants: summary?.totalDescendants ?? 0,
    totalDirectEntities: summary?.totalDirectEntities ?? 0,
    defaultTreeMode: summary?.defaultTreeMode ?? 'filesystem' as BrowserTreeMode,
  };
}

function useNavigationTreeExpansionState(
  index: BrowserSnapshotIndex | null,
  selectedScopeId: string | null,
  selectedEntityIds: string[],
  treeMode: BrowserTreeMode,
  persistedTreeState: BrowserNavigationTreeViewState | null,
  searchVisibility: BrowserNavigationSearchVisibility | null,
  onTreeStateChange?: (state: BrowserNavigationTreeViewState) => void,
) {
  const initialTreeState = normalizeBrowserNavigationTreeViewState(persistedTreeState ?? createEmptyBrowserNavigationTreeViewState());
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => initialTreeState.expandedScopeIds.length > 0 ? initialTreeState.expandedScopeIds : computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
  const [expandedEntityIds, setExpandedEntityIds] = useState<string[]>(() => initialTreeState.expandedEntityIds.length > 0 ? initialTreeState.expandedEntityIds : (index ? selectedEntityIds.flatMap((entityId) => collectSafeNavigationAncestorEntityIds(index, entityId)) : []));
  const [expandedChildListNodeIds, setExpandedChildListNodeIds] = useState<string[]>(() => initialTreeState.expandedChildListNodeIds);
  const hasHydratedFromPersistedStateRef = useRef(false);

  useEffect(() => {
    if (hasHydratedFromPersistedStateRef.current) {
      return;
    }
    if (!persistedTreeState) {
      hasHydratedFromPersistedStateRef.current = true;
      return;
    }
    const normalized = normalizeBrowserNavigationTreeViewState(persistedTreeState);
    if (normalized.expandedScopeIds.length > 0) setExpandedScopeIds(normalized.expandedScopeIds);
    if (normalized.expandedEntityIds.length > 0) setExpandedEntityIds(normalized.expandedEntityIds);
    if (normalized.expandedChildListNodeIds.length > 0) setExpandedChildListNodeIds(normalized.expandedChildListNodeIds);
    hasHydratedFromPersistedStateRef.current = true;
  }, [persistedTreeState]);

  useEffect(() => {
    setExpandedScopeIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const scopeId of computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode)) {
        if (!next.has(scopeId)) {
          next.add(scopeId);
          changed = true;
        }
      }
      return changed ? [...next] : current;
    });
  }, [index, selectedScopeId, treeMode]);

  useEffect(() => {
    if (!searchVisibility) {
      return;
    }
    setExpandedScopeIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const scopeId of searchVisibility.scopeIds) {
        if (!next.has(scopeId)) {
          next.add(scopeId);
          changed = true;
        }
      }
      return changed ? [...next] : current;
    });
    setExpandedEntityIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const entityId of searchVisibility.entityIds) {
        if (!next.has(entityId)) {
          next.add(entityId);
          changed = true;
        }
      }
      return changed ? [...next] : current;
    });
  }, [searchVisibility]);

  useEffect(() => {
    if (!index || selectedEntityIds.length === 0) {
      return;
    }
    setExpandedEntityIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const entityId of selectedEntityIds.flatMap((selectedId) => collectSafeNavigationAncestorEntityIds(index, selectedId))) {
        if (!next.has(entityId)) {
          next.add(entityId);
          changed = true;
        }
      }
      return changed ? [...next] : current;
    });
  }, [index, selectedEntityIds]);

  useEffect(() => {
    if (!onTreeStateChange) {
      return;
    }
    onTreeStateChange({
      expandedScopeIds,
      expandedCategories: [],
      expandedEntityIds,
      expandedChildListNodeIds,
    });
  }, [expandedChildListNodeIds, expandedEntityIds, expandedScopeIds, onTreeStateChange]);

  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);
  const expandedEntitySet = useMemo(() => new Set(expandedEntityIds), [expandedEntityIds]);
  const expandedChildListSet = useMemo(() => new Set(expandedChildListNodeIds), [expandedChildListNodeIds]);

  const toggleScope = (scopeId: string) => {
    if (!index) {
      return;
    }
    const isExpanded = expandedSet.has(scopeId);
    if (isExpanded) {
      setExpandedScopeIds((current) => current.filter((candidate) => candidate !== scopeId));
      return;
    }
    const autoExpandState = computeSingleChildAutoExpandState(index, treeMode, { scopeId });
    setExpandedScopeIds((current) => [...new Set([...current, scopeId, ...autoExpandState.scopeIds])]);
    if (autoExpandState.entityIds.length > 0) {
      setExpandedEntityIds((current) => [...new Set([...current, ...autoExpandState.entityIds])]);
    }
  };

  const toggleEntity = (entityId: string) => {
    if (!index) {
      return;
    }
    const isExpanded = expandedEntitySet.has(entityId);
    if (isExpanded) {
      setExpandedEntityIds((current) => current.filter((candidate) => candidate !== entityId));
      return;
    }
    const autoExpandState = computeSingleChildAutoExpandState(index, treeMode, { entityId });
    setExpandedEntityIds((current) => [...new Set([...current, entityId, ...autoExpandState.entityIds])]);
    if (autoExpandState.scopeIds.length > 0) {
      setExpandedScopeIds((current) => [...new Set([...current, ...autoExpandState.scopeIds])]);
    }
  };

  const toggleChildList = (nodeId: string) => {
    setExpandedChildListNodeIds((current) => current.includes(nodeId)
      ? current.filter((candidate) => candidate !== nodeId)
      : [...current, nodeId]);
  };

  const expandAll = () => {
    if (!index) {
      return;
    }
    setExpandedScopeIds(collectAllVisibleScopeIds(index, treeMode));
    setExpandedEntityIds(collectAllExpandableEntityIds(index));
  };

  const collapseToSelection = () => {
    const collapsedState = computeNavigationCollapseToSelectionState({
      index,
      selectedScopeId,
      selectedEntityIds,
      treeMode,
    });
    setExpandedScopeIds(collapsedState.scopeIds);
    setExpandedEntityIds(collapsedState.entityIds);
    setExpandedChildListNodeIds([]);
  };

  const collapseAll = () => {
    const collapsedState = computeNavigationCollapsedState({ index, treeMode });
    setExpandedScopeIds(collapsedState.scopeIds);
    setExpandedEntityIds(collapsedState.entityIds);
    setExpandedChildListNodeIds([]);
  };

  return {
    expandedSet,
    expandedEntitySet,
    expandedChildListSet,
    toggleScope,
    toggleEntity,
    toggleChildList,
    expandAll,
    collapseToSelection,
    collapseAll,
  };
}

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
  const derivedState = useNavigationTreeDerivedState(index, treeMode, searchQuery, searchResults);
  const expansionState = useNavigationTreeExpansionState(
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
