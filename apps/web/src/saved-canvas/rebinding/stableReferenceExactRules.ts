import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import type { SavedCanvasItemReference } from '../model/document';
import { resolveSavedCanvasReferenceIdByStableKey } from './stableReferenceLookup';
import type { StableReferenceResolutionRule } from './stableReferenceResolution.rules';

export const exactResolutionRules: StableReferenceResolutionRule[] = [
  {
    strategy: 'DIRECT_ID',
    resolve: (index, reference) => resolveReferenceByDirectId(index, reference),
  },
  {
    strategy: 'EXACT_STABLE_KEY',
    resolve: (index, reference) => resolveSavedCanvasReferenceIdByStableKey(index, reference),
  },
];

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
