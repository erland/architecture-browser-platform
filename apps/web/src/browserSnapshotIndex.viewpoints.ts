import type { FullSnapshotRelationship, FullSnapshotViewpoint } from './appModel';
import type { BrowserResolvedViewpointGraph, BrowserSnapshotIndex, BrowserViewpointScopeMode, BrowserViewpointVariant } from './browserSnapshotIndex.types';
import { getArchitecturalRoles, getArchitecturalSemantics, includeIntegrationMapImmediateNeighbors, isEntityWithinScopeMode, resolvePersistentEntityAssociationRelationships } from './browserSnapshotIndex.semantics';
import { sortEntityIds, sortViewpointEntityIds, sortViewpointRelationshipIds, stableSortRelationships } from './browserSnapshotIndex.sort';

export function getAvailableViewpoints(index: BrowserSnapshotIndex, options?: { includePartial?: boolean; includeUnavailable?: boolean }) {
  const includePartial = options?.includePartial ?? true;
  const includeUnavailable = options?.includeUnavailable ?? false;
  return [...index.viewpointsById.values()]
    .filter((viewpoint) => includeUnavailable || viewpoint.availability !== 'unavailable')
    .filter((viewpoint) => includePartial || viewpoint.availability === 'available')
    .sort((left, right) => left.id.localeCompare(right.id, undefined, { sensitivity: 'base' }));
}

export function getViewpointById(index: BrowserSnapshotIndex, viewpointId: string) {
  return index.viewpointsById.get(viewpointId) ?? null;
}

export function resolveViewpointSeedEntityIds(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, options?: { scopeMode?: BrowserViewpointScopeMode; selectedScopeId?: string | null; variant?: BrowserViewpointVariant }) {
  const scopeMode = options?.scopeMode ?? 'whole-snapshot';
  const selectedScopeId = options?.selectedScopeId ?? null;
  const variant = options?.variant ?? 'default';
  const entityIds = new Set<string>();
  if (viewpoint.id === 'persistence-model' && variant === 'show-entity-relations') {
    for (const entityId of index.entityIdsByArchitecturalRole.get('persistent-entity') ?? []) {
      if (isEntityWithinScopeMode(index, entityId, scopeMode, selectedScopeId)) entityIds.add(entityId);
    }
    return sortEntityIds(index, entityIds);
  }
  for (const entityId of viewpoint.seedEntityIds) {
    if (index.entitiesById.has(entityId) && isEntityWithinScopeMode(index, entityId, scopeMode, selectedScopeId)) entityIds.add(entityId);
  }
  for (const roleId of viewpoint.seedRoleIds) {
    for (const entityId of index.entityIdsByArchitecturalRole.get(roleId) ?? []) {
      if (isEntityWithinScopeMode(index, entityId, scopeMode, selectedScopeId)) entityIds.add(entityId);
    }
  }
  return sortEntityIds(index, entityIds);
}

export function resolveViewpointExpansionRelationships(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, seedEntityIds: Iterable<string>) {
  const allowedSemantics = viewpoint.expandViaSemantics.filter((semantic) => index.relationshipIdsByArchitecturalSemantic.has(semantic));
  if (allowedSemantics.length === 0) return [] as FullSnapshotRelationship[];
  const candidateRelationshipIds = new Set<string>();
  for (const semantic of allowedSemantics) {
    for (const relationshipId of index.relationshipIdsByArchitecturalSemantic.get(semantic) ?? []) candidateRelationshipIds.add(relationshipId);
  }
  const includedSeedIds = new Set([...seedEntityIds].filter((entityId) => index.entitiesById.has(entityId)));
  const candidates = [...candidateRelationshipIds]
    .map((relationshipId) => index.relationshipsById.get(relationshipId))
    .filter((relationship): relationship is FullSnapshotRelationship => Boolean(relationship))
    .filter((relationship) => {
      if (includedSeedIds.size === 0) return true;
      return includedSeedIds.has(relationship.fromEntityId) || includedSeedIds.has(relationship.toEntityId) || ['request-handling', 'api-surface', 'persistence-model', 'integration-map', 'module-dependencies', 'ui-navigation'].includes(viewpoint.id);
    });
  return stableSortRelationships(candidates);
}

export function buildViewpointGraph(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, options?: { scopeMode?: BrowserViewpointScopeMode; selectedScopeId?: string | null; variant?: BrowserViewpointVariant }): BrowserResolvedViewpointGraph {
  const scopeMode = options?.scopeMode ?? 'whole-snapshot';
  const selectedScopeId = options?.selectedScopeId ?? null;
  const variant = options?.variant ?? 'default';
  const seedEntityIds = resolveViewpointSeedEntityIds(index, viewpoint, { scopeMode, selectedScopeId, variant });
  const resolvedSeedEntityIds = viewpoint.id === 'api-surface'
    ? sortViewpointEntityIds(index, viewpoint, seedEntityIds.filter((entityId) => {
        const entity = index.entitiesById.get(entityId);
        return entity ? getArchitecturalRoles(entity).includes('api-entrypoint') : false;
      }), [])
    : viewpoint.id === 'integration-map'
      ? sortViewpointEntityIds(index, viewpoint, seedEntityIds.filter((entityId) => {
          const entity = index.entitiesById.get(entityId);
          if (!entity) return false;
          const roles = getArchitecturalRoles(entity);
          return roles.includes('integration-adapter') || roles.includes('external-dependency');
        }), [])
      : viewpoint.id === 'ui-navigation'
        ? sortViewpointEntityIds(index, viewpoint, seedEntityIds.filter((entityId) => {
            const relationshipIds = [...(index.inboundRelationshipIdsByEntityId.get(entityId) ?? []), ...(index.outboundRelationshipIdsByEntityId.get(entityId) ?? [])];
            return relationshipIds.some((relationshipId) => {
              const relationship = index.relationshipsById.get(relationshipId);
              if (!relationship) return false;
              const semantics = getArchitecturalSemantics(relationship);
              return semantics.includes('contains-route') || semantics.includes('navigates-to') || semantics.includes('redirects-to') || semantics.includes('guards-route');
            });
          }), [])
        : sortViewpointEntityIds(index, viewpoint, seedEntityIds, []);
  let expansionRelationships = viewpoint.id === 'persistence-model' && variant === 'show-entity-relations'
    ? resolvePersistentEntityAssociationRelationships(index, resolvedSeedEntityIds)
    : resolveViewpointExpansionRelationships(index, viewpoint, resolvedSeedEntityIds);
  if (viewpoint.id === 'ui-navigation') {
    expansionRelationships = stableSortRelationships(expansionRelationships.filter((relationship) => {
      const semantics = getArchitecturalSemantics(relationship);
      return semantics.includes('contains-route') || semantics.includes('navigates-to') || semantics.includes('redirects-to') || semantics.includes('guards-route');
    }));
  }
  if (viewpoint.id === 'module-dependencies') {
    expansionRelationships = stableSortRelationships(expansionRelationships.filter((relationship) => {
      const fromEntity = index.entitiesById.get(relationship.fromEntityId);
      const toEntity = index.entitiesById.get(relationship.toEntityId);
      return Boolean(fromEntity && toEntity && getArchitecturalRoles(fromEntity).includes('module-boundary') && getArchitecturalRoles(toEntity).includes('module-boundary'));
    }));
  }
  if (viewpoint.id === 'request-handling') {
    expansionRelationships = stableSortRelationships(expansionRelationships.filter((relationship) => {
      const fromEntity = index.entitiesById.get(relationship.fromEntityId);
      const toEntity = index.entitiesById.get(relationship.toEntityId);
      if (!fromEntity || !toEntity) return false;
      const fromRoles = getArchitecturalRoles(fromEntity);
      const toRoles = getArchitecturalRoles(toEntity);
      const allowedRoles = new Set(['api-entrypoint', 'application-service', 'persistence-access', 'persistent-entity']);
      return [...fromRoles, ...toRoles].every((role) => !role || allowedRoles.has(role) || (role !== 'integration-adapter' && role !== 'external-dependency'))
        && !fromRoles.includes('integration-adapter') && !fromRoles.includes('external-dependency') && !toRoles.includes('integration-adapter') && !toRoles.includes('external-dependency');
    }));
  }
  if (viewpoint.id === 'api-surface') {
    const apiSeedSet = new Set(resolvedSeedEntityIds);
    expansionRelationships = expansionRelationships.filter((relationship) => apiSeedSet.has(relationship.fromEntityId) || apiSeedSet.has(relationship.toEntityId));
  }
  if (viewpoint.id === 'integration-map') expansionRelationships = includeIntegrationMapImmediateNeighbors(index, resolvedSeedEntityIds, [...expansionRelationships]);
  if (viewpoint.id === 'persistence-model' && variant !== 'default') {
    if (variant === 'show-writers' || variant === 'show-readers') {
      expansionRelationships = stableSortRelationships(expansionRelationships.filter((relationship) => {
        const semantics = getArchitecturalSemantics(relationship);
        return semantics.includes('accesses-persistence') || semantics.includes('stored-in');
      }));
    }
    if (variant === 'show-upstream-callers') {
      const included = new Set(expansionRelationships.map((relationship) => relationship.externalId));
      const extraRelationships: FullSnapshotRelationship[] = [];
      for (const entityId of resolvedSeedEntityIds) {
        for (const inboundId of index.inboundRelationshipIdsByEntityId.get(entityId) ?? []) {
          const inbound = index.relationshipsById.get(inboundId);
          if (!inbound || included.has(inbound.externalId)) continue;
          const semantics = getArchitecturalSemantics(inbound);
          if (semantics.includes('invokes-use-case') || semantics.includes('serves-request') || semantics.includes('accesses-persistence')) {
            extraRelationships.push(inbound);
            included.add(inbound.externalId);
          }
        }
      }
      expansionRelationships = stableSortRelationships([...expansionRelationships, ...extraRelationships]);
    }
  }
  if (viewpoint.id === 'request-handling' && variant === 'show-upstream-callers') {
    const included = new Set(expansionRelationships.map((relationship) => relationship.externalId));
    const extraRelationships: FullSnapshotRelationship[] = [];
    for (const entityId of resolvedSeedEntityIds) {
      for (const inboundId of index.inboundRelationshipIdsByEntityId.get(entityId) ?? []) {
        const inbound = index.relationshipsById.get(inboundId);
        if (!inbound || included.has(inbound.externalId)) continue;
        const semantics = getArchitecturalSemantics(inbound);
        if (semantics.includes('serves-request') || semantics.includes('invokes-use-case')) {
          extraRelationships.push(inbound);
          included.add(inbound.externalId);
        }
      }
    }
    expansionRelationships = stableSortRelationships([...expansionRelationships, ...extraRelationships]);
  }
  const entityIds = new Set(resolvedSeedEntityIds);
  for (const relationship of expansionRelationships) {
    entityIds.add(relationship.fromEntityId);
    entityIds.add(relationship.toEntityId);
  }
  const sortedSeedEntityIds = sortViewpointEntityIds(index, viewpoint, resolvedSeedEntityIds, expansionRelationships);
  const sortedEntityIds = sortViewpointEntityIds(index, viewpoint, entityIds, expansionRelationships);
  const orderedEntityIds = viewpoint.id === 'integration-map' ? sortedEntityIds : [...sortedSeedEntityIds, ...sortedEntityIds.filter((entityId) => !sortedSeedEntityIds.includes(entityId))];
  return {
    viewpoint,
    scopeMode,
    selectedScopeId,
    variant,
    seedEntityIds: sortedSeedEntityIds,
    entityIds: orderedEntityIds,
    relationshipIds: sortViewpointRelationshipIds(index, viewpoint, expansionRelationships),
    preferredDependencyViews: [...viewpoint.preferredDependencyViews],
    recommendedLayout: variant === 'show-upstream-callers' ? 'upstream-callers' : viewpoint.id === 'persistence-model' && variant === 'show-writers' ? 'persistence-writers' : viewpoint.id === 'persistence-model' && variant === 'show-readers' ? 'persistence-readers' : viewpoint.id === 'persistence-model' && variant === 'show-entity-relations' ? 'persistence-model' : viewpoint.id === 'request-handling' ? 'request-flow' : viewpoint.id === 'api-surface' ? 'api-surface' : viewpoint.id === 'persistence-model' ? 'persistence-model' : viewpoint.id === 'integration-map' ? 'integration-map' : viewpoint.id === 'module-dependencies' ? 'module-dependencies' : viewpoint.id === 'ui-navigation' ? 'ui-navigation' : 'generic',
  };
}
