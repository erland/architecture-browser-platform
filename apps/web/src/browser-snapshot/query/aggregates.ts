import type { FullSnapshotEntity, FullSnapshotScope } from '../../app-model';
import type { BrowserScopeTreeNode, BrowserSnapshotIndex } from '../browserSnapshotIndex.types';
import { compactScopeDisplayName } from '../support/display';
import { sortEntityIds, sortScopeIds } from '../support/sort';

export function pushToMapArray<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const current = map.get(key);
  if (current) {
    current.push(value);
    return;
  }
  map.set(key, [value]);
}

export function collectDescendantStats(index: BrowserSnapshotIndex, scopeId: string): { scopeCount: number; entityCount: number } {
  const cached = index.descendantStatsByScopeId.get(scopeId);
  if (cached) return cached;
  let scopeCount = 0;
  let entityCount = (index.entityIdsByScopeId.get(scopeId) ?? []).length;
  const childScopeIds = index.childScopeIdsByParentId.get(scopeId) ?? [];
  for (const childScopeId of childScopeIds) {
    scopeCount += 1;
    const childStats = collectDescendantStats(index, childScopeId);
    scopeCount += childStats.scopeCount;
    entityCount += childStats.entityCount;
  }
  const stats = { scopeCount, entityCount };
  index.descendantStatsByScopeId.set(scopeId, stats);
  return stats;
}

export function buildScopePath(scope: FullSnapshotScope, scopesById: Map<string, FullSnapshotScope>) {
  const segments: string[] = [];
  const seen = new Set<string>();
  let current: FullSnapshotScope | undefined = scope;
  while (current && !seen.has(current.externalId)) {
    seen.add(current.externalId);
    segments.unshift(compactScopeDisplayName(current));
    current = current.parentScopeId ? scopesById.get(current.parentScopeId) : undefined;
  }
  return segments.join(' / ');
}

export function collectSubtreeEntityIds(index: BrowserSnapshotIndex, scopeId: string, cache: Map<string, string[]>) {
  const cached = cache.get(scopeId);
  if (cached) return cached;
  const directEntityIds = index.entityIdsByScopeId.get(scopeId) ?? [];
  const childScopeIds = index.childScopeIdsByParentId.get(scopeId) ?? [];
  const entityIds = [...directEntityIds];
  for (const childScopeId of childScopeIds) entityIds.push(...collectSubtreeEntityIds(index, childScopeId, cache));
  const sorted = sortEntityIds(index, entityIds);
  cache.set(scopeId, sorted);
  return sorted;
}

export function buildContainingScopeIds(index: BrowserSnapshotIndex, entity: FullSnapshotEntity) {
  const scopeIds: string[] = [];
  const seen = new Set<string>();
  let currentScopeId = entity.scopeId;
  while (currentScopeId && !seen.has(currentScopeId)) {
    seen.add(currentScopeId);
    scopeIds.push(currentScopeId);
    currentScopeId = index.scopesById.get(currentScopeId)?.parentScopeId ?? null;
  }
  return scopeIds;
}

export function buildScopeTree(index: BrowserSnapshotIndex, parentScopeId: string | null = null, depth = 0): BrowserScopeTreeNode[] {
  const cached = index.scopeNodesByParentId.get(parentScopeId);
  if (cached) return cached;
  const scopeIds = sortScopeIds(index, index.childScopeIdsByParentId.get(parentScopeId) ?? []);
  const nodes = scopeIds.map((scopeId) => {
    const scope = index.scopesById.get(scopeId);
    if (!scope) throw new Error(`Missing scope '${scopeId}' while building scope tree.`);
    const childScopeIds = sortScopeIds(index, index.childScopeIdsByParentId.get(scopeId) ?? []);
    const directEntityIds = sortEntityIds(index, index.entityIdsByScopeId.get(scopeId) ?? []);
    const descendants = collectDescendantStats(index, scopeId);
    return {
      scopeId,
      parentScopeId,
      name: scope.name,
      displayName: compactScopeDisplayName(scope),
      kind: scope.kind,
      depth,
      path: index.scopePathById.get(scopeId) ?? compactScopeDisplayName(scope),
      childScopeIds,
      directEntityIds,
      descendantScopeCount: descendants.scopeCount,
      descendantEntityCount: descendants.entityCount,
    };
  });
  index.scopeNodesByParentId.set(parentScopeId, nodes);
  for (const node of nodes) buildScopeTree(index, node.scopeId, depth + 1);
  return nodes;
}
