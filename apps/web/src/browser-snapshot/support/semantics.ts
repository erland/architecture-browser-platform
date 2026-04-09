import type { FullSnapshotEntity, FullSnapshotRelationship } from '../../app-model';
import { getAssociationKind, hasAssociationDisplayMetadata } from '../../browser-graph/presentation';
import type { BrowserSnapshotIndex, BrowserTreeMode, BrowserViewpointScopeMode } from '../model';
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

function hasCanonicalEntityAssociationCatalog(index: BrowserSnapshotIndex) {
  return (index.payload?.dependencyViews?.entityAssociationRelationships?.length ?? 0) > 0;
}

function getPreferredEntityAssociationViewId(index: BrowserSnapshotIndex) {
  if (hasCanonicalEntityAssociationCatalog(index)) {
    return 'entityAssociationRelationships';
  }
  const dependencyViews = index.payload?.dependencyViews;
  const javaViews = dependencyViews?.javaBrowserViews?.views ?? [];
  const entityModelView = javaViews.find((view) => view.architectureViewKind === 'entity-model');
  const preferred = entityModelView?.preferredDependencyView?.trim();
  if (preferred) return preferred;
  const relationshipCatalogView = entityModelView?.relationshipCatalogView?.trim();
  if (relationshipCatalogView) return relationshipCatalogView;
  const entityAssociationCatalog = dependencyViews?.relationshipCatalogs?.entityAssociations;
  if (entityAssociationCatalog?.canonicalForEntityViews || entityAssociationCatalog?.recommendedForArchitectureViews) {
    return 'entityAssociationRelationships';
  }
  return null;
}



export function getCanonicalRelationshipEvidenceIds(index: BrowserSnapshotIndex, relationship: FullSnapshotRelationship): string[] {
  const normalizedEvidenceIds = relationship.normalizedAssociation?.evidenceRelationshipIds;
  if (normalizedEvidenceIds && normalizedEvidenceIds.length > 0) {
    return [...normalizedEvidenceIds];
  }

  const catalogEntries = index.payload?.dependencyViews?.entityAssociationRelationships ?? [];
  const matchingEntry = catalogEntries.find((entry) => (
    entry.relationshipId === relationship.externalId || entry.canonicalRelationshipId === relationship.externalId
  ));
  return matchingEntry?.evidenceRelationshipIds ? [...matchingEntry.evidenceRelationshipIds] : [];
}

export function resolvePersistentEntityPreferredDependencyViews(index: BrowserSnapshotIndex) {
  const preferred = getPreferredEntityAssociationViewId(index);
  return preferred ? [preferred] : [];
}

function resolveCatalogRelationship(index: BrowserSnapshotIndex, entryRelationshipId: string | null | undefined, canonicalRelationshipId: string | null | undefined) {
  const ids = [entryRelationshipId, canonicalRelationshipId].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  for (const relationshipId of ids) {
    const relationship = index.relationshipsById.get(relationshipId);
    if (relationship) return relationship;
  }
  return null;
}

export function resolveCanonicalEntityAssociationRelationships(index: BrowserSnapshotIndex, seedEntityIds: string[]) {
  const catalogEntries = index.payload?.dependencyViews?.entityAssociationRelationships ?? [];
  if (catalogEntries.length === 0) return [] as FullSnapshotRelationship[];

  const included = new Set(seedEntityIds);
  const resolved: FullSnapshotRelationship[] = [];
  const seenRelationshipIds = new Set<string>();
  for (const entry of catalogEntries) {
    if (!included.has(entry.sourceEntityId) || !included.has(entry.targetEntityId)) continue;
    if (entry.browserViewKind && entry.browserViewKind !== 'relationship-catalog') continue;
    if (entry.architectureViewKinds.length > 0 && !entry.architectureViewKinds.includes('entity-model')) continue;
    if (entry.canonicalForEntityViews === false || entry.recommendedForArchitectureViews === false) continue;
    const relationship = resolveCatalogRelationship(index, entry.relationshipId, entry.canonicalRelationshipId);
    if (!relationship || seenRelationshipIds.has(relationship.externalId)) continue;
    seenRelationshipIds.add(relationship.externalId);
    resolved.push(relationship);
  }
  return stableSortRelationships(resolved);
}



function buildEntityPairKey(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function getCanonicalEntityAssociationContext(index: BrowserSnapshotIndex, seedEntityIds: string[]) {
  const relationships = resolveCanonicalEntityAssociationRelationships(index, seedEntityIds);
  const canonicalRelationshipIds = new Set(relationships.map((relationship) => relationship.externalId));
  const canonicalPairKeys = new Set<string>();
  for (const relationship of relationships) {
    canonicalPairKeys.add(buildEntityPairKey(relationship.fromEntityId, relationship.toEntityId));
  }
  return { relationships, canonicalRelationshipIds, canonicalPairKeys };
}

export function isShadowedByCanonicalEntityAssociation(
  relationship: FullSnapshotRelationship,
  canonicalRelationshipIds: Set<string>,
  canonicalPairKeys: Set<string>,
) {
  if (canonicalRelationshipIds.has(relationship.externalId)) {
    return false;
  }
  const pairKey = buildEntityPairKey(relationship.fromEntityId, relationship.toEntityId);
  if (!canonicalPairKeys.has(pairKey)) {
    return false;
  }
  return true;
}

export function resolvePersistentEntityAssociationRelationships(index: BrowserSnapshotIndex, seedEntityIds: string[]) {
  const preferredRelationships = resolveCanonicalEntityAssociationRelationships(index, seedEntityIds);
  if (preferredRelationships.length > 0) return preferredRelationships;

  const included = new Set(seedEntityIds);
  return stableSortRelationships([...index.relationshipsById.values()].filter((relationship) => included.has(relationship.fromEntityId) && included.has(relationship.toEntityId) && getAssociationKind(relationship) === 'association' && hasAssociationDisplayMetadata(relationship)));
}

export function resolvePersistentEntityAssociationEndpointIds(index: BrowserSnapshotIndex, seedEntityIds: Iterable<string>) {
  const relationships = resolvePersistentEntityAssociationRelationships(index, [...seedEntityIds]);
  const entityIds = new Set<string>();
  for (const relationship of relationships) {
    entityIds.add(relationship.fromEntityId);
    entityIds.add(relationship.toEntityId);
  }
  return entityIds;
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
