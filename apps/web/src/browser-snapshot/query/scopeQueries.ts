import type { FullSnapshotDiagnostic, FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope } from '../../app-model';
import type { BrowserDependencyDirection, BrowserDependencyNeighborhood, BrowserEntityFacts, BrowserScopeFacts, BrowserScopeTreeNode, BrowserSnapshotIndex, BrowserTreeMode } from '../model';
import { collectDescendantStats } from './aggregates';
import { displayNameOf } from '../support/display';
import { collectSourceRefs } from '../support/sourceRefs';
import { matchesTreeModeScopeKind } from '../support/semantics';
import { sortEntityIds, sortScopeIds } from '../support/sort';

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

const NAVIGATION_TREE_ELIGIBLE_ENTITY_KINDS = new Set([
  'CLASS',
  'INTERFACE',
  'ENUM',
  'RECORD',
  'COMPONENT',
  'SERVICE',
  'REPOSITORY',
  'RESOURCE',
  'CONTROLLER',
  'ENDPOINT',
  'MODULE',
  'HOOK',
  'FUNCTION',
  'SYSTEM',
  'PERSISTENCE_ADAPTER',
]);

const NAVIGATION_TREE_ELIGIBLE_ARCHITECTURAL_ROLES = new Set([
  'api-entrypoint',
  'application-service',
  'persistence-access',
  'persistent-entity',
  'integration-adapter',
  'external-dependency',
  'module-boundary',
  'ui-layout',
  'ui-page',
  'ui-navigation-node',
]);

const NAVIGATION_TREE_SAFE_EXPANDABLE_CONTAINER_KINDS = new Set([
  'MODULE',
  'COMPONENT',
  'SYSTEM',
  'SERVICE',
]);

const NAVIGATION_TREE_MEMBER_LIKE_ENTITY_KINDS = new Set([
  'ATTRIBUTE',
  'CONSTRUCTOR',
  'FIELD',
  'FUNCTION',
  'HOOK',
  'METHOD',
  'PROPERTY',
]);

function getEntityArchitecturalRoles(entity: FullSnapshotEntity) {
  const roles = entity.metadata?.architecturalRoles;
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
    : [];
}

const NAVIGATION_TREE_SCOPE_DUPLICATE_ENTITY_KINDS = new Set([
  'DIRECTORY',
  'FILE',
  'MODULE',
  'PACKAGE',
]);

function normalizeStructuralContainerLabel(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/^[a-z-]+\s*:\s*/, '')
    .replace(/^(package|module|file|directory)\s+/, '')
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ');
}

function collectStructuralContainerCandidates(item: { kind: string; name: string; displayName: string | null }) {
  const rawValues = [displayNameOf(item), item.name]
    .map((value) => normalizeStructuralContainerLabel(value))
    .filter((value) => value.length > 0);

  const candidates = new Set(rawValues);
  for (const value of rawValues) {
    if (value.includes('/')) {
      const segments = value.split('/').filter(Boolean);
      const basename = segments[segments.length - 1];
      if (basename) candidates.add(basename);
    }
    if (value.includes('.')) {
      const segments = value.split('.').filter(Boolean);
      const tail = segments[segments.length - 1];
      if (tail) candidates.add(tail);
    }
  }

  return candidates;
}

function isScopeSemanticMirrorEntity(scope: FullSnapshotScope, entity: FullSnapshotEntity) {
  if (!NAVIGATION_TREE_SCOPE_DUPLICATE_ENTITY_KINDS.has(entity.kind)) return false;
  const scopeCandidates = collectStructuralContainerCandidates(scope);
  const entityCandidates = collectStructuralContainerCandidates(entity);
  for (const candidate of entityCandidates) {
    if (scopeCandidates.has(candidate)) return true;
  }
  return false;
}

function isScopeDuplicateEntityKind(scope: FullSnapshotScope, entity: FullSnapshotEntity) {
  if (NAVIGATION_TREE_SCOPE_DUPLICATE_ENTITY_KINDS.has(entity.kind) && entity.kind === scope.kind) return true;
  if (entity.kind === 'MODULE' && scope.kind === 'FILE') return true;
  if ((scope.kind === 'PACKAGE' || scope.kind === 'FILE' || scope.kind === 'DIRECTORY' || scope.kind === 'MODULE') && isScopeSemanticMirrorEntity(scope, entity)) return true;
  return false;
}

function isEntityUsefulForNavigationTree(scope: FullSnapshotScope, entity: FullSnapshotEntity) {
  if (isScopeDuplicateEntityKind(scope, entity)) return false;
  if (NAVIGATION_TREE_ELIGIBLE_ENTITY_KINDS.has(entity.kind)) return true;
  return getEntityArchitecturalRoles(entity).some((role) => NAVIGATION_TREE_ELIGIBLE_ARCHITECTURAL_ROLES.has(role));
}

function hasEligibleContainerAtTreeLevel(index: BrowserSnapshotIndex, scope: FullSnapshotScope, entity: FullSnapshotEntity) {
  const containerIds = index.containerEntityIdsByEntityId.get(entity.externalId) ?? [];
  return containerIds.some((containerId) => {
    const container = index.entitiesById.get(containerId);
    return Boolean(container && container.scopeId === scope.externalId && isEntityUsefulForNavigationTree(scope, container));
  });
}

export function isEntityEligibleForNavigationTree(index: BrowserSnapshotIndex, scopeId: string, entityId: string) {
  const scope = index.scopesById.get(scopeId);
  const entity = index.entitiesById.get(entityId);
  if (!scope || !entity || entity.scopeId !== scopeId) return false;
  if (!isEntityUsefulForNavigationTree(scope, entity)) return false;
  if (hasEligibleContainerAtTreeLevel(index, scope, entity)) return false;
  return true;
}

export function getEligibleDirectEntitiesForScope(index: BrowserSnapshotIndex, scopeId: string) {
  return getDirectEntitiesForScope(index, scopeId).filter((entity) => isEntityEligibleForNavigationTree(index, scopeId, entity.externalId));
}

function isEntitySafeContainerForNavigationTreeExpansion(entity: FullSnapshotEntity) {
  return NAVIGATION_TREE_SAFE_EXPANDABLE_CONTAINER_KINDS.has(entity.kind)
    || getEntityArchitecturalRoles(entity).some((role) => NAVIGATION_TREE_ELIGIBLE_ARCHITECTURAL_ROLES.has(role));
}

function isMemberLikeNavigationTreeEntity(entity: FullSnapshotEntity) {
  return NAVIGATION_TREE_MEMBER_LIKE_ENTITY_KINDS.has(entity.kind);
}

export function getExpandableNavigationChildrenForEntity(index: BrowserSnapshotIndex, entityId: string) {
  const entity = index.entitiesById.get(entityId);
  if (!entity || !entity.scopeId || !isEntitySafeContainerForNavigationTreeExpansion(entity)) return [];
  const scope = index.scopesById.get(entity.scopeId);
  if (!scope) return [];
  return getContainedEntitiesForEntity(index, entityId)
    .filter((child) => child.scopeId === entity.scopeId)
    .filter((child) => isEntityUsefulForNavigationTree(scope, child))
    .filter((child) => !isMemberLikeNavigationTreeEntity(child));
}

export function canExpandEntityInNavigationTree(index: BrowserSnapshotIndex, entityId: string) {
  return getExpandableNavigationChildrenForEntity(index, entityId).length > 0;
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
