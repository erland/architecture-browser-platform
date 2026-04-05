import { isScopeVisibleInTreeMode, type BrowserSearchResult, type BrowserSnapshotIndex, type BrowserTreeMode } from '../../browser-snapshot';
import type { BrowserNavigationSearchVisibility } from './browserNavigationTree.shared';
import { collectAncestorScopeIds, collectSafeNavigationAncestorEntityIds } from './browserNavigationTree.expansion';
import { filterNavigationRootsForVisibility } from './browserNavigationTree.rootPresentation';

export function collectNavigationSearchVisibility(
  index: BrowserSnapshotIndex,
  treeMode: BrowserTreeMode,
  searchResults: BrowserSearchResult[],
): BrowserNavigationSearchVisibility {
  const scopeIds = new Set<string>();
  const entityIds = new Set<string>();

  const addScopePath = (scopeId: string | null) => {
    if (!scopeId || !isScopeVisibleInTreeMode(index, scopeId, treeMode)) {
      return;
    }
    scopeIds.add(scopeId);
    for (const ancestorId of collectAncestorScopeIds(index, scopeId, treeMode)) {
      scopeIds.add(ancestorId);
    }
  };

  const addEntityPath = (entityId: string) => {
    const entity = index.entitiesById.get(entityId);
    if (!entity) {
      return;
    }
    entityIds.add(entityId);
    addScopePath(entity.scopeId);
    for (const ancestorEntityId of collectSafeNavigationAncestorEntityIds(index, entityId)) {
      entityIds.add(ancestorEntityId);
      const ancestorEntity = index.entitiesById.get(ancestorEntityId);
      if (ancestorEntity?.scopeId) {
        addScopePath(ancestorEntity.scopeId);
      }
    }
  };

  for (const result of searchResults) {
    if (result.kind === 'entity') {
      addEntityPath(result.id);
      continue;
    }
    if (result.kind === 'scope') {
      addScopePath(result.id);
      continue;
    }
    addScopePath(result.scopeId);
  }

  return { scopeIds, entityIds };
}

export function filterRootsForSearch(
  roots: import('../../browser-snapshot').BrowserScopeTreeNode[],
  visibleScopeIds: Set<string> | null,
) {
  return filterNavigationRootsForVisibility(roots, visibleScopeIds);
}
