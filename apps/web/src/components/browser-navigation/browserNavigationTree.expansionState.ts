import { useEffect, useMemo, useRef, useState } from 'react';
import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationTreeViewState } from '../../browser-session/focus-types';
import type { BrowserNavigationSearchVisibility } from './browserNavigationTree.shared';
import {
  buildBrowserNavigationTreeViewState,
  computeCollapseAllNavigationExpansion,
  computeCollapseToSelectionNavigationExpansion,
  computeDefaultExpandedScopeIdsMerge,
  computeExpandAllNavigationExpansion,
  computeHydratedBrowserNavigationExpansionState,
  computeInitialBrowserNavigationExpansionState,
  computeSearchExpandedEntityIds,
  computeSearchExpandedScopeIds,
  computeSelectionExpandedEntityIds,
  computeToggledChildListNodeIds,
  computeToggledEntityExpansion,
  computeToggledScopeExpansion,
} from './browserNavigationTree.expansionStatePolicy';

export function useBrowserNavigationTreeExpansionState(
  index: BrowserSnapshotIndex | null,
  selectedScopeId: string | null,
  selectedEntityIds: string[],
  treeMode: BrowserTreeMode,
  persistedTreeState: BrowserNavigationTreeViewState | null,
  searchVisibility: BrowserNavigationSearchVisibility | null,
  onTreeStateChange?: (state: BrowserNavigationTreeViewState) => void,
) {
  const initialState = computeInitialBrowserNavigationExpansionState({
    index,
    selectedScopeId,
    selectedEntityIds,
    treeMode,
    persistedTreeState,
  });
  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => initialState.expandedScopeIds);
  const [expandedEntityIds, setExpandedEntityIds] = useState<string[]>(() => initialState.expandedEntityIds);
  const [expandedChildListNodeIds, setExpandedChildListNodeIds] = useState<string[]>(() => initialState.expandedChildListNodeIds);
  const hasHydratedFromPersistedStateRef = useRef(false);

  useEffect(() => {
    if (hasHydratedFromPersistedStateRef.current) {
      return;
    }
    if (!persistedTreeState) {
      hasHydratedFromPersistedStateRef.current = true;
      return;
    }
    const hydratedState = computeHydratedBrowserNavigationExpansionState(persistedTreeState);
    if (hydratedState.expandedScopeIds && hydratedState.expandedScopeIds.length > 0) {
      setExpandedScopeIds(hydratedState.expandedScopeIds);
    }
    if (hydratedState.expandedEntityIds && hydratedState.expandedEntityIds.length > 0) {
      setExpandedEntityIds(hydratedState.expandedEntityIds);
    }
    if (hydratedState.expandedChildListNodeIds && hydratedState.expandedChildListNodeIds.length > 0) {
      setExpandedChildListNodeIds(hydratedState.expandedChildListNodeIds);
    }
    hasHydratedFromPersistedStateRef.current = true;
  }, [persistedTreeState]);

  useEffect(() => {
    setExpandedScopeIds((current) => computeDefaultExpandedScopeIdsMerge(index, selectedScopeId, treeMode, current));
  }, [index, selectedScopeId, treeMode]);

  useEffect(() => {
    setExpandedScopeIds((current) => computeSearchExpandedScopeIds(current, searchVisibility));
    setExpandedEntityIds((current) => computeSearchExpandedEntityIds(current, searchVisibility));
  }, [searchVisibility]);

  useEffect(() => {
    setExpandedEntityIds((current) => computeSelectionExpandedEntityIds(index, selectedEntityIds, current));
  }, [index, selectedEntityIds]);

  useEffect(() => {
    if (!onTreeStateChange) {
      return;
    }
    onTreeStateChange(buildBrowserNavigationTreeViewState({
      expandedScopeIds,
      expandedEntityIds,
      expandedChildListNodeIds,
    }));
  }, [expandedChildListNodeIds, expandedEntityIds, expandedScopeIds, onTreeStateChange]);

  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);
  const expandedEntitySet = useMemo(() => new Set(expandedEntityIds), [expandedEntityIds]);
  const expandedChildListSet = useMemo(() => new Set(expandedChildListNodeIds), [expandedChildListNodeIds]);

  const toggleScope = (scopeId: string) => {
    const next = computeToggledScopeExpansion(index, treeMode, expandedScopeIds, expandedEntityIds, scopeId);
    setExpandedScopeIds(next.expandedScopeIds);
    setExpandedEntityIds(next.expandedEntityIds);
  };

  const toggleEntity = (entityId: string) => {
    const next = computeToggledEntityExpansion(index, treeMode, expandedScopeIds, expandedEntityIds, entityId);
    setExpandedScopeIds(next.expandedScopeIds);
    setExpandedEntityIds(next.expandedEntityIds);
  };

  const toggleChildList = (nodeId: string) => {
    setExpandedChildListNodeIds((current) => computeToggledChildListNodeIds(current, nodeId));
  };

  const expandAll = () => {
    const next = computeExpandAllNavigationExpansion(index, treeMode);
    setExpandedScopeIds(next.expandedScopeIds);
    setExpandedEntityIds(next.expandedEntityIds);
    setExpandedChildListNodeIds(next.expandedChildListNodeIds);
  };

  const collapseToSelection = () => {
    const next = computeCollapseToSelectionNavigationExpansion({
      index,
      selectedScopeId,
      selectedEntityIds,
      treeMode,
    });
    setExpandedScopeIds(next.expandedScopeIds);
    setExpandedEntityIds(next.expandedEntityIds);
    setExpandedChildListNodeIds(next.expandedChildListNodeIds);
  };

  const collapseAll = () => {
    const next = computeCollapseAllNavigationExpansion({ index, treeMode });
    setExpandedScopeIds(next.expandedScopeIds);
    setExpandedEntityIds(next.expandedEntityIds);
    setExpandedChildListNodeIds(next.expandedChildListNodeIds);
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
