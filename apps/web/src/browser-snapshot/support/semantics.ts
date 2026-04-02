import type { FullSnapshotEntity, FullSnapshotRelationship } from '../../app-model';
import { getAssociationKind, hasAssociationDisplayMetadata } from '../../browserRelationshipSemantics';
import type { BrowserSnapshotIndex, BrowserTreeMode, BrowserViewpointScopeMode } from '../browserSnapshotIndex.types';
import { stableSortRelationships } from './sort';

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

const browserTreeModeKinds: Record<Exclude<BrowserTreeMode, 'advanced'>, Set<string>> = {
  filesystem: new Set(['DIRECTORY', 'FILE']),
  package: new Set(['PACKAGE']),
};

export function matchesTreeModeScopeKind(kind: string, mode: BrowserTreeMode) {
  if (mode === 'advanced') return true;
  return browserTreeModeKinds[mode].has(kind);
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
