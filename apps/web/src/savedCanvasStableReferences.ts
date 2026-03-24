import type {
  FullSnapshotEntity,
  FullSnapshotRelationship,
  FullSnapshotScope,
  SnapshotSourceRef,
} from './appModel';
import type { BrowserSnapshotIndex } from './browserSnapshotIndex';
import { createSavedCanvasItemReference, type SavedCanvasItemReference } from './savedCanvasModel';

export type SavedCanvasStableReferenceLookup = {
  scopeIdByStableKey: Map<string, string>;
  entityIdByStableKey: Map<string, string>;
  relationshipIdByStableKey: Map<string, string>;
};

export type SavedCanvasReferenceResolutionStrategy =
  | 'DIRECT_ID'
  | 'EXACT_STABLE_KEY'
  | 'FALLBACK_SCOPE_PATH'
  | 'FALLBACK_SCOPE_NAME'
  | 'FALLBACK_ENTITY_QUALIFIED_NAME'
  | 'FALLBACK_ENTITY_PATH_AND_NAME'
  | 'FALLBACK_ENTITY_NAME_IN_SCOPE'
  | 'FALLBACK_ENTITY_FINGERPRINT'
  | 'FALLBACK_RELATIONSHIP_ENDPOINTS'
  | 'UNRESOLVED';

export type SavedCanvasReferenceResolution = {
  resolvedId: string | null;
  strategy: SavedCanvasReferenceResolutionStrategy;
};

const stableReferenceLookupCache = new WeakMap<BrowserSnapshotIndex, SavedCanvasStableReferenceLookup>();

export function createSavedCanvasScopeReference(index: BrowserSnapshotIndex, scopeId: string): SavedCanvasItemReference {
  const scope = index.scopesById.get(scopeId);
  if (!scope) {
    throw new Error(`Cannot create saved canvas scope reference for missing scope '${scopeId}'.`);
  }
  return createSavedCanvasItemReference({
    targetType: 'SCOPE',
    stableKey: buildStableScopeKey(index, scope),
    originalSnapshotLocalId: scope.externalId,
    fallback: {
      kind: scope.kind,
      name: scope.name,
      displayName: scope.displayName,
      path: index.scopePathById.get(scope.externalId) ?? deriveScopePath(index, scope),
      primarySourcePath: pickPrimarySourcePath(scope.sourceRefs),
      stableCategory: classifyScopeCategory(scope.kind),
      semanticFingerprint: buildScopeSemanticFingerprint(index, scope),
      metadata: {
        stableReferenceVersion: 1,
      },
    },
  });
}

export function createSavedCanvasEntityReference(index: BrowserSnapshotIndex, entityId: string): SavedCanvasItemReference {
  const entity = index.entitiesById.get(entityId);
  if (!entity) {
    throw new Error(`Cannot create saved canvas entity reference for missing entity '${entityId}'.`);
  }
  const scopeStableKey = entity.scopeId ? buildStableScopeKey(index, index.scopesById.get(entity.scopeId) ?? null) : null;
  return createSavedCanvasItemReference({
    targetType: 'ENTITY',
    stableKey: buildStableEntityKey(index, entity),
    originalSnapshotLocalId: entity.externalId,
    fallback: {
      kind: entity.kind,
      name: entity.name,
      displayName: entity.displayName,
      scopeStableKey,
      path: entity.scopeId ? index.scopePathById.get(entity.scopeId) ?? null : null,
      qualifiedName: readFirstStringMetadata(entity.metadata, ['qualifiedName', 'fullyQualifiedName', 'symbol', 'fqName']) ?? deriveEntityQualifiedName(index, entity),
      signature: deriveEntitySignature(entity),
      primarySourcePath: pickPrimarySourcePath(entity.sourceRefs),
      stableCategory: classifyEntityCategory(entity.kind),
      semanticFingerprint: buildEntitySemanticFingerprint(index, entity),
      metadata: {
        stableReferenceVersion: 1,
        origin: entity.origin,
      },
    },
  });
}

export function createSavedCanvasRelationshipReference(index: BrowserSnapshotIndex, relationshipId: string): SavedCanvasItemReference {
  const relationship = index.relationshipsById.get(relationshipId);
  if (!relationship) {
    throw new Error(`Cannot create saved canvas relationship reference for missing relationship '${relationshipId}'.`);
  }
  const fromEntity = index.entitiesById.get(relationship.fromEntityId) ?? null;
  const toEntity = index.entitiesById.get(relationship.toEntityId) ?? null;
  return createSavedCanvasItemReference({
    targetType: 'RELATIONSHIP',
    stableKey: buildStableRelationshipKey(index, relationship),
    originalSnapshotLocalId: relationship.externalId,
    fallback: {
      relationshipKind: relationship.kind,
      fromStableKey: fromEntity ? buildStableEntityKey(index, fromEntity) : null,
      toStableKey: toEntity ? buildStableEntityKey(index, toEntity) : null,
      primarySourcePath: pickPrimarySourcePath(relationship.sourceRefs),
      stableCategory: 'relationship',
      semanticFingerprint: buildRelationshipSemanticFingerprint(index, relationship),
      metadata: {
        stableReferenceVersion: 1,
        label: relationship.label,
        architecturalSemantics: relationship.metadata?.architecturalSemantics ?? null,
        fromEntityFallback: fromEntity ? createSavedCanvasEntityReference(index, fromEntity.externalId).fallback : null,
        toEntityFallback: toEntity ? createSavedCanvasEntityReference(index, toEntity.externalId).fallback : null,
      },
    },
  });
}

export function resolveSavedCanvasReference(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  const directId = reference.originalSnapshotLocalId?.trim() || reference.stableKey.trim();
  if (reference.targetType === 'SCOPE') {
    if (directId && index.scopesById.has(directId)) {
      return { resolvedId: directId, strategy: 'DIRECT_ID' };
    }
  } else if (reference.targetType === 'ENTITY') {
    if (directId && index.entitiesById.has(directId)) {
      return { resolvedId: directId, strategy: 'DIRECT_ID' };
    }
  } else if (directId && index.relationshipsById.has(directId)) {
    return { resolvedId: directId, strategy: 'DIRECT_ID' };
  }

  const stableId = resolveSavedCanvasReferenceIdByStableKey(index, reference);
  if (stableId) {
    return { resolvedId: stableId, strategy: 'EXACT_STABLE_KEY' };
  }

  return { resolvedId: null, strategy: 'UNRESOLVED' };
}

export function resolveSavedCanvasReferenceWithFallback(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  const exactResolution = resolveSavedCanvasReference(index, reference);
  if (exactResolution.resolvedId) {
    return exactResolution;
  }

  if (reference.targetType === 'SCOPE') {
    return resolveSavedCanvasScopeFallback(index, reference);
  }
  if (reference.targetType === 'ENTITY') {
    return resolveSavedCanvasEntityFallback(index, reference);
  }
  return resolveSavedCanvasRelationshipFallback(index, reference);
}

export function resolveSavedCanvasReferenceIdByStableKey(
  index: BrowserSnapshotIndex,
  reference: SavedCanvasItemReference,
): string | null {
  const lookup = getSavedCanvasStableReferenceLookup(index);
  if (reference.targetType === 'SCOPE') {
    return lookup.scopeIdByStableKey.get(reference.stableKey) ?? null;
  }
  if (reference.targetType === 'ENTITY') {
    return lookup.entityIdByStableKey.get(reference.stableKey) ?? null;
  }
  return lookup.relationshipIdByStableKey.get(reference.stableKey) ?? null;
}

export function getSavedCanvasStableReferenceLookup(index: BrowserSnapshotIndex): SavedCanvasStableReferenceLookup {
  const cached = stableReferenceLookupCache.get(index);
  if (cached) {
    return cached;
  }
  const lookup: SavedCanvasStableReferenceLookup = {
    scopeIdByStableKey: new Map<string, string>(),
    entityIdByStableKey: new Map<string, string>(),
    relationshipIdByStableKey: new Map<string, string>(),
  };

  for (const scope of index.payload.scopes) {
    lookup.scopeIdByStableKey.set(buildStableScopeKey(index, scope), scope.externalId);
  }
  for (const entity of index.payload.entities) {
    lookup.entityIdByStableKey.set(buildStableEntityKey(index, entity), entity.externalId);
  }
  for (const relationship of index.payload.relationships) {
    lookup.relationshipIdByStableKey.set(buildStableRelationshipKey(index, relationship), relationship.externalId);
  }

  stableReferenceLookupCache.set(index, lookup);
  return lookup;
}

export function buildStableScopeKey(index: BrowserSnapshotIndex, scope: FullSnapshotScope | null): string {
  if (!scope) {
    return 'scope:missing';
  }
  const category = classifyScopeCategory(scope.kind);
  const path = normalizeToken(index.scopePathById.get(scope.externalId) ?? deriveScopePath(index, scope) ?? scope.name);
  return ['scope', category, path].join(':');
}

export function buildStableEntityKey(index: BrowserSnapshotIndex, entity: FullSnapshotEntity): string {
  const category = classifyEntityCategory(entity.kind);
  const scopeStableKey = entity.scopeId ? buildStableScopeKey(index, index.scopesById.get(entity.scopeId) ?? null) : 'scope:unscoped';
  const semanticName = normalizeToken(
    readFirstStringMetadata(entity.metadata, ['qualifiedName', 'fullyQualifiedName', 'symbol', 'fqName'])
      ?? deriveEntityQualifiedName(index, entity)
      ?? entity.displayName
      ?? entity.name,
  );
  const signature = normalizeToken(deriveEntitySignature(entity) ?? '');
  return ['entity', category, normalizeToken(entity.kind), scopeStableKey, semanticName, signature].filter(Boolean).join(':');
}

export function buildStableRelationshipKey(index: BrowserSnapshotIndex, relationship: FullSnapshotRelationship): string {
  const fromEntity = index.entitiesById.get(relationship.fromEntityId);
  const toEntity = index.entitiesById.get(relationship.toEntityId);
  const fromKey = fromEntity ? buildStableEntityKey(index, fromEntity) : normalizeToken(relationship.fromEntityId);
  const toKey = toEntity ? buildStableEntityKey(index, toEntity) : normalizeToken(relationship.toEntityId);
  const labelKey = normalizeToken(relationship.label ?? readFirstStringMetadata(relationship.metadata, ['semantic', 'semanticLabel']) ?? '');
  return ['relationship', normalizeToken(relationship.kind), fromKey, toKey, labelKey].filter(Boolean).join(':');
}

export function buildScopeSemanticFingerprint(index: BrowserSnapshotIndex, scope: FullSnapshotScope): string {
  return [classifyScopeCategory(scope.kind), buildStableScopeKey(index, scope), pickPrimarySourcePath(scope.sourceRefs) ?? ''].filter(Boolean).join('|');
}

export function buildEntitySemanticFingerprint(index: BrowserSnapshotIndex, entity: FullSnapshotEntity): string {
  return [
    classifyEntityCategory(entity.kind),
    buildStableEntityKey(index, entity),
    pickPrimarySourcePath(entity.sourceRefs) ?? '',
    normalizeToken(entity.origin ?? ''),
  ].filter(Boolean).join('|');
}

export function buildRelationshipSemanticFingerprint(index: BrowserSnapshotIndex, relationship: FullSnapshotRelationship): string {
  return [
    'relationship',
    buildStableRelationshipKey(index, relationship),
    pickPrimarySourcePath(relationship.sourceRefs) ?? '',
  ].filter(Boolean).join('|');
}

export function classifyScopeCategory(kind: string | null | undefined): string {
  const normalizedKind = normalizeToken(kind ?? 'scope');
  if (normalizedKind.includes('file')) return 'file';
  if (normalizedKind.includes('directory') || normalizedKind.includes('folder')) return 'directory';
  if (normalizedKind.includes('package') || normalizedKind.includes('namespace')) return 'package';
  if (normalizedKind.includes('module')) return 'module';
  if (normalizedKind.includes('repository') || normalizedKind.includes('workspace') || normalizedKind.includes('root')) return 'repository';
  return normalizedKind || 'scope';
}

export function classifyEntityCategory(kind: string | null | undefined): string {
  const normalizedKind = normalizeToken(kind ?? 'entity');
  if (normalizedKind.includes('endpoint') || normalizedKind.includes('route') || normalizedKind.includes('action')) return 'endpoint';
  if (normalizedKind.includes('function') || normalizedKind.includes('method') || normalizedKind.includes('handler') || normalizedKind.includes('procedure')) return 'function';
  if (normalizedKind.includes('class') || normalizedKind.includes('type') || normalizedKind.includes('interface') || normalizedKind.includes('enum') || normalizedKind.includes('record')) return 'type';
  if (normalizedKind.includes('module') || normalizedKind.includes('component') || normalizedKind.includes('service') || normalizedKind.includes('adapter')) return 'module';
  return normalizedKind || 'entity';
}

export function normalizeToken(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function resolveSavedCanvasScopeFallback(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  const fallback = reference.fallback;
  if (!fallback) {
    return { resolvedId: null, strategy: 'UNRESOLVED' };
  }

  const normalizedPath = normalizeToken(fallback.path);
  if (normalizedPath) {
    const matchingScopes = index.payload.scopes.filter((scope) => normalizeToken(index.scopePathById.get(scope.externalId) ?? deriveScopePath(index, scope)) === normalizedPath);
    if (matchingScopes.length === 1) {
      return { resolvedId: matchingScopes[0].externalId, strategy: 'FALLBACK_SCOPE_PATH' };
    }
  }

  const normalizedName = normalizeToken(fallback.displayName ?? fallback.name);
  const category = normalizeToken(fallback.stableCategory ?? fallback.kind);
  if (normalizedName) {
    const matchingScopes = index.payload.scopes.filter((scope) => {
      const scopeName = normalizeToken(scope.displayName ?? scope.name);
      const scopeCategory = classifyScopeCategory(scope.kind);
      return scopeName === normalizedName && (!category || scopeCategory === category);
    });
    if (matchingScopes.length === 1) {
      return { resolvedId: matchingScopes[0].externalId, strategy: 'FALLBACK_SCOPE_NAME' };
    }
  }

  return { resolvedId: null, strategy: 'UNRESOLVED' };
}

function resolveSavedCanvasEntityFallback(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  const fallback = reference.fallback;
  if (!fallback) {
    return { resolvedId: null, strategy: 'UNRESOLVED' };
  }

  const category = normalizeToken(fallback.stableCategory ?? fallback.kind);
  const scopeStableKey = normalizeToken(fallback.scopeStableKey);
  const qualifiedName = normalizeToken(fallback.qualifiedName);
  const signature = normalizeToken(fallback.signature);
  const primarySourcePath = normalizeToken(fallback.primarySourcePath);
  const semanticFingerprint = normalizeToken(fallback.semanticFingerprint);
  const semanticName = normalizeToken(fallback.displayName ?? fallback.name ?? fallback.qualifiedName);
  const origin = normalizeToken(asString(fallback.metadata?.origin));

  if (qualifiedName) {
    const matchingEntities = index.payload.entities.filter((entity) => {
      const entityQualifiedName = normalizeToken(readFirstStringMetadata(entity.metadata, ['qualifiedName', 'fullyQualifiedName', 'symbol', 'fqName']) ?? deriveEntityQualifiedName(index, entity));
      return entityQualifiedName === qualifiedName && matchesEntityCategory(entity, category);
    });
    if (matchingEntities.length === 1) {
      return { resolvedId: matchingEntities[0].externalId, strategy: 'FALLBACK_ENTITY_QUALIFIED_NAME' };
    }
  }

  if (primarySourcePath && semanticName) {
    const matchingEntities = index.payload.entities.filter((entity) => {
      const entitySourcePath = normalizeToken(pickPrimarySourcePath(entity.sourceRefs));
      const entityName = normalizeToken(entity.displayName ?? entity.name);
      return entitySourcePath === primarySourcePath && entityName === semanticName && matchesEntityCategory(entity, category);
    });
    if (matchingEntities.length === 1) {
      return { resolvedId: matchingEntities[0].externalId, strategy: 'FALLBACK_ENTITY_PATH_AND_NAME' };
    }
  }

  if (semanticName && scopeStableKey) {
    const matchingEntities = index.payload.entities.filter((entity) => {
      const entityName = normalizeToken(entity.displayName ?? entity.name);
      const entityScopeStableKey = entity.scopeId ? buildStableScopeKey(index, index.scopesById.get(entity.scopeId) ?? null) : 'scope:unscoped';
      return entityName === semanticName
        && normalizeToken(entityScopeStableKey) === scopeStableKey
        && matchesEntityCategory(entity, category)
        && (!origin || normalizeToken(entity.origin) === origin)
        && (!signature || normalizeToken(deriveEntitySignature(entity)) === signature);
    });
    if (matchingEntities.length === 1) {
      return { resolvedId: matchingEntities[0].externalId, strategy: 'FALLBACK_ENTITY_NAME_IN_SCOPE' };
    }
  }

  if (semanticFingerprint) {
    const matchingEntities = index.payload.entities.filter((entity) => {
      const entityFingerprint = normalizeToken(buildFallbackEntityFingerprint(entity));
      return entityFingerprint === semanticFingerprint && matchesEntityCategory(entity, category);
    });
    if (matchingEntities.length === 1) {
      return { resolvedId: matchingEntities[0].externalId, strategy: 'FALLBACK_ENTITY_FINGERPRINT' };
    }
  }

  return { resolvedId: null, strategy: 'UNRESOLVED' };
}

function resolveSavedCanvasRelationshipFallback(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  const fallback = reference.fallback;
  if (!fallback) {
    return { resolvedId: null, strategy: 'UNRESOLVED' };
  }

  const relationshipKind = normalizeToken(fallback.relationshipKind);
  const relationshipLabel = normalizeToken(asString(fallback.metadata?.label));

  const fromResolution = fallback.fromStableKey
    ? resolveSavedCanvasReferenceWithFallback(index, {
        targetType: 'ENTITY',
        stableKey: fallback.fromStableKey,
        originalSnapshotLocalId: null,
        fallback: isRecord(fallback.metadata?.fromEntityFallback) ? fallback.metadata?.fromEntityFallback as SavedCanvasItemReference['fallback'] : null,
      })
    : { resolvedId: null, strategy: 'UNRESOLVED' as const };
  const toResolution = fallback.toStableKey
    ? resolveSavedCanvasReferenceWithFallback(index, {
        targetType: 'ENTITY',
        stableKey: fallback.toStableKey,
        originalSnapshotLocalId: null,
        fallback: isRecord(fallback.metadata?.toEntityFallback) ? fallback.metadata?.toEntityFallback as SavedCanvasItemReference['fallback'] : null,
      })
    : { resolvedId: null, strategy: 'UNRESOLVED' as const };

  if (fromResolution.resolvedId && toResolution.resolvedId) {
    const matchingRelationships = index.payload.relationships.filter((relationship) => {
      const candidateLabel = normalizeToken(relationship.label ?? readFirstStringMetadata(relationship.metadata, ['semantic', 'semanticLabel']) ?? '');
      return relationship.fromEntityId === fromResolution.resolvedId
        && relationship.toEntityId === toResolution.resolvedId
        && (!relationshipKind || normalizeToken(relationship.kind) === relationshipKind)
        && (!relationshipLabel || candidateLabel === relationshipLabel);
    });

    if (matchingRelationships.length === 1) {
      return { resolvedId: matchingRelationships[0].externalId, strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS' };
    }
  }

  const primarySourcePath = normalizeToken(fallback.primarySourcePath);
  const byKindAndLabel = index.payload.relationships.filter((relationship) => {
    const candidateLabel = normalizeToken(relationship.label ?? readFirstStringMetadata(relationship.metadata, ['semantic', 'semanticLabel']) ?? '');
    const candidatePath = normalizeToken(pickPrimarySourcePath(relationship.sourceRefs));
    return (!relationshipKind || normalizeToken(relationship.kind) === relationshipKind)
      && (!relationshipLabel || candidateLabel === relationshipLabel)
      && (!primarySourcePath || candidatePath === primarySourcePath);
  });
  if (byKindAndLabel.length === 1) {
    return { resolvedId: byKindAndLabel[0].externalId, strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS' };
  }

  return { resolvedId: null, strategy: 'UNRESOLVED' };
}

function matchesEntityCategory(entity: FullSnapshotEntity, category: string): boolean {
  return !category || classifyEntityCategory(entity.kind) === category;
}

function buildFallbackEntityFingerprint(entity: FullSnapshotEntity): string {
  return [
    classifyEntityCategory(entity.kind),
    normalizeToken(entity.displayName ?? entity.name),
    normalizeToken(pickPrimarySourcePath(entity.sourceRefs)),
    normalizeToken(entity.origin),
  ].filter(Boolean).join('|');
}

function deriveScopePath(index: BrowserSnapshotIndex, scope: FullSnapshotScope | null): string | null {
  if (!scope) {
    return null;
  }
  const parentScope = scope.parentScopeId ? index.scopesById.get(scope.parentScopeId) ?? null : null;
  const scopeName = scope.name || scope.displayName || scope.externalId;
  if (!parentScope) {
    return scopeName;
  }
  const parentPath = index.scopePathById.get(parentScope.externalId) ?? deriveScopePath(index, parentScope);
  return parentPath ? `${parentPath}/${scopeName}` : scopeName;
}

function deriveEntityQualifiedName(index: BrowserSnapshotIndex, entity: FullSnapshotEntity): string | null {
  const scopePath = entity.scopeId ? index.scopePathById.get(entity.scopeId) ?? null : null;
  const name = entity.displayName ?? entity.name ?? entity.externalId;
  return scopePath ? `${scopePath}/${name}` : name;
}

function deriveEntitySignature(entity: FullSnapshotEntity): string | null {
  return readFirstStringMetadata(entity.metadata, ['signature', 'methodSignature', 'callableSignature', 'descriptor']);
}

function pickPrimarySourcePath(sourceRefs: SnapshotSourceRef[] | null | undefined): string | null {
  if (!sourceRefs || sourceRefs.length === 0) {
    return null;
  }
  const firstWithPath = sourceRefs.find((sourceRef) => sourceRef.path?.trim());
  return firstWithPath?.path ?? null;
}

function readFirstStringMetadata(metadata: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  if (!metadata) {
    return null;
  }
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
