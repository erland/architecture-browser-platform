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
      },
    },
  });
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
    .toLocaleLowerCase()
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/[^a-z0-9._:/#-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/:+/g, ':')
    .replace(/^[:.-]+|[:.-]+$/g, '');
}

function deriveScopePath(index: BrowserSnapshotIndex, scope: FullSnapshotScope): string {
  const pathSegments: string[] = [];
  const seen = new Set<string>();
  let current: FullSnapshotScope | undefined | null = scope;
  while (current && !seen.has(current.externalId)) {
    seen.add(current.externalId);
    pathSegments.unshift(current.name || current.displayName || current.externalId);
    current = current.parentScopeId ? index.scopesById.get(current.parentScopeId) : null;
  }
  return pathSegments.join('/');
}

function deriveEntityQualifiedName(index: BrowserSnapshotIndex, entity: FullSnapshotEntity): string {
  const scopePath = entity.scopeId ? index.scopePathById.get(entity.scopeId) ?? '' : '';
  return [scopePath, entity.displayName ?? entity.name].filter(Boolean).join('/');
}

function deriveEntitySignature(entity: FullSnapshotEntity): string | null {
  return readFirstStringMetadata(entity.metadata, [
    'signature',
    'callSignature',
    'methodSignature',
    'httpSignature',
    'routeSignature',
    'arity',
  ]) ?? null;
}

function readFirstStringMetadata(metadata: Record<string, unknown> | undefined, keys: string[]): string | null {
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

function pickPrimarySourcePath(sourceRefs: SnapshotSourceRef[] | null | undefined): string | null {
  for (const sourceRef of sourceRefs ?? []) {
    if (sourceRef.path?.trim()) {
      return sourceRef.path;
    }
  }
  return null;
}
