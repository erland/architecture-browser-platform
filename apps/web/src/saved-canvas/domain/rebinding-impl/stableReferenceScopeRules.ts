import type { BrowserSnapshotIndex } from '../../../browser-snapshot';
import type { SavedCanvasItemReference } from '../model/document';
import { classifyScopeCategory, deriveScopePath, normalizeToken } from './stableReferenceShared';
import type { StableReferenceResolutionRule } from './stableReferenceResolution.rules';

export const scopeFallbackRules: StableReferenceResolutionRule[] = [
  {
    strategy: 'FALLBACK_SCOPE_PATH',
    resolve: (index, reference) => resolveScopeByNormalizedPath(index, reference),
  },
  {
    strategy: 'FALLBACK_SCOPE_NAME',
    resolve: (index, reference) => resolveScopeByNameAndCategory(index, reference),
  },
];

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

function resolveSingleMatch<T extends { externalId: string }>(items: readonly T[], predicate: (item: T) => boolean): string | null {
  const matches = items.filter(predicate);
  return matches.length === 1 ? matches[0]!.externalId : null;
}
