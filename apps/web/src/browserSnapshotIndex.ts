import type {
  FullSnapshotDiagnostic,
  FullSnapshotEntity,
  FullSnapshotPayload,
  FullSnapshotRelationship,
  FullSnapshotScope,
  FullSnapshotViewpoint,
  SnapshotSourceRef,
} from "./appModel";
import { getAssociationKind, hasAssociationDisplayMetadata } from './browserRelationshipSemantics';

export type BrowserNodeKind = "scope" | "entity";
export type BrowserSearchResultKind = BrowserNodeKind | "relationship" | "diagnostic";
export type BrowserDependencyDirection = "ALL" | "INBOUND" | "OUTBOUND";
export type BrowserTreeMode = 'filesystem' | 'package' | 'advanced';
export type BrowserViewpointScopeMode = "selected-scope" | "selected-subtree" | "whole-snapshot";
export type BrowserViewpointVariant = 'default' | 'show-writers' | 'show-readers' | 'show-upstream-callers' | 'show-entity-relations';

export type BrowserScopeTreeNode = {
  scopeId: string;
  parentScopeId: string | null;
  name: string;
  displayName: string;
  kind: string;
  depth: number;
  path: string;
  childScopeIds: string[];
  directEntityIds: string[];
  descendantScopeCount: number;
  descendantEntityCount: number;
};

export type BrowserSearchResult = {
  kind: BrowserSearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  scopeId: string | null;
  score: number;
};

export type BrowserDependencyEdge = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  kind: string;
  label: string | null;
};

export type BrowserDependencyNeighborhood = {
  focusEntity: FullSnapshotEntity;
  inboundEntityIds: string[];
  outboundEntityIds: string[];
  relatedEntityIds: string[];
  edges: BrowserDependencyEdge[];
};


export type BrowserResolvedViewpointGraph = {
  viewpoint: FullSnapshotViewpoint;
  scopeMode: BrowserViewpointScopeMode;
  selectedScopeId: string | null;
  seedEntityIds: string[];
  entityIds: string[];
  relationshipIds: string[];
  preferredDependencyViews: string[];
  recommendedLayout: 'generic' | 'request-flow' | 'api-surface' | 'persistence-model' | 'integration-map' | 'module-dependencies' | 'ui-navigation' | 'persistence-writers' | 'persistence-readers' | 'upstream-callers';
  variant?: BrowserViewpointVariant;
};

export type BrowserScopeFacts = {
  scope: FullSnapshotScope;
  path: string;
  childScopeIds: string[];
  entityIds: string[];
  descendantScopeCount: number;
  descendantEntityCount: number;
  diagnostics: FullSnapshotDiagnostic[];
  sourceRefs: SnapshotSourceRef[];
};

export type BrowserEntityFacts = {
  entity: FullSnapshotEntity;
  scope: FullSnapshotScope | null;
  path: string | null;
  inboundRelationships: FullSnapshotRelationship[];
  outboundRelationships: FullSnapshotRelationship[];
  diagnostics: FullSnapshotDiagnostic[];
  sourceRefs: SnapshotSourceRef[];
};

export type BrowserSnapshotIndex = {
  snapshotId: string;
  builtAt: string;
  payload: FullSnapshotPayload;
  viewpointsById: Map<string, FullSnapshotViewpoint>;
  entityIdsByArchitecturalRole: Map<string, string[]>;
  relationshipIdsByArchitecturalSemantic: Map<string, string[]>;
  scopesById: Map<string, FullSnapshotScope>;
  entitiesById: Map<string, FullSnapshotEntity>;
  relationshipsById: Map<string, FullSnapshotRelationship>;
  diagnosticsById: Map<string, FullSnapshotDiagnostic>;
  childScopeIdsByParentId: Map<string | null, string[]>;
  entityIdsByScopeId: Map<string | null, string[]>;
  subtreeEntityIdsByScopeId: Map<string, string[]>;
  containingScopeIdsByEntityId: Map<string, string[]>;
  containedEntityIdsByEntityId: Map<string, string[]>;
  containerEntityIdsByEntityId: Map<string, string[]>;
  inboundRelationshipIdsByEntityId: Map<string, string[]>;
  outboundRelationshipIdsByEntityId: Map<string, string[]>;
  diagnosticIdsByScopeId: Map<string, string[]>;
  diagnosticIdsByEntityId: Map<string, string[]>;
  scopePathById: Map<string, string>;
  descendantStatsByScopeId: Map<string, { scopeCount: number; entityCount: number }>;
  scopeNodesByParentId: Map<string | null, BrowserScopeTreeNode[]>;
  scopeTree: BrowserScopeTreeNode[];
  searchableDocuments: BrowserSearchDocument[];
};

type BrowserSearchDocument = {
  kind: BrowserSearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  scopeId: string | null;
  normalizedText: string;
};

function pushToMapArray<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const current = map.get(key);
  if (current) {
    current.push(value);
    return;
  }
  map.set(key, [value]);
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase();
}

function displayNameOf(item: { displayName: string | null; name: string }) {
  return item.displayName?.trim() || item.name;
}

function compactScopeDisplayName(scope: FullSnapshotScope) {
  const raw = displayNameOf(scope);
  if ((scope.kind === "FILE" || scope.kind === "DIRECTORY") && raw.includes("/")) {
    const segments = raw.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? raw;
  }
  return raw;
}

function compareByDisplayName(a: { displayName: string | null; name: string }, b: { displayName: string | null; name: string }) {
  return displayNameOf(a).localeCompare(displayNameOf(b), undefined, { sensitivity: "base" });
}

const scopeKindOrder = new Map<string, number>([
  ["REPOSITORY", 10],
  ["MODULE", 20],
  ["PACKAGE", 30],
  ["NAMESPACE", 40],
  ["DIRECTORY", 50],
  ["FILE", 60],
]);

function compareScopeIds(index: BrowserSnapshotIndex, leftScopeId: string, rightScopeId: string) {
  const left = index.scopesById.get(leftScopeId);
  const right = index.scopesById.get(rightScopeId);
  if (!left || !right) {
    return leftScopeId.localeCompare(rightScopeId);
  }
  const leftOrder = scopeKindOrder.get(left.kind) ?? 999;
  const rightOrder = scopeKindOrder.get(right.kind) ?? 999;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }
  return compactScopeDisplayName(left).localeCompare(compactScopeDisplayName(right), undefined, { sensitivity: "base" });
}

function getArchitecturalRoles(entity: FullSnapshotEntity) {
  const entityWithTopLevelRoles = entity as FullSnapshotEntity & { architecturalRoles?: unknown };
  const roles = Array.isArray(entityWithTopLevelRoles.architecturalRoles)
    ? entityWithTopLevelRoles.architecturalRoles
    : entity.metadata?.architecturalRoles;
  return Array.isArray(roles)
    ? roles.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
}

function getArchitecturalSemantics(relationship: FullSnapshotRelationship) {
  const semantics = relationship.metadata?.architecturalSemantics;
  return Array.isArray(semantics) ? semantics.filter((value): value is string => typeof value === "string" && value.trim().length > 0) : [];
}

function compareEntityIds(index: BrowserSnapshotIndex, leftEntityId: string, rightEntityId: string) {
  const left = index.entitiesById.get(leftEntityId);
  const right = index.entitiesById.get(rightEntityId);
  if (!left || !right) {
    return leftEntityId.localeCompare(rightEntityId);
  }
  return compareByDisplayName(left, right);
}

function sortScopeIds(index: BrowserSnapshotIndex, scopeIds: Iterable<string>) {
  return [...new Set(scopeIds)].sort((a, b) => compareScopeIds(index, a, b));
}

function sortEntityIds(index: BrowserSnapshotIndex, entityIds: Iterable<string>) {
  return [...new Set(entityIds)].sort((a, b) => compareEntityIds(index, a, b));
}

function getRequestHandlingRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('api-entrypoint')) {
    return 0;
  }
  if (roles.has('application-service')) {
    return 1;
  }
  if (roles.has('persistence-access') || roles.has('persistent-entity')) {
    return 2;
  }
  if (roles.has('integration-adapter') || roles.has('external-dependency')) {
    return 3;
  }
  return 4;
}


function getPersistenceModelRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('application-service') || roles.has('api-entrypoint')) {
    return 0;
  }
  if (roles.has('persistence-access')) {
    return 1;
  }
  if (roles.has('persistent-entity')) {
    return 2;
  }
  if (roles.has('datastore')) {
    return 3;
  }
  return 4;
}

function getIntegrationMapRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('api-entrypoint') || roles.has('application-service')) {
    return 0;
  }
  if (roles.has('integration-adapter')) {
    return 1;
  }
  if (roles.has('external-dependency')) {
    return 2;
  }
  return 3;
}

function getModuleDependenciesRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('module-boundary')) {
    return 0;
  }
  if (entity.kind === 'MODULE' || entity.kind === 'PACKAGE') {
    return 1;
  }
  return 2;
}


function getUiNavigationRolePriority(entity: FullSnapshotEntity) {
  const roles = new Set(getArchitecturalRoles(entity));
  if (roles.has('ui-layout')) {
    return 0;
  }
  if (roles.has('ui-page')) {
    return 1;
  }
  if (roles.has('ui-navigation-node')) {
    return 2;
  }
  return 3;
}


function computeRelationshipDistances(seedEntityIds: string[], relationships: FullSnapshotRelationship[]) {
  const adjacency = new Map<string, Set<string>>();
  for (const relationship of relationships) {
    if (!adjacency.has(relationship.fromEntityId)) {
      adjacency.set(relationship.fromEntityId, new Set());
    }
    if (!adjacency.has(relationship.toEntityId)) {
      adjacency.set(relationship.toEntityId, new Set());
    }
    adjacency.get(relationship.fromEntityId)?.add(relationship.toEntityId);
    adjacency.get(relationship.toEntityId)?.add(relationship.fromEntityId);
  }
  const distances = new Map<string, number>();
  const queue = [...seedEntityIds];
  for (const entityId of seedEntityIds) {
    distances.set(entityId, 0);
  }
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const baseDistance = distances.get(current) ?? 0;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (distances.has(neighbor)) {
        continue;
      }
      distances.set(neighbor, baseDistance + 1);
      queue.push(neighbor);
    }
  }
  return distances;
}

function sortViewpointEntityIds(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, entityIds: Iterable<string>, relationships: FullSnapshotRelationship[]) {
  const uniqueEntityIds = [...new Set(entityIds)];
  if (viewpoint.id !== 'request-handling' && viewpoint.id !== 'api-surface' && viewpoint.id !== 'persistence-model' && viewpoint.id !== 'integration-map' && viewpoint.id !== 'module-dependencies' && viewpoint.id !== 'ui-navigation') {
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
    if (!left || !right) {
      return leftId.localeCompare(rightId);
    }
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
      if (distanceDelta !== 0) {
        return distanceDelta;
      }
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
    } else if (priorityDelta !== 0) {
      return priorityDelta;
    }
    if (viewpoint.id !== 'persistence-model' && distanceDelta !== 0) {
      return distanceDelta;
    }
    if (viewpoint.id === 'persistence-model' && distanceDelta !== 0) {
      return distanceDelta;
    }
    if (distanceDelta !== 0) {
      return distanceDelta;
    }
    const scopePathDelta = (index.scopePathById.get(left.scopeId ?? '') ?? '').localeCompare(index.scopePathById.get(right.scopeId ?? '') ?? '', undefined, { sensitivity: 'base' });
    if (scopePathDelta !== 0) {
      return scopePathDelta;
    }
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
  if (viewpoint.id === 'module-dependencies') {
    if (firstSemantic === 'depends-on-module') return 0;
  }
  return 100;
}

function sortViewpointRelationshipIds(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, relationships: FullSnapshotRelationship[]) {
  if (viewpoint.id !== 'request-handling' && viewpoint.id !== 'api-surface' && viewpoint.id !== 'persistence-model' && viewpoint.id !== 'integration-map' && viewpoint.id !== 'module-dependencies' && viewpoint.id !== 'ui-navigation') {
    return stableSortRelationships(relationships).map((relationship) => relationship.externalId);
  }
  const sorted = [...relationships].sort((left, right) => {
    const leftFrom = index.entitiesById.get(left.fromEntityId);
    const rightFrom = index.entitiesById.get(right.fromEntityId);
    const leftTo = index.entitiesById.get(left.toEntityId);
    const rightTo = index.entitiesById.get(right.toEntityId);
    const semanticPriorityDelta = getViewpointRelationshipSemanticPriority(viewpoint, left) - getViewpointRelationshipSemanticPriority(viewpoint, right);
    if (semanticPriorityDelta !== 0) {
      return semanticPriorityDelta;
    }
    const getPriority = viewpoint.id === 'api-surface' ? getApiSurfaceRolePriority : viewpoint.id === 'persistence-model' ? getPersistenceModelRolePriority : viewpoint.id === 'integration-map' ? getIntegrationMapRolePriority : viewpoint.id === 'module-dependencies' ? getModuleDependenciesRolePriority : viewpoint.id === 'ui-navigation' ? getUiNavigationRolePriority : getRequestHandlingRolePriority;
    const fromPriorityDelta = getPriority(leftFrom ?? {metadata:{},displayName:null,name:left.fromEntityId} as FullSnapshotEntity) - getPriority(rightFrom ?? {metadata:{},displayName:null,name:right.fromEntityId} as FullSnapshotEntity);
    if (fromPriorityDelta !== 0) {
      return fromPriorityDelta;
    }
    const toPriorityDelta = getPriority(leftTo ?? {metadata:{},displayName:null,name:left.toEntityId} as FullSnapshotEntity) - getPriority(rightTo ?? {metadata:{},displayName:null,name:right.toEntityId} as FullSnapshotEntity);
    if (toPriorityDelta !== 0) {
      return toPriorityDelta;
    }
    const labelDelta = (left.label ?? left.kind).localeCompare((right.label ?? right.kind), undefined, { sensitivity: 'base' });
    if (labelDelta !== 0) {
      return labelDelta;
    }
    return left.externalId.localeCompare(right.externalId);
  });
  return sorted.map((relationship) => relationship.externalId);
}

function buildScopePath(scope: FullSnapshotScope, scopesById: Map<string, FullSnapshotScope>) {
  const segments: string[] = [];
  const seen = new Set<string>();
  let current: FullSnapshotScope | undefined = scope;
  while (current && !seen.has(current.externalId)) {
    seen.add(current.externalId);
    segments.unshift(compactScopeDisplayName(current));
    current = current.parentScopeId ? scopesById.get(current.parentScopeId) : undefined;
  }
  return segments.join(" / ");
}

function collectDescendantStats(index: BrowserSnapshotIndex, scopeId: string): { scopeCount: number; entityCount: number } {
  const cached = index.descendantStatsByScopeId.get(scopeId);
  if (cached) {
    return cached;
  }
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

function collectSubtreeEntityIds(index: BrowserSnapshotIndex, scopeId: string, cache: Map<string, string[]>) {
  const cached = cache.get(scopeId);
  if (cached) {
    return cached;
  }
  const directEntityIds = index.entityIdsByScopeId.get(scopeId) ?? [];
  const childScopeIds = index.childScopeIdsByParentId.get(scopeId) ?? [];
  const entityIds = [...directEntityIds];
  for (const childScopeId of childScopeIds) {
    entityIds.push(...collectSubtreeEntityIds(index, childScopeId, cache));
  }
  const sorted = sortEntityIds(index, entityIds);
  cache.set(scopeId, sorted);
  return sorted;
}

function buildContainingScopeIds(index: BrowserSnapshotIndex, entity: FullSnapshotEntity) {
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

function buildScopeTree(index: BrowserSnapshotIndex, parentScopeId: string | null = null, depth = 0): BrowserScopeTreeNode[] {
  const cached = index.scopeNodesByParentId.get(parentScopeId);
  if (cached) {
    return cached;
  }
  const scopeIds = sortScopeIds(index, index.childScopeIdsByParentId.get(parentScopeId) ?? []);
  const nodes = scopeIds.map((scopeId) => {
    const scope = index.scopesById.get(scopeId);
    if (!scope) {
      throw new Error(`Missing scope '${scopeId}' while building scope tree.`);
    }
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
  for (const node of nodes) {
    buildScopeTree(index, node.scopeId, depth + 1);
  }
  return nodes;
}

function collectSourceRefs(...collections: Array<SnapshotSourceRef[] | undefined>) {
  const all = collections.flatMap((items) => items ?? []);
  const seen = new Set<string>();
  const unique: SnapshotSourceRef[] = [];
  for (const item of all) {
    const key = JSON.stringify(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function isEntityWithinScopeMode(index: BrowserSnapshotIndex, entityId: string, scopeMode: BrowserViewpointScopeMode, selectedScopeId: string | null) {
  if (scopeMode === "whole-snapshot") {
    return true;
  }
  const entity = index.entitiesById.get(entityId);
  if (!entity?.scopeId || !selectedScopeId) {
    return false;
  }
  if (scopeMode === "selected-scope") {
    return entity.scopeId === selectedScopeId;
  }
  return isScopeWithin(index, selectedScopeId, entity.scopeId);
}
function getApiSurfaceRolePriority(entity: FullSnapshotEntity) {
  const roles = getArchitecturalRoles(entity);
  if (roles.includes('api-entrypoint')) {
    return 0;
  }
  if (roles.includes('application-service')) {
    return 1;
  }
  if (roles.includes('integration-adapter') || roles.includes('external-dependency')) {
    return 2;
  }
  if (roles.includes('persistence-access') || roles.includes('persistent-entity')) {
    return 3;
  }
  return 4;
}


function stableSortRelationships(relationships: FullSnapshotRelationship[]) {
  return [...relationships].sort((left, right) => left.externalId.localeCompare(right.externalId, undefined, { sensitivity: "base" }));
}

function isScopeWithin(index: BrowserSnapshotIndex, scopeId: string | null, candidateScopeId: string | null | undefined) {
  if (!scopeId) {
    return true;
  }
  if (!candidateScopeId) {
    return false;
  }
  if (scopeId === candidateScopeId) {
    return true;
  }
  const seen = new Set<string>();
  let current = index.scopesById.get(candidateScopeId);
  while (current?.parentScopeId && !seen.has(current.externalId)) {
    seen.add(current.externalId);
    if (current.parentScopeId === scopeId) {
      return true;
    }
    current = index.scopesById.get(current.parentScopeId);
  }
  return false;
}

function createSearchDocument(kind: BrowserSearchResultKind, id: string, title: string, subtitle: string, scopeId: string | null, searchParts: Array<string | null | undefined>): BrowserSearchDocument {
  return {
    kind,
    id,
    title,
    subtitle,
    scopeId,
    normalizedText: normalizeSearchText(searchParts.join(" ")),
  };
}

function buildSearchableDocuments(index: BrowserSnapshotIndex) {
  const scopeDocuments = index.payload.scopes.map((scope) => createSearchDocument(
    "scope",
    scope.externalId,
    displayNameOf(scope),
    index.scopePathById.get(scope.externalId) ?? scope.kind,
    scope.externalId,
    [scope.externalId, scope.kind, scope.name, scope.displayName, index.scopePathById.get(scope.externalId)],
  ));

  const entityDocuments = index.payload.entities.map((entity) => {
    const relatedRelationshipIds = [
      ...(index.inboundRelationshipIdsByEntityId.get(entity.externalId) ?? []),
      ...(index.outboundRelationshipIdsByEntityId.get(entity.externalId) ?? []),
    ];
    const relatedTerms = relatedRelationshipIds.flatMap((relationshipId) => {
      const relationship = index.relationshipsById.get(relationshipId);
      if (!relationship) {
        return [];
      }
      const fromEntity = index.entitiesById.get(relationship.fromEntityId);
      const toEntity = index.entitiesById.get(relationship.toEntityId);
      return [
        relationship.kind,
        relationship.label,
        relationship.externalId,
        fromEntity?.name,
        fromEntity?.displayName,
        toEntity?.name,
        toEntity?.displayName,
      ];
    });
    return createSearchDocument(
      "entity",
      entity.externalId,
      displayNameOf(entity),
      [entity.kind, entity.scopeId ? index.scopePathById.get(entity.scopeId) : null].filter(Boolean).join(" • "),
      entity.scopeId,
      [entity.externalId, entity.kind, entity.origin, entity.name, entity.displayName, entity.scopeId ? index.scopePathById.get(entity.scopeId) : null, ...relatedTerms],
    );
  });

  const relationshipDocuments = index.payload.relationships.map((relationship) => {
    const fromEntity = index.entitiesById.get(relationship.fromEntityId);
    const toEntity = index.entitiesById.get(relationship.toEntityId);
    const scopeId = fromEntity?.scopeId ?? toEntity?.scopeId ?? null;
    return createSearchDocument(
      "relationship",
      relationship.externalId,
      relationship.label?.trim() || relationship.kind,
      [displayNameOf(fromEntity ?? { name: relationship.fromEntityId, displayName: null }), "→", displayNameOf(toEntity ?? { name: relationship.toEntityId, displayName: null })].join(" "),
      scopeId,
      [
        relationship.externalId,
        relationship.kind,
        relationship.label,
        fromEntity?.name,
        fromEntity?.displayName,
        toEntity?.name,
        toEntity?.displayName,
      ],
    );
  });

  const diagnosticDocuments = index.payload.diagnostics.map((diagnostic) => createSearchDocument(
    "diagnostic",
    diagnostic.externalId,
    `${diagnostic.severity}: ${diagnostic.code}`,
    diagnostic.message,
    diagnostic.scopeId ?? index.entitiesById.get(diagnostic.entityId ?? "")?.scopeId ?? null,
    [diagnostic.externalId, diagnostic.severity, diagnostic.phase, diagnostic.code, diagnostic.message, diagnostic.filePath],
  ));

  return [...scopeDocuments, ...entityDocuments, ...relationshipDocuments, ...diagnosticDocuments];
}

export function buildBrowserSnapshotIndex(payload: FullSnapshotPayload): BrowserSnapshotIndex;
export function buildBrowserSnapshotIndex(_snapshotSummary: unknown, payload: FullSnapshotPayload): BrowserSnapshotIndex;
export function buildBrowserSnapshotIndex(payloadOrSummary: unknown, maybePayload?: FullSnapshotPayload): BrowserSnapshotIndex {
  const payload = (maybePayload ?? payloadOrSummary) as FullSnapshotPayload;
  const scopesById = new Map(payload.scopes.map((scope) => [scope.externalId, scope]));
  const entitiesById = new Map(payload.entities.map((entity) => [entity.externalId, entity]));
  const relationshipsById = new Map(payload.relationships.map((relationship) => [relationship.externalId, relationship]));
  const diagnosticsById = new Map(payload.diagnostics.map((diagnostic) => [diagnostic.externalId, diagnostic]));
  const childScopeIdsByParentId = new Map<string | null, string[]>();
  const entityIdsByScopeId = new Map<string | null, string[]>();
  const viewpointsById = new Map(payload.viewpoints.map((viewpoint) => [viewpoint.id, viewpoint]));
  const entityIdsByArchitecturalRole = new Map<string, string[]>();
  const relationshipIdsByArchitecturalSemantic = new Map<string, string[]>();
  const inboundRelationshipIdsByEntityId = new Map<string, string[]>();
  const outboundRelationshipIdsByEntityId = new Map<string, string[]>();
  const diagnosticIdsByScopeId = new Map<string, string[]>();
  const diagnosticIdsByEntityId = new Map<string, string[]>();
  const scopePathById = new Map<string, string>();

  for (const scope of payload.scopes) {
    pushToMapArray(childScopeIdsByParentId, scope.parentScopeId, scope.externalId);
  }

  for (const entity of payload.entities) {
    pushToMapArray(entityIdsByScopeId, entity.scopeId, entity.externalId);
    for (const roleId of getArchitecturalRoles(entity)) {
      pushToMapArray(entityIdsByArchitecturalRole, roleId, entity.externalId);
    }
  }

  for (const relationship of payload.relationships) {
    for (const semantic of getArchitecturalSemantics(relationship)) {
      pushToMapArray(relationshipIdsByArchitecturalSemantic, semantic, relationship.externalId);
    }
    pushToMapArray(outboundRelationshipIdsByEntityId, relationship.fromEntityId, relationship.externalId);
    pushToMapArray(inboundRelationshipIdsByEntityId, relationship.toEntityId, relationship.externalId);
  }

  for (const diagnostic of payload.diagnostics) {
    if (diagnostic.scopeId) {
      pushToMapArray(diagnosticIdsByScopeId, diagnostic.scopeId, diagnostic.externalId);
    }
    if (diagnostic.entityId) {
      pushToMapArray(diagnosticIdsByEntityId, diagnostic.entityId, diagnostic.externalId);
    }
  }

  for (const scope of payload.scopes) {
    scopePathById.set(scope.externalId, buildScopePath(scope, scopesById));
  }

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

  for (const entity of payload.entities) {
    index.containingScopeIdsByEntityId.set(entity.externalId, buildContainingScopeIds(index, entity));
  }

  for (const relationship of payload.relationships) {
    if (relationship.kind === "CONTAINS") {
      pushToMapArray(index.containedEntityIdsByEntityId, relationship.fromEntityId, relationship.toEntityId);
      pushToMapArray(index.containerEntityIdsByEntityId, relationship.toEntityId, relationship.fromEntityId);
    }
  }

  for (const [entityId, containedIds] of index.containedEntityIdsByEntityId.entries()) {
    index.containedEntityIdsByEntityId.set(entityId, sortEntityIds(index, containedIds));
  }

  for (const [entityId, containerIds] of index.containerEntityIdsByEntityId.entries()) {
    index.containerEntityIdsByEntityId.set(entityId, sortEntityIds(index, containerIds));
  }

  for (const scope of payload.scopes) {
    index.subtreeEntityIdsByScopeId.set(scope.externalId, collectSubtreeEntityIds(index, scope.externalId, index.subtreeEntityIdsByScopeId));
  }

  index.scopeTree = buildScopeTree(index);
  index.searchableDocuments = buildSearchableDocuments(index);
  return index;
}

const browserSnapshotIndexCache = new WeakMap<FullSnapshotPayload, BrowserSnapshotIndex>();

export function getOrBuildBrowserSnapshotIndex(payload: FullSnapshotPayload) {
  const cached = browserSnapshotIndexCache.get(payload);
  if (cached) {
    return cached;
  }
  const built = buildBrowserSnapshotIndex(payload);
  browserSnapshotIndexCache.set(payload, built);
  return built;
}

export function clearBrowserSnapshotIndex(_snapshotId?: string) {
  // WeakMap entries are released together with their payload objects.
  // This function remains as a stable no-op API for tests and callers.
}

export function getScopeTreeRoots(index: BrowserSnapshotIndex) {
  return index.scopeTree;
}

export function getScopeChildren(index: BrowserSnapshotIndex, parentScopeId: string | null) {
  return index.scopeNodesByParentId.get(parentScopeId) ?? [];
}

const browserTreeModeKinds: Record<Exclude<BrowserTreeMode, 'advanced'>, Set<string>> = {
  filesystem: new Set(['DIRECTORY', 'FILE']),
  package: new Set(['PACKAGE']),
};

function matchesTreeModeScopeKind(kind: string, mode: BrowserTreeMode) {
  if (mode === 'advanced') {
    return true;
  }
  return browserTreeModeKinds[mode].has(kind);
}

function collectTreeModeNodes(index: BrowserSnapshotIndex, parentScopeId: string | null, mode: BrowserTreeMode): BrowserScopeTreeNode[] {
  const children = getScopeChildren(index, parentScopeId);
  if (mode === 'advanced') {
    return children;
  }

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
  if (mode === 'advanced') {
    return index.scopesById.has(scopeId);
  }
  const scope = index.scopesById.get(scopeId);
  if (!scope) {
    return false;
  }
  if (matchesTreeModeScopeKind(scope.kind, mode)) {
    return true;
  }
  return getScopeTreeNodesForMode(index, scopeId, mode).length > 0;
}

export function collectVisibleAncestorScopeIds(index: BrowserSnapshotIndex, scopeId: string | null, mode: BrowserTreeMode) {
  if (!scopeId || mode === 'advanced') {
    return [] as string[];
  }
  const visibleAncestors: string[] = [];
  const seen = new Set<string>();
  let current = index.scopesById.get(scopeId);
  while (current?.parentScopeId && !seen.has(current.parentScopeId)) {
    seen.add(current.parentScopeId);
    const parentScopeId = current.parentScopeId;
    if (matchesTreeModeScopeKind(index.scopesById.get(parentScopeId)?.kind ?? '', mode)) {
      visibleAncestors.unshift(parentScopeId);
    }
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

  if (packageScopeCount > 0 && (javaFileCount > 0 || detectedTechnologies.has('java') || packageScopeCount >= Math.max(3, Math.floor((fileScopeCount + directoryScopeCount) / 2)))) {
    return 'package';
  }
  return 'filesystem';
}

export function getDirectEntitiesForScope(index: BrowserSnapshotIndex, scopeId: string) {
  return sortEntityIds(index, index.entityIdsByScopeId.get(scopeId) ?? [])
    .map((entityId) => index.entitiesById.get(entityId))
    .filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

export function getSubtreeEntitiesForScope(index: BrowserSnapshotIndex, scopeId: string) {
  return sortEntityIds(index, index.subtreeEntityIdsByScopeId.get(scopeId) ?? [])
    .map((entityId) => index.entitiesById.get(entityId))
    .filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

export function getChildScopes(index: BrowserSnapshotIndex, scopeId: string | null) {
  return sortScopeIds(index, index.childScopeIdsByParentId.get(scopeId) ?? [])
    .map((childScopeId) => index.scopesById.get(childScopeId))
    .filter((scope): scope is FullSnapshotScope => Boolean(scope));
}

export function getContainingScopesForEntity(index: BrowserSnapshotIndex, entityId: string) {
  return (index.containingScopeIdsByEntityId.get(entityId) ?? [])
    .map((scopeId) => index.scopesById.get(scopeId))
    .filter((scope): scope is FullSnapshotScope => Boolean(scope));
}

export function getContainedEntitiesForEntity(index: BrowserSnapshotIndex, entityId: string) {
  return sortEntityIds(index, index.containedEntityIdsByEntityId.get(entityId) ?? [])
    .map((containedEntityId) => index.entitiesById.get(containedEntityId))
    .filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

export function getContainingEntitiesForEntity(index: BrowserSnapshotIndex, entityId: string) {
  return sortEntityIds(index, index.containerEntityIdsByEntityId.get(entityId) ?? [])
    .map((containerEntityId) => index.entitiesById.get(containerEntityId))
    .filter((entity): entity is FullSnapshotEntity => Boolean(entity));
}

function filterEntitiesByKinds(entities: FullSnapshotEntity[], kinds?: string[]) {
  if (!kinds || kinds.length === 0) {
    return entities;
  }
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
  if (!scope) {
    return [];
  }

  // Centralized scope-to-entity resolution policy for the Browser UX.
  if (scope.kind === "FILE" || scope.kind === "MODULE") {
    return getDirectEntitiesForScopeByKind(index, scopeId, ["MODULE"]);
  }

  if (scope.kind === "DIRECTORY") {
    const directFileChildScopeIds = getChildScopes(index, scopeId)
      .filter((childScope) => childScope.kind === "FILE")
      .map((childScope) => childScope.externalId);
    const moduleEntityIds = directFileChildScopeIds.flatMap((fileScopeId) => (index.entityIdsByScopeId.get(fileScopeId) ?? []).filter((entityId) => index.entitiesById.get(entityId)?.kind === "MODULE"));
    const directModuleEntityIds = (index.entityIdsByScopeId.get(scopeId) ?? []).filter((entityId) => index.entitiesById.get(entityId)?.kind === "MODULE");
    return sortEntityIds(index, [...directModuleEntityIds, ...moduleEntityIds])
      .map((entityId) => index.entitiesById.get(entityId))
      .filter((entity): entity is FullSnapshotEntity => Boolean(entity));
  }

  if (scope.kind === "PACKAGE") {
    return getDirectEntitiesForScopeByKind(index, scopeId, ["PACKAGE"]);
  }

  const directModuleEntities = getDirectEntitiesForScopeByKind(index, scopeId, ["MODULE"]);
  if (directModuleEntities.length > 0) {
    return directModuleEntities;
  }

  return getDirectEntitiesForScope(index, scopeId);
}

export function getScopeFacts(index: BrowserSnapshotIndex, scopeId: string): BrowserScopeFacts | null {
  const scope = index.scopesById.get(scopeId);
  if (!scope) {
    return null;
  }
  const childScopeIds = sortScopeIds(index, index.childScopeIdsByParentId.get(scopeId) ?? []);
  const entityIds = sortEntityIds(index, index.entityIdsByScopeId.get(scopeId) ?? []);
  const descendantStats = collectDescendantStats(index, scopeId);
  const diagnostics = (index.diagnosticIdsByScopeId.get(scopeId) ?? [])
    .map((id) => index.diagnosticsById.get(id))
    .filter((item): item is FullSnapshotDiagnostic => Boolean(item));
  return {
    scope,
    path: index.scopePathById.get(scopeId) ?? displayNameOf(scope),
    childScopeIds,
    entityIds,
    descendantScopeCount: descendantStats.scopeCount,
    descendantEntityCount: descendantStats.entityCount,
    diagnostics,
    sourceRefs: collectSourceRefs(scope.sourceRefs),
  };
}

export function getEntityFacts(index: BrowserSnapshotIndex, entityId: string): BrowserEntityFacts | null {
  const entity = index.entitiesById.get(entityId);
  if (!entity) {
    return null;
  }
  const inboundRelationships = (index.inboundRelationshipIdsByEntityId.get(entityId) ?? [])
    .map((id) => index.relationshipsById.get(id))
    .filter((item): item is FullSnapshotRelationship => Boolean(item));
  const outboundRelationships = (index.outboundRelationshipIdsByEntityId.get(entityId) ?? [])
    .map((id) => index.relationshipsById.get(id))
    .filter((item): item is FullSnapshotRelationship => Boolean(item));
  const diagnostics = (index.diagnosticIdsByEntityId.get(entityId) ?? [])
    .map((id) => index.diagnosticsById.get(id))
    .filter((item): item is FullSnapshotDiagnostic => Boolean(item));
  const scope = entity.scopeId ? index.scopesById.get(entity.scopeId) ?? null : null;
  return {
    entity,
    scope,
    path: entity.scopeId ? (index.scopePathById.get(entity.scopeId) ?? null) : null,
    inboundRelationships,
    outboundRelationships,
    diagnostics,
    sourceRefs: collectSourceRefs(entity.sourceRefs, ...inboundRelationships.map((it) => it.sourceRefs), ...outboundRelationships.map((it) => it.sourceRefs)),
  };
}

export function getDependencyNeighborhood(index: BrowserSnapshotIndex, entityId: string, direction: BrowserDependencyDirection = "ALL"): BrowserDependencyNeighborhood | null {
  const focusEntity = index.entitiesById.get(entityId);
  if (!focusEntity) {
    return null;
  }
  const inboundRelationshipIds = index.inboundRelationshipIdsByEntityId.get(entityId) ?? [];
  const outboundRelationshipIds = index.outboundRelationshipIdsByEntityId.get(entityId) ?? [];
  const selectedRelationshipIds = [
    ...(direction === "ALL" || direction === "INBOUND" ? inboundRelationshipIds : []),
    ...(direction === "ALL" || direction === "OUTBOUND" ? outboundRelationshipIds : []),
  ];
  const uniqueRelationshipIds = [...new Set(selectedRelationshipIds)];
  const edges = uniqueRelationshipIds
    .map((relationshipId) => index.relationshipsById.get(relationshipId))
    .filter((item): item is FullSnapshotRelationship => Boolean(item))
    .map((relationship) => ({
      relationshipId: relationship.externalId,
      fromEntityId: relationship.fromEntityId,
      toEntityId: relationship.toEntityId,
      kind: relationship.kind,
      label: relationship.label,
    }));
  const inboundEntityIds = sortEntityIds(index, inboundRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)?.fromEntityId).filter((item): item is string => Boolean(item)));
  const outboundEntityIds = sortEntityIds(index, outboundRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)?.toEntityId).filter((item): item is string => Boolean(item)));
  const relatedEntityIds = sortEntityIds(index, [...inboundEntityIds, ...outboundEntityIds]);
  return {
    focusEntity,
    inboundEntityIds,
    outboundEntityIds,
    relatedEntityIds,
    edges,
  };
}

export function searchBrowserSnapshotIndex(index: BrowserSnapshotIndex, query: string, options?: { scopeId?: string | null; limit?: number }) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }
  const matches = index.searchableDocuments
    .filter((document) => document.normalizedText.includes(normalizedQuery))
    .filter((document) => isScopeWithin(index, options?.scopeId ?? null, document.scopeId))
    .map<BrowserSearchResult>((document) => ({
      kind: document.kind,
      id: document.id,
      title: document.title,
      subtitle: document.subtitle,
      scopeId: document.scopeId,
      score: scoreSearchDocument(document, normalizedQuery),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
    });
  return typeof options?.limit === "number" ? matches.slice(0, options.limit) : matches;
}

function scoreSearchDocument(document: BrowserSearchDocument, query: string) {
  const title = normalizeSearchText(document.title);
  const subtitle = normalizeSearchText(document.subtitle);
  const text = document.normalizedText;
  if (title === query) {
    return 100;
  }
  if (title.startsWith(query)) {
    return 90;
  }
  if (title.includes(query)) {
    return 75;
  }
  if (subtitle.includes(query)) {
    return 50;
  }
  if (text.includes(query)) {
    return 25;
  }
  return 0;
}


export function getAvailableViewpoints(index: BrowserSnapshotIndex, options?: { includePartial?: boolean; includeUnavailable?: boolean }) {
  const includePartial = options?.includePartial ?? true;
  const includeUnavailable = options?.includeUnavailable ?? false;
  return [...index.viewpointsById.values()]
    .filter((viewpoint) => includeUnavailable || viewpoint.availability !== "unavailable")
    .filter((viewpoint) => includePartial || viewpoint.availability === "available")
    .sort((left, right) => left.id.localeCompare(right.id, undefined, { sensitivity: 'base' }));
}

export function getViewpointById(index: BrowserSnapshotIndex, viewpointId: string) {
  return index.viewpointsById.get(viewpointId) ?? null;
}

export function resolveViewpointSeedEntityIds(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, options?: { scopeMode?: BrowserViewpointScopeMode; selectedScopeId?: string | null; variant?: BrowserViewpointVariant }) {
  const scopeMode = options?.scopeMode ?? "whole-snapshot";
  const selectedScopeId = options?.selectedScopeId ?? null;
  const variant = options?.variant ?? 'default';
  const entityIds = new Set<string>();
  if (viewpoint.id === 'persistence-model' && variant === 'show-entity-relations') {
    for (const entityId of index.entityIdsByArchitecturalRole.get('persistent-entity') ?? []) {
      if (isEntityWithinScopeMode(index, entityId, scopeMode, selectedScopeId)) {
        entityIds.add(entityId);
      }
    }
    return sortEntityIds(index, entityIds);
  }
  for (const entityId of viewpoint.seedEntityIds) {
    if (index.entitiesById.has(entityId) && isEntityWithinScopeMode(index, entityId, scopeMode, selectedScopeId)) {
      entityIds.add(entityId);
    }
  }
  for (const roleId of viewpoint.seedRoleIds) {
    for (const entityId of index.entityIdsByArchitecturalRole.get(roleId) ?? []) {
      if (isEntityWithinScopeMode(index, entityId, scopeMode, selectedScopeId)) {
        entityIds.add(entityId);
      }
    }
  }
  return sortEntityIds(index, entityIds);
}

export function resolveViewpointExpansionRelationships(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, seedEntityIds: Iterable<string>) {
  const allowedSemantics = viewpoint.expandViaSemantics.filter((semantic) => index.relationshipIdsByArchitecturalSemantic.has(semantic));
  if (allowedSemantics.length === 0) {
    return [] as FullSnapshotRelationship[];
  }
  const candidateRelationshipIds = new Set<string>();
  for (const semantic of allowedSemantics) {
    for (const relationshipId of index.relationshipIdsByArchitecturalSemantic.get(semantic) ?? []) {
      candidateRelationshipIds.add(relationshipId);
    }
  }

  const includedSeedIds = new Set([...seedEntityIds].filter((entityId) => index.entitiesById.has(entityId)));
  const candidates = [...candidateRelationshipIds]
    .map((relationshipId) => index.relationshipsById.get(relationshipId))
    .filter((relationship): relationship is FullSnapshotRelationship => Boolean(relationship))
    .filter((relationship) => {
      if (includedSeedIds.size === 0) {
        return true;
      }
      return includedSeedIds.has(relationship.fromEntityId)
        || includedSeedIds.has(relationship.toEntityId)
        || viewpoint.id === 'request-handling'
        || viewpoint.id === 'api-surface'
        || viewpoint.id === 'persistence-model'
        || viewpoint.id === 'integration-map'
        || viewpoint.id === 'module-dependencies'
        || viewpoint.id === 'ui-navigation';
    });
  return stableSortRelationships(candidates);
}



function resolvePersistentEntityAssociationRelationships(index: BrowserSnapshotIndex, seedEntityIds: string[]) {
  const included = new Set(seedEntityIds);
  return stableSortRelationships(
    [...index.relationshipsById.values()].filter((relationship) => {
      if (!included.has(relationship.fromEntityId) || !included.has(relationship.toEntityId)) {
        return false;
      }
      return getAssociationKind(relationship) === 'association' && hasAssociationDisplayMetadata(relationship);
    }),
  );
}

function includeIntegrationMapImmediateNeighbors(index: BrowserSnapshotIndex, seedEntityIds: string[], relationships: FullSnapshotRelationship[]) {
  const includedRelationshipIds = new Set(relationships.map((relationship) => relationship.externalId));
  const integrationSeedIds = new Set(seedEntityIds.filter((entityId) => {
    const entity = index.entitiesById.get(entityId);
    if (!entity) {
      return false;
    }
    const roles = getArchitecturalRoles(entity);
    return roles.includes('integration-adapter') || roles.includes('external-dependency');
  }));
  if (integrationSeedIds.size === 0) {
    return relationships;
  }
  for (const seedEntityId of integrationSeedIds) {
    const relationshipIds = [
      ...(index.inboundRelationshipIdsByEntityId.get(seedEntityId) ?? []),
      ...(index.outboundRelationshipIdsByEntityId.get(seedEntityId) ?? []),
    ];
    for (const relationshipId of relationshipIds) {
      if (includedRelationshipIds.has(relationshipId)) {
        continue;
      }
      const relationship = index.relationshipsById.get(relationshipId);
      if (!relationship) {
        continue;
      }
      includedRelationshipIds.add(relationshipId);
      relationships.push(relationship);
    }
  }
  return stableSortRelationships(relationships);
}

export function buildViewpointGraph(index: BrowserSnapshotIndex, viewpoint: FullSnapshotViewpoint, options?: { scopeMode?: BrowserViewpointScopeMode; selectedScopeId?: string | null; variant?: BrowserViewpointVariant }) : BrowserResolvedViewpointGraph {
  const scopeMode = options?.scopeMode ?? "whole-snapshot";
  const selectedScopeId = options?.selectedScopeId ?? null;
  const variant = options?.variant ?? "default";
  const seedEntityIds = resolveViewpointSeedEntityIds(index, viewpoint, { scopeMode, selectedScopeId, variant });
  const resolvedSeedEntityIds = viewpoint.id === 'api-surface'
    ? sortViewpointEntityIds(index, viewpoint, seedEntityIds.filter((entityId) => {
        const entity = index.entitiesById.get(entityId);
        return entity ? getArchitecturalRoles(entity).includes('api-entrypoint') : false;
      }), [])
    : viewpoint.id === 'integration-map'
      ? sortViewpointEntityIds(index, viewpoint, seedEntityIds.filter((entityId) => {
          const entity = index.entitiesById.get(entityId);
          if (!entity) {
            return false;
          }
          const roles = getArchitecturalRoles(entity);
          return roles.includes('integration-adapter') || roles.includes('external-dependency');
        }), [])
      : viewpoint.id === 'ui-navigation'
        ? sortViewpointEntityIds(index, viewpoint, seedEntityIds.filter((entityId) => {
            const relationshipIds = [
              ...(index.inboundRelationshipIdsByEntityId.get(entityId) ?? []),
              ...(index.outboundRelationshipIdsByEntityId.get(entityId) ?? []),
            ];
            return relationshipIds.some((relationshipId) => {
              const relationship = index.relationshipsById.get(relationshipId);
              if (!relationship) {
                return false;
              }
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
      if (!fromEntity || !toEntity) {
        return false;
      }
      const fromRoles = getArchitecturalRoles(fromEntity);
      const toRoles = getArchitecturalRoles(toEntity);
      const allowedRoles = new Set(['api-entrypoint', 'application-service', 'persistence-access', 'persistent-entity']);
      return [...fromRoles, ...toRoles].every((role) => !role || allowedRoles.has(role) || (role !== 'integration-adapter' && role !== 'external-dependency'))
        && !fromRoles.includes('integration-adapter')
        && !fromRoles.includes('external-dependency')
        && !toRoles.includes('integration-adapter')
        && !toRoles.includes('external-dependency');
    }));
  }
  if (viewpoint.id === 'api-surface') {
    const apiSeedSet = new Set(resolvedSeedEntityIds);
    expansionRelationships = expansionRelationships.filter((relationship) => apiSeedSet.has(relationship.fromEntityId) || apiSeedSet.has(relationship.toEntityId));
  }
  if (viewpoint.id === 'integration-map') {
    expansionRelationships = includeIntegrationMapImmediateNeighbors(index, resolvedSeedEntityIds, [...expansionRelationships]);
  }
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
          if (!inbound || included.has(inbound.externalId)) {
            continue;
          }
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
        if (!inbound || included.has(inbound.externalId)) {
          continue;
        }
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
  const orderedEntityIds = viewpoint.id === 'integration-map'
    ? sortedEntityIds
    : [
        ...sortedSeedEntityIds,
        ...sortedEntityIds.filter((entityId) => !sortedSeedEntityIds.includes(entityId)),
      ];
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
