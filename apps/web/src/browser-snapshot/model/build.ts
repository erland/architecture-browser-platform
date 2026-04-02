import type { FullSnapshotPayload } from '../../app-model';
import type { BrowserSnapshotIndex } from './types';
import { buildContainingScopeIds, buildScopePath, buildScopeTree, collectSubtreeEntityIds, pushToMapArray } from '../query/aggregates';
import { buildSearchableDocuments } from '../support/display';
import { getArchitecturalRoles, getArchitecturalSemantics } from '../support/semantics';
import { sortEntityIds } from '../support/sort';

export function buildBrowserSnapshotIndex(payload: FullSnapshotPayload): BrowserSnapshotIndex;
export function buildBrowserSnapshotIndex(_snapshotSummary: unknown, payload: FullSnapshotPayload): BrowserSnapshotIndex;
export function buildBrowserSnapshotIndex(payloadOrSummary: unknown, maybePayload?: FullSnapshotPayload): BrowserSnapshotIndex {
  const payload = (maybePayload ?? payloadOrSummary) as FullSnapshotPayload;
  const scopes = payload.scopes ?? [];
  const entities = payload.entities ?? [];
  const relationships = payload.relationships ?? [];
  const diagnostics = payload.diagnostics ?? [];
  const viewpoints = payload.viewpoints ?? [];
  const scopesById = new Map(scopes.map((scope) => [scope.externalId, scope]));
  const entitiesById = new Map(entities.map((entity) => [entity.externalId, entity]));
  const relationshipsById = new Map(relationships.map((relationship) => [relationship.externalId, relationship]));
  const diagnosticsById = new Map(diagnostics.map((diagnostic) => [diagnostic.externalId, diagnostic]));
  const childScopeIdsByParentId = new Map<string | null, string[]>();
  const entityIdsByScopeId = new Map<string | null, string[]>();
  const viewpointsById = new Map(viewpoints.map((viewpoint) => [viewpoint.id, viewpoint]));
  const entityIdsByArchitecturalRole = new Map<string, string[]>();
  const relationshipIdsByArchitecturalSemantic = new Map<string, string[]>();
  const inboundRelationshipIdsByEntityId = new Map<string, string[]>();
  const outboundRelationshipIdsByEntityId = new Map<string, string[]>();
  const diagnosticIdsByScopeId = new Map<string, string[]>();
  const diagnosticIdsByEntityId = new Map<string, string[]>();
  const scopePathById = new Map<string, string>();

  for (const scope of scopes) pushToMapArray(childScopeIdsByParentId, scope.parentScopeId, scope.externalId);
  for (const entity of entities) {
    pushToMapArray(entityIdsByScopeId, entity.scopeId, entity.externalId);
    for (const roleId of getArchitecturalRoles(entity)) pushToMapArray(entityIdsByArchitecturalRole, roleId, entity.externalId);
  }
  for (const relationship of relationships) {
    for (const semantic of getArchitecturalSemantics(relationship)) pushToMapArray(relationshipIdsByArchitecturalSemantic, semantic, relationship.externalId);
    pushToMapArray(outboundRelationshipIdsByEntityId, relationship.fromEntityId, relationship.externalId);
    pushToMapArray(inboundRelationshipIdsByEntityId, relationship.toEntityId, relationship.externalId);
  }
  for (const diagnostic of diagnostics) {
    if (diagnostic.scopeId) pushToMapArray(diagnosticIdsByScopeId, diagnostic.scopeId, diagnostic.externalId);
    if (diagnostic.entityId) pushToMapArray(diagnosticIdsByEntityId, diagnostic.entityId, diagnostic.externalId);
  }
  for (const scope of scopes) scopePathById.set(scope.externalId, buildScopePath(scope, scopesById));

  const index: BrowserSnapshotIndex = {
    snapshotId: payload.snapshot.id,
    builtAt: new Date().toISOString(),
    payload,
    viewpointsById,
    scopesById,
    entitiesById,
    relationshipsById,
    diagnosticsById,
    childScopeIdsByParentId,
    entityIdsByScopeId,
    entityIdsByArchitecturalRole,
    relationshipIdsByArchitecturalSemantic,
    subtreeEntityIdsByScopeId: new Map(),
    containingScopeIdsByEntityId: new Map(),
    containedEntityIdsByEntityId: new Map(),
    containerEntityIdsByEntityId: new Map(),
    inboundRelationshipIdsByEntityId,
    outboundRelationshipIdsByEntityId,
    diagnosticIdsByScopeId,
    diagnosticIdsByEntityId,
    scopePathById,
    descendantStatsByScopeId: new Map(),
    scopeNodesByParentId: new Map(),
    scopeTree: [],
    searchableDocuments: [],
  };

  for (const entity of entities) index.containingScopeIdsByEntityId.set(entity.externalId, buildContainingScopeIds(index, entity));
  for (const relationship of relationships) {
    if (relationship.kind === 'CONTAINS') {
      pushToMapArray(index.containedEntityIdsByEntityId, relationship.fromEntityId, relationship.toEntityId);
      pushToMapArray(index.containerEntityIdsByEntityId, relationship.toEntityId, relationship.fromEntityId);
    }
  }
  for (const [entityId, containedIds] of index.containedEntityIdsByEntityId.entries()) index.containedEntityIdsByEntityId.set(entityId, sortEntityIds(index, containedIds));
  for (const [entityId, containerIds] of index.containerEntityIdsByEntityId.entries()) index.containerEntityIdsByEntityId.set(entityId, sortEntityIds(index, containerIds));
  for (const scope of scopes) index.subtreeEntityIdsByScopeId.set(scope.externalId, collectSubtreeEntityIds(index, scope.externalId, index.subtreeEntityIdsByScopeId));

  index.scopeTree = buildScopeTree(index);
  index.searchableDocuments = buildSearchableDocuments(index);
  return index;
}

const browserSnapshotIndexCache = new WeakMap<FullSnapshotPayload, BrowserSnapshotIndex>();

export function getOrBuildBrowserSnapshotIndex(payload: FullSnapshotPayload) {
  const cached = browserSnapshotIndexCache.get(payload);
  if (cached) return cached;
  const built = buildBrowserSnapshotIndex(payload);
  browserSnapshotIndexCache.set(payload, built);
  return built;
}

export function clearBrowserSnapshotIndex(_snapshotId?: string) {
  // WeakMap entries are released together with their payload objects.
  // This function remains as a stable no-op API for tests and callers.
}
