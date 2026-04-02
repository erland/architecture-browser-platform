import type { BrowserSnapshotIndex } from '../../../browser-snapshot';
import type { SavedCanvasItemReference } from '../model/document';
import {
  buildStableEntityKey,
  buildStableRelationshipKey,
  buildStableScopeKey,
} from './stableReferenceKeys';
import type { SavedCanvasStableReferenceLookup } from './stableReferenceShared';

const stableReferenceLookupCache = new WeakMap<BrowserSnapshotIndex, SavedCanvasStableReferenceLookup>();

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
