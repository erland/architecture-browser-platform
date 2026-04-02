import type {
  FullSnapshotEntity,
  FullSnapshotRelationship,
  FullSnapshotScope,
} from '../../app-model';
import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import {
  classifyEntityCategory,
  classifyScopeCategory,
  deriveEntityQualifiedName,
  deriveEntitySignature,
  deriveScopePath,
  normalizeToken,
  pickPrimarySourcePath,
  readFirstStringMetadata,
} from './stableReferenceShared';

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
