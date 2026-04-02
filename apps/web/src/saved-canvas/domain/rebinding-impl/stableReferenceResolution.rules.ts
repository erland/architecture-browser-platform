import type { BrowserSnapshotIndex } from '../../../browser-snapshot';
import type { SavedCanvasItemReference } from '../model/document';
import type { SavedCanvasReferenceResolutionStrategy } from './stableReferenceShared';

export type StableReferenceResolutionRule = {
  strategy: SavedCanvasReferenceResolutionStrategy;
  resolve: (index: BrowserSnapshotIndex, reference: SavedCanvasItemReference) => string | null;
};

export function runResolutionRules(
  index: BrowserSnapshotIndex,
  reference: SavedCanvasItemReference,
  rules: StableReferenceResolutionRule[],
) {
  for (const rule of rules) {
    const resolvedId = rule.resolve(index, reference);
    if (resolvedId) {
      return { resolvedId, strategy: rule.strategy } as const;
    }
  }
  return { resolvedId: null, strategy: 'UNRESOLVED' as const };
}
