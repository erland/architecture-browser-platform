import {
  type BrowserSnapshotIndex,
  searchBrowserSnapshotIndex,
} from './browserSnapshotIndex';

export function computeSearchResults(index: BrowserSnapshotIndex | null, query: string, scopeId: string | null) {
  if (!index || !query.trim()) {
    return [];
  }
  return searchBrowserSnapshotIndex(index, query, { scopeId, limit: 50 });
}
