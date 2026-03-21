import type { FullSnapshotDiagnostic, FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope } from './appModel';
import type { BrowserDependencyDirection, BrowserDependencyNeighborhood, BrowserEntityFacts, BrowserScopeFacts, BrowserScopeTreeNode, BrowserSnapshotIndex, BrowserTreeMode } from './browserSnapshotIndex.types';
import { collectDescendantStats } from './browserSnapshotIndex.aggregates';
import { displayNameOf } from './browserSnapshotIndex.display';
import { collectSourceRefs } from './browserSnapshotIndex.sourceRefs';
import { matchesTreeModeScopeKind } from './browserSnapshotIndex.semantics';
import { sortEntityIds, sortScopeIds } from './browserSnapshotIndex.sort';

export function getScopeTreeRoots(index: BrowserSnapshotIndex) {
  return index.scopeTree;
}

export function getScopeChildren(index: BrowserSnapshotIndex, parentScopeId: string | null) {
  return index.scopeNodesByParentId.get(parentScopeId) ?? [];
}

function collectTreeModeNodes(index: BrowserSnapshotIndex, parentScopeId: string | null, mode: BrowserTreeMode): BrowserScopeTreeNode[] {
  const children = getScopeChildren(index, parentScopeId);
  if (mode === 'advanced') return children;
  const collected: BrowserScopeTreeNode[] = [];
  for (const child of children) {
    if (matchesTreeModeScopeKind(child.kind, mode)) {
      collected.push(child);
      continue;
    }
    collected.push(...collectTreeModeNodes(index, child.scopeId, mode));
  }
  return collected;
}

export function getScopeTreeNodesForMode(index: BrowserSnapshotIndex, parentScopeId: string | null, mode: BrowserTreeMode) {
  return collectTreeModeNodes(index, parentScopeId, mode);
}

export function isScopeVisibleInTreeMode(index: BrowserSnapshotIndex, scopeId: string, mode: BrowserTreeMode) {
  if (mode === 'advanced') return index.scopesById.has(scopeId);
  const scope = index.scopesById.get(scopeId);
  if (!scope) return false;
  if (matchesTreeModeScopeKind(scope.kind, mode)) return true;
  return getScopeTreeNodesForMode(index, scopeId, mode).length > 0;
}

export function collectVisibleAncestorScopeIds(index: BrowserSnapshotIndex, scopeId: string | null, mode: BrowserTreeMode) {
  if (!scopeId || mode === 'advanced') return [] as string[];
  const visibleAncestors: string[] = [];
  const seen = new Set<string>();
  let current = index.scopesById.get(scopeId);
  while (current?.parentScopeId && !seen.has(current.parentScopeId)) {
    seen.add(current.parentScopeId);
    const parentScopeId = current.parentScopeId;
    if (matchesTreeModeScopeKind(index.scopesById.get(parentScopeId)?.kind ?? '', mode)) visibleAncestors.unshift(parentScopeId);
    current = index.scopesById.get(parentScopeId);
  }
  return visibleAncestors;
}

export function detectDefaultBrowserTreeMode(index: BrowserSnapshotIndex): BrowserTreeMode {
  const packageScopeCount = index.payload.scopes.filter((scope) => scope.kind === 'PACKAGE').length;
  const fileScopeCount = index.payload.scopes.filter((scope) => scope.kind === 'FILE').length;
  const directoryScopeCount = index.payload.scopes.filter((scope) => scope.kind === 'DIRECTORY').length;
  const javaFileCount = index.payload.scopes.filter((scope) => scope.kind === 'FILE' && /\.java$/i.test(scope.name || scope.displayName || '')).length;
  const detectedTechnologies = new Set((index.payload.run.detectedTechnologies ?? []).map((technology) => technology.toLocaleLowerCase()));
  if (packageScopeCount > 0 && (javaFileCount > 0 || detectedTechnologies.has('java') || packageScopeCount >= Math.max(3, Math.floor((fileScopeCount + directoryScopeCount) / 2)))) return 'package';
  return 'filesystem';
}

export function getDirectEntitiesForScope(index: BrowserSnapshotIndex, scopeId: string) {
  return sortEntityIds(index, index.entityIdsByScopeId.get(scopeId) ?? []).map((entityId) => index.entitiesById.get(entityId)).filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

export function getSubtreeEntitiesForScope(index: BrowserSnapshotIndex, scopeId: string) {
  return sortEntityIds(index, index.subtreeEntityIdsByScopeId.get(scopeId) ?? []).map((entityId) => index.entitiesById.get(entityId)).filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

export function getChildScopes(index: BrowserSnapshotIndex, scopeId: string | null) {
  return sortScopeIds(index, index.childScopeIdsByParentId.get(scopeId) ?? []).map((childScopeId) => index.scopesById.get(childScopeId)).filter((scope): scope is FullSnapshotScope => Boolean(scope));
}

export function getContainingScopesForEntity(index: BrowserSnapshotIndex, entityId: string) {
  return (index.containingScopeIdsByEntityId.get(entityId) ?? []).map((scopeId) => index.scopesById.get(scopeId)).filter((scope): scope is FullSnapshotScope => Boolean(scope));
}

export function getContainedEntitiesForEntity(index: BrowserSnapshotIndex, entityId: string) {
  return sortEntityIds(index, index.containedEntityIdsByEntityId.get(entityId) ?? []).map((containedEntityId) => index.entitiesById.get(containedEntityId)).filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

export function getContainingEntitiesForEntity(index: BrowserSnapshotIndex, entityId: string) {
  return sortEntityIds(index, index.containerEntityIdsByEntityId.get(entityId) ?? []).map((containerEntityId) => index.entitiesById.get(containerEntityId)).filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

function filterEntitiesByKinds(entities: FullSnapshotEntity[], kinds?: string[]) {
  if (!kinds || kinds.length === 0) return entities;
  const allowedKinds = new Set(kinds);
  return entities.filter((entity) => allowedKinds.has(entity.kind));
}

export function getDirectEntitiesForScopeByKind(index: BrowserSnapshotIndex, scopeId: string, kinds?: string[]) {
  return filterEntitiesByKinds(getDirectEntitiesForScope(index, scopeId), kinds);
}

export function getSubtreeEntitiesForScopeByKind(index: BrowserSnapshotIndex, scopeId: string, kinds?: string[]) {
  return filterEntitiesByKinds(getSubtreeEntitiesForScope(index, scopeId), kinds);
}

export function getPrimaryEntitiesForScope(index: BrowserSnapshotIndex, scopeId: string) {
  const scope = index.scopesById.get(scopeId);
  if (!scope) return [];
  if (scope.kind === 'FILE' || scope.kind === 'MODULE') return getDirectEntitiesForScopeByKind(index, scopeId, ['MODULE']);
  if (scope.kind === 'DIRECTORY') {
    const directFileChildScopeIds = getChildScopes(index, scopeId).filter((childScope) => childScope.kind === 'FILE').map((childScope) => childScope.externalId);
    const moduleEntityIds = directFileChildScopeIds.flatMap((fileScopeId) => (index.entityIdsByScopeId.get(fileScopeId) ?? []).filter((entityId) => index.entitiesById.get(entityId)?.kind === 'MODULE'));
    const directModuleEntityIds = (index.entityIdsByScopeId.get(scopeId) ?? []).filter((entityId) => index.entitiesById.get(entityId)?.kind === 'MODULE');
    return sortEntityIds(index, [...directModuleEntityIds, ...moduleEntityIds]).map((entityId) => index.entitiesById.get(entityId)).filter((entity): entity is FullSnapshotEntity => Boolean(entity));
  }
  if (scope.kind === 'PACKAGE') return getDirectEntitiesForScopeByKind(index, scopeId, ['PACKAGE']);
  const directModuleEntities = getDirectEntitiesForScopeByKind(index, scopeId, ['MODULE']);
  if (directModuleEntities.length > 0) return directModuleEntities;
  return getDirectEntitiesForScope(index, scopeId);
}

export function getScopeFacts(index: BrowserSnapshotIndex, scopeId: string): BrowserScopeFacts | null {
  const scope = index.scopesById.get(scopeId);
  if (!scope) return null;
  const childScopeIds = sortScopeIds(index, index.childScopeIdsByParentId.get(scopeId) ?? []);
  const entityIds = sortEntityIds(index, index.entityIdsByScopeId.get(scopeId) ?? []);
  const descendantStats = collectDescendantStats(index, scopeId);
  const diagnostics = (index.diagnosticIdsByScopeId.get(scopeId) ?? []).map((id) => index.diagnosticsById.get(id)).filter((item): item is FullSnapshotDiagnostic => Boolean(item));
  return { scope, path: index.scopePathById.get(scopeId) ?? displayNameOf(scope), childScopeIds, entityIds, descendantScopeCount: descendantStats.scopeCount, descendantEntityCount: descendantStats.entityCount, diagnostics, sourceRefs: collectSourceRefs(scope.sourceRefs) };
}

export function getEntityFacts(index: BrowserSnapshotIndex, entityId: string): BrowserEntityFacts | null {
  const entity = index.entitiesById.get(entityId);
  if (!entity) return null;
  const inboundRelationships = (index.inboundRelationshipIdsByEntityId.get(entityId) ?? []).map((id) => index.relationshipsById.get(id)).filter((item): item is FullSnapshotRelationship => Boolean(item));
  const outboundRelationships = (index.outboundRelationshipIdsByEntityId.get(entityId) ?? []).map((id) => index.relationshipsById.get(id)).filter((item): item is FullSnapshotRelationship => Boolean(item));
  const diagnostics = (index.diagnosticIdsByEntityId.get(entityId) ?? []).map((id) => index.diagnosticsById.get(id)).filter((item): item is FullSnapshotDiagnostic => Boolean(item));
  const scope = entity.scopeId ? index.scopesById.get(entity.scopeId) ?? null : null;
  return { entity, scope, path: entity.scopeId ? (index.scopePathById.get(entity.scopeId) ?? null) : null, inboundRelationships, outboundRelationships, diagnostics, sourceRefs: collectSourceRefs(entity.sourceRefs, ...inboundRelationships.map((it) => it.sourceRefs), ...outboundRelationships.map((it) => it.sourceRefs)) };
}

export function getDependencyNeighborhood(index: BrowserSnapshotIndex, entityId: string, direction: BrowserDependencyDirection = 'ALL'): BrowserDependencyNeighborhood | null {
  const focusEntity = index.entitiesById.get(entityId);
  if (!focusEntity) return null;
  const inboundRelationshipIds = index.inboundRelationshipIdsByEntityId.get(entityId) ?? [];
  const outboundRelationshipIds = index.outboundRelationshipIdsByEntityId.get(entityId) ?? [];
  const selectedRelationshipIds = [...(direction === 'ALL' || direction === 'INBOUND' ? inboundRelationshipIds : []), ...(direction === 'ALL' || direction === 'OUTBOUND' ? outboundRelationshipIds : [])];
  const uniqueRelationshipIds = [...new Set(selectedRelationshipIds)];
  const edges = uniqueRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)).filter((item): item is FullSnapshotRelationship => Boolean(item)).map((relationship) => ({ relationshipId: relationship.externalId, fromEntityId: relationship.fromEntityId, toEntityId: relationship.toEntityId, kind: relationship.kind, label: relationship.label }));
  const inboundEntityIds = sortEntityIds(index, inboundRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)?.fromEntityId).filter((item): item is string => Boolean(item)));
  const outboundEntityIds = sortEntityIds(index, outboundRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)?.toEntityId).filter((item): item is string => Boolean(item)));
  const relatedEntityIds = sortEntityIds(index, [...inboundEntityIds, ...outboundEntityIds]);
  return { focusEntity, inboundEntityIds, outboundEntityIds, relatedEntityIds, edges };
}
