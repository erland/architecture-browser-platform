import type { BrowserSnapshotIndex } from '../../../browser-snapshot';
import { createSavedCanvasItemReference, type SavedCanvasItemReference } from '../model/document';
import {
  classifyEntityCategory,
  classifyScopeCategory,
  deriveEntityQualifiedName,
  deriveEntitySignature,
  deriveScopePath,
  pickPrimarySourcePath,
  readFirstStringMetadata,
} from './stableReferenceShared';
import {
  buildEntitySemanticFingerprint,
  buildRelationshipSemanticFingerprint,
  buildStableEntityKey,
  buildStableRelationshipKey,
  buildStableScopeKey,
  buildScopeSemanticFingerprint,
} from './stableReferenceKeys';

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
