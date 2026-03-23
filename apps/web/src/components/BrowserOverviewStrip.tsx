import { buildScopePath } from '../browserSnapshotIndex.aggregates';
import type { BrowserSessionState } from '../browserSessionStore';

export type BrowserOverviewMetric = {
  label: string;
  value: string;
};

export type BrowserOverviewCard = {
  key: string;
  title: string;
  detail: string;
  metrics: BrowserOverviewMetric[];
};

export function buildBrowserOverviewCards(state: BrowserSessionState): BrowserOverviewCard[] {
  const payload = state.payload;
  const index = state.index;
  if (!payload || !index) {
    return [];
  }

  const completeness = payload.completeness;
  const scope = state.selectedScopeId ? index.scopesById.get(state.selectedScopeId) ?? null : null;
  const scopePath = scope ? buildScopePath(scope, index.scopesById) : null;
  const snapshotCard: BrowserOverviewCard = {
    key: 'snapshot',
    title: completeness.status ?? payload.snapshot.completenessStatus ?? 'UNKNOWN',
    detail: payload.warnings[0] ?? payload.run.outcome ?? 'Snapshot ready',
    metrics: [
      {
        label: 'Files',
        value: `${completeness.indexedFileCount}/${completeness.totalFileCount} files`,
      },
      {
        label: 'Diagnostics',
        value: String(payload.diagnostics.length),
      },
    ],
  };

  const scopeCard: BrowserOverviewCard = {
    key: 'scope',
    title: scope?.displayName ?? scope?.name ?? 'Entire snapshot',
    detail: scopePath ?? 'Entire snapshot',
    metrics: scope
      ? [
          {
            label: 'Entities',
            value: String(index.entityIdsByScopeId.get(scope.externalId)?.length ?? 0),
          },
        ]
      : [
          {
            label: 'Scopes',
            value: String(payload.scopes.length),
          },
        ],
  };

  const analysisCard: BrowserOverviewCard = {
    key: 'analysis',
    title: state.searchQuery.trim() ? 'Search active' : 'Canvas ready',
    detail: state.searchQuery.trim() || 'No active search query',
    metrics: [
      {
        label: 'Search hits',
        value: String(state.searchResults.length),
      },
      {
        label: 'Selection',
        value: String(state.selectedEntityIds.length),
      },
    ],
  };

  return [snapshotCard, scopeCard, analysisCard];
}

export function BrowserOverviewStrip(_props: { state: BrowserSessionState }) {
  return null;
}
