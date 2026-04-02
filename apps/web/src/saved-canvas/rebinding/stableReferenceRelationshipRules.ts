import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import type { SavedCanvasItemReference } from '../model/document';
import { asString, isRecord, normalizeToken } from './stableReferenceShared';
import type { StableReferenceResolutionRule } from './stableReferenceResolution.rules';

export function createRelationshipFallbackRules(
  resolveReferenceWithFallback: (index: BrowserSnapshotIndex, reference: SavedCanvasItemReference) => { resolvedId: string | null },
): StableReferenceResolutionRule[] {
  return [
    {
      strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS',
      resolve: (index, reference) => resolveRelationshipByResolvedEndpoints(index, reference, resolveReferenceWithFallback),
    },
    {
      strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS',
      resolve: (index, reference) => resolveRelationshipByKindLabelAndPath(index, reference),
    },
  ];
}

function resolveRelationshipByResolvedEndpoints(
  index: BrowserSnapshotIndex,
  reference: SavedCanvasItemReference,
  resolveReferenceWithFallback: (index: BrowserSnapshotIndex, reference: SavedCanvasItemReference) => { resolvedId: string | null },
): string | null {
  const fallback = reference.fallback;
  if (!fallback) {
    return null;
  }

  const relationshipKind = normalizeToken(fallback.relationshipKind);
  const relationshipLabel = normalizeToken(asString(fallback.metadata?.label));
  const fromResolution = fallback.fromStableKey
    ? resolveReferenceWithFallback(index, {
        targetType: 'ENTITY',
        stableKey: fallback.fromStableKey,
        originalSnapshotLocalId: null,
        fallback: isRecord(fallback.metadata?.fromEntityFallback) ? fallback.metadata?.fromEntityFallback as SavedCanvasItemReference['fallback'] : null,
      })
    : { resolvedId: null };
  const toResolution = fallback.toStableKey
    ? resolveReferenceWithFallback(index, {
        targetType: 'ENTITY',
        stableKey: fallback.toStableKey,
        originalSnapshotLocalId: null,
        fallback: isRecord(fallback.metadata?.toEntityFallback) ? fallback.metadata?.toEntityFallback as SavedCanvasItemReference['fallback'] : null,
      })
    : { resolvedId: null };

  if (!fromResolution.resolvedId || !toResolution.resolvedId) {
    return null;
  }

  return resolveSingleMatch(index.payload.relationships, (relationship) => {
    if (relationship.fromEntityId !== fromResolution.resolvedId || relationship.toEntityId !== toResolution.resolvedId) {
      return false;
    }
    if (relationshipKind && normalizeToken(relationship.kind) !== relationshipKind) {
      return false;
    }
    if (relationshipLabel) {
      const candidateLabel = normalizeToken(relationship.label);
      if (candidateLabel !== relationshipLabel) {
        return false;
      }
    }
    return true;
  });
}

function resolveRelationshipByKindLabelAndPath(index: BrowserSnapshotIndex, reference: SavedCanvasItemReference): string | null {
  const fallback = reference.fallback;
  if (!fallback) {
    return null;
  }
  const relationshipKind = normalizeToken(fallback.relationshipKind);
  const relationshipLabel = normalizeToken(asString(fallback.metadata?.label));
  const sourcePath = normalizeToken(asString(fallback.metadata?.sourcePath));

  if (!relationshipKind && !relationshipLabel && !sourcePath) {
    return null;
  }

  return resolveSingleMatch(index.payload.relationships, (relationship) => {
    if (relationshipKind && normalizeToken(relationship.kind) !== relationshipKind) {
      return false;
    }
    if (relationshipLabel && normalizeToken(relationship.label) !== relationshipLabel) {
      return false;
    }
    if (!sourcePath) {
      return true;
    }
    const relationshipSourcePath = normalizeToken(relationship.sourceRefs?.[0]?.path ?? null);
    return relationshipSourcePath === sourcePath;
  });
}

function resolveSingleMatch<T extends { externalId: string }>(items: readonly T[], predicate: (item: T) => boolean): string | null {
  const matches = items.filter(predicate);
  return matches.length === 1 ? matches[0]!.externalId : null;
}
