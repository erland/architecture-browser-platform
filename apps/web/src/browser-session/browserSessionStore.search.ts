import {
  type BrowserSnapshotIndex,
  searchBrowserSnapshotIndex,
} from '../browser-snapshot';

export function computeSearchResults(index: BrowserSnapshotIndex | null, query: string, scopeId: string | null) {
  if (!index || !query.trim()) {
    return [];
  }
  return searchBrowserSnapshotIndex(index, query, { scopeId, limit: 50 });
}
