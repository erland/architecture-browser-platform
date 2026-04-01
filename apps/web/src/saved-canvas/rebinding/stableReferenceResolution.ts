import type { BrowserSnapshotIndex } from '../../browserSnapshotIndex';
import type { SavedCanvasItemReference } from '../model/document';
import { exactResolutionRules } from './stableReferenceExactRules';
import { entityFallbackRules } from './stableReferenceEntityRules';
import { createRelationshipFallbackRules } from './stableReferenceRelationshipRules';
import { runResolutionRules } from './stableReferenceResolution.rules';
import { scopeFallbackRules } from './stableReferenceScopeRules';
import type { SavedCanvasReferenceResolution } from './stableReferenceShared';

export function resolveSavedCanvasReference(
  index: BrowserSnapshotIndex,
  reference: SavedCanvasItemReference,
): SavedCanvasReferenceResolution {
  return runResolutionRules(index, reference, exactResolutionRules);
}

export function resolveSavedCanvasReferenceWithFallback(
  index: BrowserSnapshotIndex,
  reference: SavedCanvasItemReference,
): SavedCanvasReferenceResolution {
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

const relationshipFallbackRules = createRelationshipFallbackRules(resolveSavedCanvasReferenceWithFallback);
