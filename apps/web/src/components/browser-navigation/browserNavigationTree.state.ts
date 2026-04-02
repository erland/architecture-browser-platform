import { useEffect, useMemo, useState } from 'react';
import type { BrowserSnapshotIndex, BrowserScopeTreeNode, BrowserTreeMode } from '../../browserSnapshotIndex';
import {
  buildNavigationTreeSummary,
  collectAllVisibleScopeIds,
  computeDefaultExpandedCategories,
  computeDefaultExpandedScopeIds,
} from './browserNavigationTree.model';

export function useBrowserNavigationTreeState(index: BrowserSnapshotIndex | null, selectedScopeId: string | null, treeMode: BrowserTreeMode) {
  const summary = useMemo(() => index ? buildNavigationTreeSummary(index, treeMode) : null, [index, treeMode]);
  const roots = summary?.roots ?? ([] as BrowserScopeTreeNode[]);
  const categoryGroups = summary?.categoryGroups ?? [];
  const totalDescendants = summary?.totalDescendants ?? 0;
  const totalDirectEntities = summary?.totalDirectEntities ?? 0;
  const defaultTreeMode = summary?.defaultTreeMode ?? 'filesystem';

  const [expandedScopeIds, setExpandedScopeIds] = useState<string[]>(() => computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode));

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

  const expandedSet = useMemo(() => new Set(expandedScopeIds), [expandedScopeIds]);
  const expandedCategorySet = useMemo(() => new Set(expandedCategories), [expandedCategories]);

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

  const expandAll = () => {
    if (!index) {
      return;
    }
    setExpandedScopeIds(collectAllVisibleScopeIds(index, treeMode));
    setExpandedCategories(categoryGroups.map((group) => group.kind));
  };

  const collapseToSelection = () => {
    setExpandedScopeIds(computeDefaultExpandedScopeIds(index, selectedScopeId, treeMode));
    setExpandedCategories(computeDefaultExpandedCategories(categoryGroups, index, selectedScopeId, treeMode));
  };

  return {
    roots,
    categoryGroups,
    totalDescendants,
    totalDirectEntities,
    defaultTreeMode,
    expandedSet,
    expandedCategorySet,
    toggleScope,
    toggleCategory,
    expandAll,
    collapseToSelection,
  };
}
