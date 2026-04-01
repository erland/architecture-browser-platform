import type { FullSnapshotEntity, FullSnapshotRelationship, FullSnapshotScope } from '../../appModel';
import type { BrowserSnapshotIndex } from '../../browserSnapshotIndex';
import type { SavedCanvasItemReference } from '../model/document';
import { buildStableScopeKey } from './stableReferenceKeys';
import { resolveSavedCanvasReferenceIdByStableKey } from './stableReferenceLookup';
import {
  asString,
  classifyEntityCategory,
  classifyScopeCategory,
  deriveEntityQualifiedName,
  deriveEntitySignature,
  deriveScopePath,
  isRecord,
  normalizeToken,
  pickPrimarySourcePath,
  readFirstStringMetadata,
  type SavedCanvasReferenceResolution,
  type SavedCanvasReferenceResolutionStrategy,
} from './stableReferenceShared';

type StableReferenceResolutionRule = {
  strategy: SavedCanvasReferenceResolutionStrategy;
  resolve: (index: BrowserSnapshotIndex, reference: SavedCanvasItemReference) => string | null;
};

const exactResolutionRules: StableReferenceResolutionRule[] = [
  {
    strategy: 'DIRECT_ID',
    resolve: (index, reference) => resolveReferenceByDirectId(index, reference),
  },
  {
    strategy: 'EXACT_STABLE_KEY',
    resolve: (index, reference) => resolveSavedCanvasReferenceIdByStableKey(index, reference),
  },
];

const scopeFallbackRules: StableReferenceResolutionRule[] = [
  {
    strategy: 'FALLBACK_SCOPE_PATH',
    resolve: (index, reference) => resolveScopeByNormalizedPath(index, reference),
  },
  {
    strategy: 'FALLBACK_SCOPE_NAME',
    resolve: (index, reference) => resolveScopeByNameAndCategory(index, reference),
  },
];

const entityFallbackRules: StableReferenceResolutionRule[] = [
  {
    strategy: 'FALLBACK_ENTITY_QUALIFIED_NAME',
    resolve: (index, reference) => resolveEntityByQualifiedName(index, reference),
  },
  {
    strategy: 'FALLBACK_ENTITY_PATH_AND_NAME',
    resolve: (index, reference) => resolveEntityByPathAndName(index, reference),
  },
  {
    strategy: 'FALLBACK_ENTITY_NAME_IN_SCOPE',
    resolve: (index, reference) => resolveEntityByNameInScope(index, reference),
  },
  {
    strategy: 'FALLBACK_ENTITY_FINGERPRINT',
    resolve: (index, reference) => resolveEntityBySemanticFingerprint(index, reference),
  },
];

const relationshipFallbackRules: StableReferenceResolutionRule[] = [
  {
    strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS',
    resolve: (index, reference) => resolveRelationshipByResolvedEndpoints(index, reference),
  },
  {
    strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS',
    resolve: (index, reference) => resolveRelationshipByKindLabelAndPath(index, reference),
  },
];

export function resolveSavedCanvasReference(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  return runResolutionRules(index, reference, exactResolutionRules);
}

export function resolveSavedCanvasReferenceWithFallback(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): SavedCanvasReferenceResolution {
  const exactResolution = resolveSavedCanvasReference(index, reference);
  if (exactResolution.resolvedId) {
    return exactResolution;
  }

  if (reference.targetType === 'SCOPE') {
    return runResolutionRules(index, reference, scopeFallbackRules);
  }
  if (reference.targetType === 'ENTITY') {
    return runResolutionRules(index, reference, entityFallbackRules);
  }
  return runResolutionRules(index, reference, relationshipFallbackRules);
}

function runResolutionRules(
  index: BrowserSnapshotIndex,
  reference: SavedCanvasItemReference,
  rules: StableReferenceResolutionRule[],
): SavedCanvasReferenceResolution {
  for (const rule of rules) {
    const resolvedId = rule.resolve(index, reference);
    if (resolvedId) {
      return { resolvedId, strategy: rule.strategy };
    }
  }
  return { resolvedId: null, strategy: 'UNRESOLVED' };
}

function resolveReferenceByDirectId(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const directId = reference.originalSnapshotLocalId?.trim() || reference.stableKey.trim();
  if (!directId) {
    return null;
  }
  if (reference.targetType === 'SCOPE') {
    return index.scopesById.has(directId) ? directId : null;
  }
  if (reference.targetType === 'ENTITY') {
    return index.entitiesById.has(directId) ? directId : null;
  }
  return index.relationshipsById.has(directId) ? directId : null;
}

function resolveScopeByNormalizedPath(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  const normalizedPath = normalizeToken(fallback?.path);
  if (!normalizedPath) {
    return null;
  }

  return resolveSingleMatch(index.payload.scopes, (scope) => {
    const scopePath = index.scopePathById.get(scope.externalId) ?? deriveScopePath(index, scope);
    return normalizeToken(scopePath) === normalizedPath;
  });
}

function resolveScopeByNameAndCategory(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  const normalizedName = normalizeToken(fallback?.displayName ?? fallback?.name);
  const category = normalizeToken(fallback?.stableCategory ?? fallback?.kind);
  if (!normalizedName) {
    return null;
  }

  return resolveSingleMatch(index.payload.scopes, (scope) => {
    const scopeName = normalizeToken(scope.displayName ?? scope.name);
    const scopeCategory = classifyScopeCategory(scope.kind);
    return scopeName === normalizedName && (!category || scopeCategory === category);
  });
}

function resolveEntityByQualifiedName(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  const qualifiedName = normalizeToken(fallback?.qualifiedName);
  const category = normalizeToken(fallback?.stableCategory ?? fallback?.kind);
  if (!qualifiedName) {
    return null;
  }

  return resolveSingleMatch(index.payload.entities, (entity) => {
    const entityQualifiedName = normalizeToken(
      readFirstStringMetadata(entity.metadata, ['qualifiedName', 'fullyQualifiedName', 'symbol', 'fqName'])
      ?? deriveEntityQualifiedName(index, entity),
    );
    return entityQualifiedName === qualifiedName && matchesEntityCategory(entity, category);
  });
}

function resolveEntityByPathAndName(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  const primarySourcePath = normalizeToken(fallback?.primarySourcePath);
  const semanticName = normalizeToken(fallback?.displayName ?? fallback?.name ?? fallback?.qualifiedName);
  const category = normalizeToken(fallback?.stableCategory ?? fallback?.kind);
  if (!primarySourcePath || !semanticName) {
    return null;
  }

  return resolveSingleMatch(index.payload.entities, (entity) => {
    const entitySourcePath = normalizeToken(pickPrimarySourcePath(entity.sourceRefs));
    const entityName = normalizeToken(entity.displayName ?? entity.name);
    return entitySourcePath === primarySourcePath && entityName === semanticName && matchesEntityCategory(entity, category);
  });
}

function resolveEntityByNameInScope(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  const semanticName = normalizeToken(fallback?.displayName ?? fallback?.name ?? fallback?.qualifiedName);
  const scopeStableKey = normalizeToken(fallback?.scopeStableKey);
  const category = normalizeToken(fallback?.stableCategory ?? fallback?.kind);
  const origin = normalizeToken(asString(fallback?.metadata?.origin));
  const signature = normalizeToken(fallback?.signature);
  if (!semanticName || !scopeStableKey) {
    return null;
  }

  return resolveSingleMatch(index.payload.entities, (entity) => {
    const entityName = normalizeToken(entity.displayName ?? entity.name);
    const entityScopeStableKey = entity.scopeId ? buildStableScopeKey(index, index.scopesById.get(entity.scopeId) ?? null) : 'scope:unscoped';
    return entityName === semanticName
      && normalizeToken(entityScopeStableKey) === scopeStableKey
      && matchesEntityCategory(entity, category)
      && (!origin || normalizeToken(entity.origin) === origin)
      && (!signature || normalizeToken(deriveEntitySignature(entity)) === signature);
  });
}

function resolveEntityBySemanticFingerprint(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  const semanticFingerprint = normalizeToken(fallback?.semanticFingerprint);
  const category = normalizeToken(fallback?.stableCategory ?? fallback?.kind);
  if (!semanticFingerprint) {
    return null;
  }

  return resolveSingleMatch(index.payload.entities, (entity) => {
    const entityFingerprint = normalizeToken(buildFallbackEntityFingerprint(entity));
    return entityFingerprint === semanticFingerprint && matchesEntityCategory(entity, category);
  });
}

function resolveRelationshipByResolvedEndpoints(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  if (!fallback) {
    return null;
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

  if (!fromResolution.resolvedId || !toResolution.resolvedId) {
    return null;
  }

  return resolveSingleMatch(index.payload.relationships, (relationship) => {
    const candidateLabel = normalizeToken(relationship.label ?? readFirstStringMetadata(relationship.metadata, ['semantic', 'semanticLabel']) ?? '');
    return relationship.fromEntityId === fromResolution.resolvedId
      && relationship.toEntityId === toResolution.resolvedId
      && (!relationshipKind || normalizeToken(relationship.kind) === relationshipKind)
      && (!relationshipLabel || candidateLabel === relationshipLabel);
  });
}

function resolveRelationshipByKindLabelAndPath(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  if (!fallback) {
    return null;
  }

  const relationshipKind = normalizeToken(fallback.relationshipKind);
  const relationshipLabel = normalizeToken(asString(fallback.metadata?.label));
  const primarySourcePath = normalizeToken(fallback.primarySourcePath);

  return resolveSingleMatch(index.payload.relationships, (relationship) => {
    const candidateLabel = normalizeToken(relationship.label ?? readFirstStringMetadata(relationship.metadata, ['semantic', 'semanticLabel']) ?? '');
    const candidatePath = normalizeToken(pickPrimarySourcePath(relationship.sourceRefs));
    return (!relationshipKind || normalizeToken(relationship.kind) === relationshipKind)
      && (!relationshipLabel || candidateLabel === relationshipLabel)
      && (!primarySourcePath || candidatePath === primarySourcePath);
  });
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

function resolveSingleMatch<T extends FullSnapshotScope | FullSnapshotEntity | FullSnapshotRelationship>(
  candidates: T[],
  predicate: (candidate: T) => boolean,
): string | null {
  const matches = candidates.filter(predicate);
  return matches.length === 1 ? matches[0].externalId : null;
}
