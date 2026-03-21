import type { BrowserSearchDocument, BrowserSearchResult, BrowserSnapshotIndex } from './browserSnapshotIndex.types';
import { isScopeWithin, normalizeSearchText } from './browserSnapshotIndex.shared';

function scoreSearchDocument(document: BrowserSearchDocument, query: string) {
  const title = normalizeSearchText(document.title);
  const subtitle = normalizeSearchText(document.subtitle);
  const text = document.normalizedText;
  if (title === query) return 100;
  if (title.startsWith(query)) return 90;
  if (title.includes(query)) return 75;
  if (subtitle.includes(query)) return 50;
  if (text.includes(query)) return 25;
  return 0;
}

export function searchBrowserSnapshotIndex(index: BrowserSnapshotIndex, query: string, options?: { scopeId?: string | null; limit?: number }) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  const matches = index.searchableDocuments
    .filter((document) => document.normalizedText.includes(normalizedQuery))
    .filter((document) => isScopeWithin(index, options?.scopeId ?? null, document.scopeId))
    .map<BrowserSearchResult>((document) => ({ kind: document.kind, id: document.id, title: document.title, subtitle: document.subtitle, scopeId: document.scopeId, score: scoreSearchDocument(document, normalizedQuery) }))
    .sort((left, right) => right.score !== left.score ? right.score - left.score : left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }));
  return typeof options?.limit === 'number' ? matches.slice(0, options.limit) : matches;
}
