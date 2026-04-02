import type { FullSnapshotEntity } from '../../app-model';
import type { BrowserSnapshotIndex } from '../../browserSnapshotIndex';
import type { SavedCanvasItemReference } from '../model/document';
import { buildStableScopeKey } from './stableReferenceKeys';
import {
  asString,
  classifyEntityCategory,
  deriveEntityQualifiedName,
  deriveEntitySignature,
  normalizeToken,
  pickPrimarySourcePath,
  readFirstStringMetadata,
} from './stableReferenceShared';
import type { StableReferenceResolutionRule } from './stableReferenceResolution.rules';

export const entityFallbackRules: StableReferenceResolutionRule[] = [
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

function matchesEntityCategory(entity: FullSnapshotEntity, normalizedCategory: string | null): boolean {
  return !normalizedCategory || classifyEntityCategory(entity.kind) === normalizedCategory;
}

function buildFallbackEntityFingerprint(entity: FullSnapshotEntity): string {
  const primarySourcePath = pickPrimarySourcePath(entity.sourceRefs) ?? '';
  const qualifiedName = readFirstStringMetadata(entity.metadata, ['qualifiedName', 'fullyQualifiedName', 'symbol', 'fqName']) ?? '';
  return [
    classifyEntityCategory(entity.kind),
    normalizeToken(entity.displayName ?? entity.name) ?? '',
    normalizeToken(entity.origin) ?? '',
    normalizeToken(primarySourcePath) ?? '',
    normalizeToken(qualifiedName) ?? '',
    normalizeToken(deriveEntitySignature(entity)) ?? '',
  ].join('|');
}

function resolveSingleMatch<T extends { externalId: string }>(items: readonly T[], predicate: (item: T) => boolean): string | null {
  const matches = items.filter(predicate);
  return matches.length === 1 ? matches[0]!.externalId : null;
}
