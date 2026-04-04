import { useEffect, useMemo, useRef, useState } from 'react';
import type { BrowserSearchResult, BrowserSnapshotIndex, BrowserScopeTreeNode, BrowserTreeMode } from '../../browser-snapshot';
import { createEmptyBrowserNavigationTreeViewState, normalizeBrowserNavigationTreeViewState, type BrowserNavigationTreeViewState } from '../../browser-session';
import {
  buildNavigationTreeSummary,
  collectAllExpandableEntityIds,
  collectAllVisibleScopeIds,
  collectNavigationSearchVisibility,
  collectSafeNavigationAncestorEntityIds,
  collectSingleChildAutoExpansion,
  computeDefaultExpandedCategories,
  computeDefaultExpandedScopeIds,
  filterCategoryGroupsForSearch,
} from './browserNavigationTree.model';

export function useBrowserNavigationTreeState(index: BrowserSnapshotIndex | null, selectedScopeId: string | null, selectedEntityIds: string[], treeMode: BrowserTreeMode, persistedTreeState: BrowserNavigationTreeViewState | null, onTreeStateChange: ((state: BrowserNavigationTreeViewState) => void) | undefined, searchQuery = '', searchResults: BrowserSearchResult[] = [], selectedViewpointId: string | null = null) {
  const summary = useMemo(() => index ? buildNavigationTreeSummary(index, treeMode) : null, [index, treeMode]);
  const roots = summary?.roots ?? ([] as BrowserScopeTreeNode[]);
  const rawCategoryGroups = summary?.categoryGroups ?? [];
  const normalizedSearchQuery = searchQuery.trim();
  const searchVisibility = useMemo(() => index && normalizedSearchQuery
    ? collectNavigationSearchVisibility(index, treeMode, searchResults)
    : null, [index, normalizedSearchQuery, searchResults, treeMode]);
  const categoryGroups = useMemo(() => filterCategoryGroupsForSearch(rawCategoryGroups, searchVisibility?.scopeIds ?? null), [rawCategoryGroups, searchVisibility]);
  const totalDescendants = summary?.totalDescendants ?? 0;
  const totalDirectEntities = summary?.totalDirectEntities ?? 0;
  const defaultTreeMode = summary?.defaultTreeMode ?? 'filesystem';

  const initialTreeState = normalizeBrowserNavigationTreeViewState(persistedTreeState ?? createEmptyBrowserNavigationTreeViewState());
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => initialTreeState.expandedScopeIds.length > 0 ? initialTreeState.expandedScopeIds : computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => initialTreeState.expandedCategories.length > 0 ? initialTreeState.expandedCategories : computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode));
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
    if (normalized.expandedCategories.length > 0) setExpandedCategories(normalized.expandedCategories);
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
    setExpandedCategories((current) => {
      const next = new Set(current);
      let changed = false;
      for (const kind of computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode)) {
        if (!next.has(kind)) {
          next.add(kind);
          changed = true;
        }
      }
      if (!changed) {
        return current;
      }
      return categoryGroups.map((group) => group.kind).filter((kind) => next.has(kind));
    });
  }, [categoryGroups, index, selectedScopeId, treeMode]);

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
    setExpandedCategories((current) => {
      const visibleKinds = new Set(categoryGroups.map((group) => group.kind));
      const next = new Set(current);
      let changed = false;
      for (const kind of visibleKinds) {
        if (!next.has(kind)) {
          next.add(kind);
          changed = true;
        }
      }
      return changed ? [...next] : current;
    });
  }, [categoryGroups, searchVisibility]);

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
    if (!index) {
      return;
    }
    const { scopeIds, entityIds } = collectSingleChildAutoExpansion(index, treeMode, expandedScopeIds, expandedEntityIds, {
      visibleScopeIds: searchVisibility?.scopeIds ?? null,
      visibleEntityIds: searchVisibility?.entityIds ?? null,
      viewpointId: selectedViewpointId,
    });
    if (scopeIds.length === 0 && entityIds.length === 0) {
      return;
    }
    setExpandedScopeIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const scopeId of scopeIds) {
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
      for (const entityId of entityIds) {
        if (!next.has(entityId)) {
          next.add(entityId);
          changed = true;
        }
      }
      return changed ? [...next] : current;
    });
  }, [expandedEntityIds, expandedScopeIds, index, searchVisibility, selectedViewpointId, treeMode]);

  useEffect(() => {
    if (!onTreeStateChange) {
      return;
    }
    onTreeStateChange({
      expandedScopeIds,
      expandedCategories,
      expandedEntityIds,
      expandedChildListNodeIds,
    });
  }, [expandedCategories, expandedChildListNodeIds, expandedEntityIds, expandedScopeIds, onTreeStateChange]);

  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);  const expandedCategorySet = useMemo(() => new Set(expandedCategories), [expandedCategories]);
  const expandedEntitySet = useMemo(() => new Set(expandedEntityIds), [expandedEntityIds]);
  const expandedChildListSet = useMemo(() => new Set(expandedChildListNodeIds), [expandedChildListNodeIds]);

  const toggleScope = (scopeId: string) => {
    setExpandedScopeIds((current) => current.includes(scopeId)
      ? current.filter((candidate) => candidate !== scopeId)
      : [...current, scopeId]);
  };

  const toggleCategory = (kind: string) => {
    setExpandedCategories((current) => current.includes(kind)
      ? current.filter((candidate) => candidate !== kind)
      : [...current, kind]);
  };

  const toggleEntity = (entityId: string) => {
    setExpandedEntityIds((current) => current.includes(entityId)
      ? current.filter((candidate) => candidate !== entityId)
      : [...current, entityId]);
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
    setExpandedCategories(categoryGroups.map((group) => group.kind));
    setExpandedEntityIds(collectAllExpandableEntityIds(index));
  };

  const collapseToSelection = () => {
    setExpandedScopeIds(computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
    setExpandedCategories(computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode));
    setExpandedEntityIds(index ? selectedEntityIds.flatMap((entityId) => collectSafeNavigationAncestorEntityIds(index, entityId)) : []);
  };

  return {
    roots,
    categoryGroups,
    searchVisibility,
    totalDescendants,
    totalDirectEntities,
    defaultTreeMode,
    expandedSet,
    expandedCategorySet,
    expandedEntitySet,
    expandedChildListSet,
    toggleScope,
    toggleCategory,
    toggleEntity,
    toggleChildList,
    expandAll,
    collapseToSelection,
  };
}
