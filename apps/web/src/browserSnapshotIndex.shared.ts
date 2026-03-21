import type {
  FullSnapshotEntity,
  FullSnapshotRelationship,
  FullSnapshotScope,
  FullSnapshotViewpoint,
  SnapshotSourceRef,
} from './appModel';
import { getAssociationKind, hasAssociationDisplayMetadata } from './browserRelationshipSemantics';
import type {
  BrowserScopeTreeNode,
  BrowserSearchDocument,
  BrowserSearchResultKind,
  BrowserSnapshotIndex,
  BrowserTreeMode,
  BrowserViewpointScopeMode,
} from './browserSnapshotIndex.types';

export function pushToMapArray<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const current = map.get(key);
  if (current) {
    current.push(value);
    return;
  }
  map.set(key, [value]);
}

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase();
}

export function displayNameOf(item: { displayName: string | null; name: string }) {
  return item.displayName?.trim() || item.name;
}

export function compactScopeDisplayName(scope: FullSnapshotScope) {
  const raw = displayNameOf(scope);
  if ((scope.kind === 'FILE' || scope.kind === 'DIRECTORY') && raw.includes('/')) {
    const segments = raw.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? raw;
  }
  return raw;
}

export function compareByDisplayName(a: { displayName: string | null; name: string }, b: { displayName: string | null; name: string }) {
  return displayNameOf(a).localeCompare(displayNameOf(b), undefined, { sensitivity: 'base' });
}

const scopeKindOrder = new Map<string, number>([
  ['REPOSITORY', 10], ['MODULE', 20], ['PACKAGE', 30], ['NAMESPACE', 40], ['DIRECTORY', 50], ['FILE', 60],
]);

export function compareScopeIds(index: BrowserSnapshotIndex, leftScopeId: string, rightScopeId: string) {
  const left = index.scopesById.get(leftScopeId);
  const right = index.scopesById.get(rightScopeId);
  if (!left || !right) return leftScopeId.localeCompare(rightScopeId);
  const leftOrder = scopeKindOrder.get(left.kind) ?? 999;
  const rightOrder = scopeKindOrder.get(right.kind) ?? 999;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return compactScopeDisplayName(left).localeCompare(compactScopeDisplayName(right), undefined, { sensitivity: 'base' });
}

export function getArchitecturalRoles(entity: FullSnapshotEntity) {
  const entityWithTopLevelRoles = entity as FullSnapshotEntity & { architecturalRoles?: unknown };
  const roles = Array.isArray(entityWithTopLevelRoles.architecturalRoles)
    ? entityWithTopLevelRoles.architecturalRoles
    : entity.metadata?.architecturalRoles;
  return Array.isArray(roles)
    ? roles.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];
}

export function getArchitecturalSemantics(relationship: FullSnapshotRelationship) {
  const semantics = relationship.metadata?.architecturalSemantics;
  return Array.isArray(semantics) ? semantics.filter((value): value is string => typeof value === 'string' && value.trim().length > 0) : [];
}

export function compareEntityIds(index: BrowserSnapshotIndex, leftEntityId: string, rightEntityId: string) {
  const left = index.entitiesById.get(leftEntityId);
  const right = index.entitiesById.get(rightEntityId);
  if (!left || !right) return leftEntityId.localeCompare(rightEntityId);
  return compareByDisplayName(left, right);
}

export function sortScopeIds(index: BrowserSnapshotIndex, scopeIds: Iterable<string>) {
  return [...new Set(scopeIds)].sort((a, b) => compareScopeIds(index, a, b));
}

export function sortEntityIds(index: BrowserSnapshotIndex, entityIds: Iterable<string>) {
  return [...new Set(entityIds)].sort((a, b) => compareEntityIds(index, a, b));
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

export function collectSourceRefs(...collections: Array<SnapshotSourceRef[] | undefined>) {
  const all = collections.flatMap((items) => items ?? []);
  const seen = new Set<string>();
  const unique: SnapshotSourceRef[] = [];
  for (const item of all) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

export function stableSortRelationships(relationships: FullSnapshotRelationship[]) {
  return [...relationships].sort((left, right) => left.externalId.localeCompare(right.externalId, undefined, { sensitivity: 'base' }));
}

export function isScopeWithin(index: BrowserSnapshotIndex, scopeId: string | null, candidateScopeId: string | null | undefined) {
  if (!scopeId) return true;
  if (!candidateScopeId) return false;
  if (scopeId === candidateScopeId) return true;
  const seen = new Set<string>();
  let current = index.scopesById.get(candidateScopeId);
  while (current?.parentScopeId && !seen.has(current.externalId)) {
    seen.add(current.externalId);
    if (current.parentScopeId === scopeId) return true;
    current = index.scopesById.get(current.parentScopeId);
  }
  return false;
}

export function isEntityWithinScopeMode(index: BrowserSnapshotIndex, entityId: string, scopeMode: BrowserViewpointScopeMode, selectedScopeId: string | null) {
  if (scopeMode === 'whole-snapshot') return true;
  const entity = index.entitiesById.get(entityId);
  if (!entity?.scopeId || !selectedScopeId) return false;
  if (scopeMode === 'selected-scope') return entity.scopeId === selectedScopeId;
  return isScopeWithin(index, selectedScopeId, entity.scopeId);
}

export function createSearchDocument(kind: BrowserSearchResultKind, id: string, title: string, subtitle: string, scopeId: string | null, searchParts: Array<string | null | undefined>): BrowserSearchDocument {
  return { kind, id, title, subtitle, scopeId, normalizedText: normalizeSearchText(searchParts.join(' ')) };
}

export function buildSearchableDocuments(index: BrowserSnapshotIndex) {
  const scopeDocuments = index.payload.scopes.map((scope) => createSearchDocument('scope', scope.externalId, displayNameOf(scope), index.scopePathById.get(scope.externalId) ?? scope.kind, scope.externalId, [scope.externalId, scope.kind, scope.name, scope.displayName, index.scopePathById.get(scope.externalId)]));
  const entityDocuments = index.payload.entities.map((entity) => {
    const relatedRelationshipIds = [
      ...(index.inboundRelationshipIdsByEntityId.get(entity.externalId) ?? []),
      ...(index.outboundRelationshipIdsByEntityId.get(entity.externalId) ?? []),
    ];
    const relatedTerms = relatedRelationshipIds.flatMap((relationshipId) => {
      const relationship = index.relationshipsById.get(relationshipId);
      if (!relationship) return [];
      const fromEntity = index.entitiesById.get(relationship.fromEntityId);
      const toEntity = index.entitiesById.get(relationship.toEntityId);
      return [relationship.kind, relationship.label, relationship.externalId, fromEntity?.name, fromEntity?.displayName, toEntity?.name, toEntity?.displayName];
    });
    return createSearchDocument('entity', entity.externalId, displayNameOf(entity), [entity.kind, entity.scopeId ? index.scopePathById.get(entity.scopeId) : null].filter(Boolean).join(' • '), entity.scopeId, [entity.externalId, entity.kind, entity.origin, entity.name, entity.displayName, entity.scopeId ? index.scopePathById.get(entity.scopeId) : null, ...relatedTerms]);
  });
  const relationshipDocuments = index.payload.relationships.map((relationship) => {
    const fromEntity = index.entitiesById.get(relationship.fromEntityId);
    const toEntity = index.entitiesById.get(relationship.toEntityId);
    const scopeId = fromEntity?.scopeId ?? toEntity?.scopeId ?? null;
    return createSearchDocument('relationship', relationship.externalId, relationship.label?.trim() || relationship.kind, [displayNameOf(fromEntity ?? { name: relationship.fromEntityId, displayName: null }), '→', displayNameOf(toEntity ?? { name: relationship.toEntityId, displayName: null })].join(' '), scopeId, [relationship.externalId, relationship.kind, relationship.label, fromEntity?.name, fromEntity?.displayName, toEntity?.name, toEntity?.displayName]);
  });
  const diagnosticDocuments = index.payload.diagnostics.map((diagnostic) => createSearchDocument('diagnostic', diagnostic.externalId, `${diagnostic.severity}: ${diagnostic.code}`, diagnostic.message, diagnostic.scopeId ?? index.entitiesById.get(diagnostic.entityId ?? '')?.scopeId ?? null, [diagnostic.externalId, diagnostic.severity, diagnostic.phase, diagnostic.code, diagnostic.message, diagnostic.filePath]));
  return [...scopeDocuments, ...entityDocuments, ...relationshipDocuments, ...diagnosticDocuments];
}

const browserTreeModeKinds: Record<Exclude<BrowserTreeMode, 'advanced'>, Set<string>> = {
  filesystem: new Set(['DIRECTORY', 'FILE']),
  package: new Set(['PACKAGE']),
};

export function matchesTreeModeScopeKind(kind: string, mode: BrowserTreeMode) {
  if (mode === 'advanced') return true;
  return browserTreeModeKinds[mode].has(kind);
}

export function getApiSurfaceRolePriority(entity: FullSnapshotEntity) {
  const roles = getArchitecturalRoles(entity);
  if (roles.includes('api-entrypoint')) return 0;
  if (roles.includes('application-service')) return 1;
  if (roles.includes('integration-adapter') || roles.includes('external-dependency')) return 2;
  if (roles.includes('persistence-access') || roles.includes('persistent-entity')) return 3;
  return 4;
}

export function getRequestHandlingRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('api-entrypoint')) return 0;
  if (roles.has('application-service')) return 1;
  if (roles.has('persistence-access') || roles.has('persistent-entity')) return 2;
  if (roles.has('integration-adapter') || roles.has('external-dependency')) return 3;
  return 4;
}

export function getPersistenceModelRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('application-service') || roles.has('api-entrypoint')) return 0;
  if (roles.has('persistence-access')) return 1;
  if (roles.has('persistent-entity')) return 2;
  if (roles.has('datastore')) return 3;
  return 4;
}

export function getIntegrationMapRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('api-entrypoint') || roles.has('application-service')) return 0;
  if (roles.has('integration-adapter')) return 1;
  if (roles.has('external-dependency')) return 2;
  return 3;
}

export function getModuleDependenciesRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('module-boundary')) return 0;
  if (entity.kind === 'MODULE' || entity.kind === 'PACKAGE') return 1;
  return 2;
}

export function getUiNavigationRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('ui-layout')) return 0;
  if (roles.has('ui-page')) return 1;
  if (roles.has('ui-navigation-node')) return 2;
  return 3;
}

function computeRelationshipDistances(seedEntityIds: string[], relationships: FullSnapshotRelationship[]) {
  const adjacency = new Map<string, Set<string>>();
  for (const relationship of relationships) {
    if (!adjacency.has(relationship.fromEntityId)) adjacency.set(relationship.fromEntityId, new Set());
    if (!adjacency.has(relationship.toEntityId)) adjacency.set(relationship.toEntityId, new Set());
    adjacency.get(relationship.fromEntityId)?.add(relationship.toEntityId);
    adjacency.get(relationship.toEntityId)?.add(relationship.fromEntityId);
  }
  const distances = new Map<string, number>();
  const queue = [...seedEntityIds];
  for (const entityId of seedEntityIds) distances.set(entityId, 0);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const baseDistance = distances.get(current) ?? 0;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (distances.has(neighbor)) continue;
      distances.set(neighbor, baseDistance + 1);
      queue.push(neighbor);
    }
  }
  return distances;
}

export function sortViewpointEntityIds(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, entityIds: Iterable<string>, relationships: FullSnapshotRelationship[]) {
  const uniqueEntityIds = [...new Set(entityIds)];
  if (!['request-handling', 'api-surface', 'persistence-model', 'integration-map', 'module-dependencies', 'ui-navigation'].includes(viewpoint.id)) {
    return uniqueEntityIds.sort((a, b) => compareEntityIds(index, a, b));
  }
  const apiSeedEntityIds = uniqueEntityIds.filter((entityId) => {
    const entity = index.entitiesById.get(entityId);
    return entity ? getArchitecturalRoles(entity).includes('api-entrypoint') : false;
  });
  const fallbackSeeds = apiSeedEntityIds.length > 0 ? apiSeedEntityIds : uniqueEntityIds;
  const distances = computeRelationshipDistances(fallbackSeeds, relationships);
  return uniqueEntityIds.sort((leftId, rightId) => {
    const left = index.entitiesById.get(leftId);
    const right = index.entitiesById.get(rightId);
    if (!left || !right) return leftId.localeCompare(rightId);
    const priorityDelta = (
      viewpoint.id === 'api-surface'
        ? getApiSurfaceRolePriority(left) - getApiSurfaceRolePriority(right)
        : viewpoint.id === 'persistence-model'
          ? getPersistenceModelRolePriority(left) - getPersistenceModelRolePriority(right)
          : viewpoint.id === 'integration-map'
            ? getIntegrationMapRolePriority(left) - getIntegrationMapRolePriority(right)
            : viewpoint.id === 'module-dependencies'
              ? getModuleDependenciesRolePriority(left) - getModuleDependenciesRolePriority(right)
              : viewpoint.id === 'ui-navigation'
                ? getUiNavigationRolePriority(left) - getUiNavigationRolePriority(right)
                : getRequestHandlingRolePriority(left) - getRequestHandlingRolePriority(right)
    );
    const distanceDelta = (distances.get(leftId) ?? Number.MAX_SAFE_INTEGER) - (distances.get(rightId) ?? Number.MAX_SAFE_INTEGER);
    if (viewpoint.id === 'persistence-model') {
      if (distanceDelta !== 0) return distanceDelta;
      if (priorityDelta !== 0) return priorityDelta;
    } else if (priorityDelta !== 0) return priorityDelta;
    if (distanceDelta !== 0) return distanceDelta;
    const scopePathDelta = (index.scopePathById.get(left.scopeId ?? '') ?? '').localeCompare(index.scopePathById.get(right.scopeId ?? '') ?? '', undefined, { sensitivity: 'base' });
    if (scopePathDelta !== 0) return scopePathDelta;
    return compareByDisplayName(left, right);
  });
}

function getViewpointRelationshipSemanticPriority(viewpoint: FullSnapshotViewpoint, relationship: FullSnapshotRelationship) {
  const semantics = getArchitecturalSemantics(relationship);
  const firstSemantic = semantics[0] ?? '';
  if (viewpoint.id === 'ui-navigation') {
    if (firstSemantic === 'contains-route') return 0;
    if (firstSemantic === 'guards-route') return 1;
    if (firstSemantic === 'navigates-to') return 2;
    if (firstSemantic === 'redirects-to') return 3;
  }
  if (viewpoint.id === 'request-handling') {
    if (firstSemantic === 'serves-request') return 0;
    if (firstSemantic === 'invokes-use-case') return 1;
    if (firstSemantic === 'accesses-persistence') return 2;
  }
  if (viewpoint.id === 'api-surface') {
    if (firstSemantic === 'serves-request') return 0;
    if (firstSemantic === 'invokes-use-case') return 1;
  }
  if (viewpoint.id === 'persistence-model') {
    if (firstSemantic === 'accesses-persistence') return 0;
    if (firstSemantic === 'stored-in') return 1;
  }
  if (viewpoint.id === 'integration-map') {
    if (firstSemantic === 'invokes-use-case') return 0;
    if (firstSemantic === 'calls-external-system') return 1;
  }
  if (viewpoint.id === 'module-dependencies' && firstSemantic === 'depends-on-module') return 0;
  return 100;
}

export function sortViewpointRelationshipIds(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, relationships: FullSnapshotRelationship[]) {
  if (!['request-handling', 'api-surface', 'persistence-model', 'integration-map', 'module-dependencies', 'ui-navigation'].includes(viewpoint.id)) {
    return stableSortRelationships(relationships).map((relationship) => relationship.externalId);
  }
  const sorted = [...relationships].sort((left, right) => {
    const leftFrom = index.entitiesById.get(left.fromEntityId);
    const rightFrom = index.entitiesById.get(right.fromEntityId);
    const leftTo = index.entitiesById.get(left.toEntityId);
    const rightTo = index.entitiesById.get(right.toEntityId);
    const semanticPriorityDelta = getViewpointRelationshipSemanticPriority(viewpoint, left) - getViewpointRelationshipSemanticPriority(viewpoint, right);
    if (semanticPriorityDelta !== 0) return semanticPriorityDelta;
    const getPriority = viewpoint.id === 'api-surface' ? getApiSurfaceRolePriority : viewpoint.id === 'persistence-model' ? getPersistenceModelRolePriority : viewpoint.id === 'integration-map' ? getIntegrationMapRolePriority : viewpoint.id === 'module-dependencies' ? getModuleDependenciesRolePriority : viewpoint.id === 'ui-navigation' ? getUiNavigationRolePriority : getRequestHandlingRolePriority;
    const fromPriorityDelta = getPriority(leftFrom ?? { metadata: {}, displayName: null, name: left.fromEntityId } as FullSnapshotEntity) - getPriority(rightFrom ?? { metadata: {}, displayName: null, name: right.fromEntityId } as FullSnapshotEntity);
    if (fromPriorityDelta !== 0) return fromPriorityDelta;
    const toPriorityDelta = getPriority(leftTo ?? { metadata: {}, displayName: null, name: left.toEntityId } as FullSnapshotEntity) - getPriority(rightTo ?? { metadata: {}, displayName: null, name: right.toEntityId } as FullSnapshotEntity);
    if (toPriorityDelta !== 0) return toPriorityDelta;
    const labelDelta = (left.label ?? left.kind).localeCompare((right.label ?? right.kind), undefined, { sensitivity: 'base' });
    if (labelDelta !== 0) return labelDelta;
    return left.externalId.localeCompare(right.externalId);
  });
  return sorted.map((relationship) => relationship.externalId);
}

export function resolvePersistentEntityAssociationRelationships(index: BrowserSnapshotIndex, seedEntityIds: string[]) {
  const included = new Set(seedEntityIds);
  return stableSortRelationships([...index.relationshipsById.values()].filter((relationship) => included.has(relationship.fromEntityId) && included.has(relationship.toEntityId) && getAssociationKind(relationship) === 'association' && hasAssociationDisplayMetadata(relationship)));
}

export function includeIntegrationMapImmediateNeighbors(index: BrowserSnapshotIndex, seedEntityIds: string[], relationships: FullSnapshotRelationship[]) {
  const includedRelationshipIds = new Set(relationships.map((relationship) => relationship.externalId));
  const integrationSeedIds = new Set(seedEntityIds.filter((entityId) => {
    const entity = index.entitiesById.get(entityId);
    if (!entity) return false;
    const roles = getArchitecturalRoles(entity);
    return roles.includes('integration-adapter') || roles.includes('external-dependency');
  }));
  if (integrationSeedIds.size === 0) return relationships;
  for (const seedEntityId of integrationSeedIds) {
    const relationshipIds = [...(index.inboundRelationshipIdsByEntityId.get(seedEntityId) ?? []), ...(index.outboundRelationshipIdsByEntityId.get(seedEntityId) ?? [])];
    for (const relationshipId of relationshipIds) {
      if (includedRelationshipIds.has(relationshipId)) continue;
      const relationship = index.relationshipsById.get(relationshipId);
      if (!relationship) continue;
      includedRelationshipIds.add(relationshipId);
      relationships.push(relationship);
    }
  }
  return stableSortRelationships(relationships);
}
