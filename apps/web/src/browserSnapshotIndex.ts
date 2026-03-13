import type {
  FullSnapshotDiagnostic,
  FullSnapshotEntity,
  FullSnapshotPayload,
  FullSnapshotRelationship,
  FullSnapshotScope,
  SnapshotSourceRef,
} from "./appModel";

export type BrowserNodeKind = "scope" | "entity";
export type BrowserSearchResultKind = BrowserNodeKind | "relationship" | "diagnostic";
export type BrowserDependencyDirection = "ALL" | "INBOUND" | "OUTBOUND";

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
  scopesById: Map<string, FullSnapshotScope>;
  entitiesById: Map<string, FullSnapshotEntity>;
  relationshipsById: Map<string, FullSnapshotRelationship>;
  diagnosticsById: Map<string, FullSnapshotDiagnostic>;
  childScopeIdsByParentId: Map<string | null, string[]>;
  entityIdsByScopeId: Map<string | null, string[]>;
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

function compareEntityIds(index: BrowserSnapshotIndex, leftEntityId: string, rightEntityId: string) {
  const left = index.entitiesById.get(leftEntityId);
  const right = index.entitiesById.get(rightEntityId);
  if (!left || !right) {
    return leftEntityId.localeCompare(rightEntityId);
  }
  return compareByDisplayName(left, right);
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

function buildScopeTree(index: BrowserSnapshotIndex, parentScopeId: string | null = null, depth = 0): BrowserScopeTreeNode[] {
  const cached = index.scopeNodesByParentId.get(parentScopeId);
  if (cached) {
    return cached;
  }
  const scopeIds = [...(index.childScopeIdsByParentId.get(parentScopeId) ?? [])].sort((a, b) => compareScopeIds(index, a, b));
  const nodes = scopeIds.map((scopeId) => {
    const scope = index.scopesById.get(scopeId);
    if (!scope) {
      throw new Error(`Missing scope '${scopeId}' while building scope tree.`);
    }
    const childScopeIds = [...(index.childScopeIdsByParentId.get(scopeId) ?? [])].sort((a, b) => compareScopeIds(index, a, b));
    const directEntityIds = [...(index.entityIdsByScopeId.get(scopeId) ?? [])].sort((a, b) => compareEntityIds(index, a, b));
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

export function buildBrowserSnapshotIndex(payload: FullSnapshotPayload): BrowserSnapshotIndex {
  const scopesById = new Map(payload.scopes.map((scope) => [scope.externalId, scope]));
  const entitiesById = new Map(payload.entities.map((entity) => [entity.externalId, entity]));
  const relationshipsById = new Map(payload.relationships.map((relationship) => [relationship.externalId, relationship]));
  const diagnosticsById = new Map(payload.diagnostics.map((diagnostic) => [diagnostic.externalId, diagnostic]));
  const childScopeIdsByParentId = new Map<string | null, string[]>();
  const entityIdsByScopeId = new Map<string | null, string[]>();
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
  }

  for (const relationship of payload.relationships) {
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
    scopesById,
    entitiesById,
    relationshipsById,
    diagnosticsById,
    childScopeIdsByParentId,
    entityIdsByScopeId,
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

  index.scopeTree = buildScopeTree(index);
  index.searchableDocuments = buildSearchableDocuments(index);
  return index;
}

const browserSnapshotIndexCache = new Map<string, BrowserSnapshotIndex>();

export function getOrBuildBrowserSnapshotIndex(payload: FullSnapshotPayload) {
  const cached = browserSnapshotIndexCache.get(payload.snapshot.id);
  if (cached) {
    return cached;
  }
  const built = buildBrowserSnapshotIndex(payload);
  browserSnapshotIndexCache.set(payload.snapshot.id, built);
  return built;
}

export function clearBrowserSnapshotIndex(snapshotId?: string) {
  if (snapshotId) {
    browserSnapshotIndexCache.delete(snapshotId);
    return;
  }
  browserSnapshotIndexCache.clear();
}

export function getScopeTreeRoots(index: BrowserSnapshotIndex) {
  return index.scopeTree;
}

export function getScopeChildren(index: BrowserSnapshotIndex, parentScopeId: string | null) {
  return index.scopeNodesByParentId.get(parentScopeId) ?? [];
}

export function getScopeFacts(index: BrowserSnapshotIndex, scopeId: string): BrowserScopeFacts | null {
  const scope = index.scopesById.get(scopeId);
  if (!scope) {
    return null;
  }
  const childScopeIds = [...(index.childScopeIdsByParentId.get(scopeId) ?? [])].sort((a, b) => compareScopeIds(index, a, b));
  const entityIds = [...(index.entityIdsByScopeId.get(scopeId) ?? [])].sort((a, b) => compareEntityIds(index, a, b));
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
  const inboundEntityIds = [...new Set(inboundRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)?.fromEntityId).filter((item): item is string => Boolean(item)))].sort((a, b) => compareEntityIds(index, a, b));
  const outboundEntityIds = [...new Set(outboundRelationshipIds.map((relationshipId) => index.relationshipsById.get(relationshipId)?.toEntityId).filter((item): item is string => Boolean(item)))].sort((a, b) => compareEntityIds(index, a, b));
  return {
    focusEntity,
    inboundEntityIds,
    outboundEntityIds,
    relatedEntityIds: [...new Set([...inboundEntityIds, ...outboundEntityIds])],
    edges,
  };
}

export function searchBrowserSnapshotIndex(index: BrowserSnapshotIndex, queryText: string, options: { scopeId?: string | null; limit?: number } = {}) {
  const normalizedQuery = normalizeSearchText(queryText);
  const limit = Math.max(options.limit ?? 25, 1);
  const allDocuments = index.searchableDocuments.filter((document) => isScopeWithin(index, options.scopeId ?? null, document.scopeId));
  const matchingDocuments = normalizedQuery
    ? allDocuments.filter((document) => document.normalizedText.includes(normalizedQuery))
    : allDocuments;
  return matchingDocuments
    .map((document) => ({
      kind: document.kind,
      id: document.id,
      title: document.title,
      subtitle: document.subtitle,
      scopeId: document.scopeId,
      score: scoreDocument(document, normalizedQuery),
    }))
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, undefined, { sensitivity: "base" }))
    .slice(0, limit);
}

function scoreDocument(document: BrowserSearchDocument, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 1;
  }
  if (document.title.toLocaleLowerCase() === normalizedQuery) {
    return 120;
  }
  if (document.title.toLocaleLowerCase().startsWith(normalizedQuery)) {
    return 100;
  }
  if (document.normalizedText.includes(normalizedQuery)) {
    return 80;
  }
  return 10;
}
