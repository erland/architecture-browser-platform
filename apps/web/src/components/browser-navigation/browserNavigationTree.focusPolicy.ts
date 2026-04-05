import type { BrowserSnapshotIndex, BrowserTreeMode } from '../../browser-snapshot';
import { canExpandEntityInNavigationTree, collectVisibleAncestorScopeIds, isScopeVisibleInTreeMode } from '../../browser-snapshot';

export type BrowserNavigationFocusRevealState = {
  scopeIds: string[];
  entityIds: string[];
  hasExplicitFocusTarget: boolean;
};

export type BrowserNavigationFocusRevealInput = {
  index: BrowserSnapshotIndex | null;
  selectedScopeId: string | null;
  selectedEntityIds: string[];
  treeMode?: BrowserTreeMode;
};

function collectFocusedScopeIds(index: BrowserSnapshotIndex, scopeId: string | null, treeMode: BrowserTreeMode): string[] {
  if (!scopeId || !isScopeVisibleInTreeMode(index, scopeId, treeMode)) {
    return [];
  }
  if (treeMode === 'advanced') {
    const ancestors: string[] = [];
    const seen = new Set<string>();
    let current = index.scopesById.get(scopeId);
    while (current?.parentScopeId && !seen.has(current.parentScopeId)) {
      seen.add(current.parentScopeId);
      ancestors.unshift(current.parentScopeId);
      current = index.scopesById.get(current.parentScopeId);
    }
    return [...ancestors, scopeId];
  }

  return [...collectVisibleAncestorScopeIds(index, scopeId, treeMode), scopeId];
}

function collectExpandableAncestorEntityIds(index: BrowserSnapshotIndex, entityId: string): string[] {
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let currentId = entityId;
  while (!seen.has(currentId)) {
    seen.add(currentId);
    const containers = index.containerEntityIdsByEntityId.get(currentId) ?? [];
    const nextContainerId = containers.find((containerId) => canExpandEntityInNavigationTree(index, containerId));
    if (!nextContainerId) {
      break;
    }
    ancestors.unshift(nextContainerId);
    currentId = nextContainerId;
  }
  return ancestors;
}

export function computeNavigationFocusRevealState({
  index,
  selectedScopeId,
  selectedEntityIds,
  treeMode = 'advanced',
}: BrowserNavigationFocusRevealInput): BrowserNavigationFocusRevealState {
  if (!index) {
    return { scopeIds: [], entityIds: [], hasExplicitFocusTarget: false };
  }

  const scopeIds = collectFocusedScopeIds(index, selectedScopeId, treeMode);
  const entityIds = [...new Set(selectedEntityIds.flatMap((entityId) => collectExpandableAncestorEntityIds(index, entityId)))];
  return {
    scopeIds,
    entityIds,
    hasExplicitFocusTarget: scopeIds.length > 0 || entityIds.length > 0,
  };
}
