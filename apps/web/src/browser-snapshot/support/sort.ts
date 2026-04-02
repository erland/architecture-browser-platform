import type { FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotViewpoint } from '../../app-model';
import type { BrowserSnapshotIndex } from '../model';
import { compactScopeDisplayName, displayNameOf } from './display';
import { getArchitecturalRoles, getArchitecturalSemantics } from './semantics';

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

export function stableSortRelationships(relationships: FullSnapshotRelationship[]) {
  return [...relationships].sort((left, right) => left.externalId.localeCompare(right.externalId, undefined, { sensitivity: 'base' }));
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
