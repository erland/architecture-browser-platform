import { getScopeFacts } from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';

export type BrowserOverviewMetric = {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export type BrowserOverviewCard = {
  key: string;
  eyebrow: string;
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

  const warnings = payload.warnings.length + payload.completeness.notes.length;
  const completenessStatus = payload.completeness.status ?? payload.snapshot.completenessStatus ?? 'UNKNOWN';
  const selectedScopeFacts = state.selectedScopeId ? getScopeFacts(index, state.selectedScopeId) : null;
  const selectedScopePath = state.selectedScopeId
    ? index.scopePathById.get(state.selectedScopeId) ?? state.selectedScopeId
    : null;
  const searchScopePath = state.searchScopeId
    ? index.scopePathById.get(state.searchScopeId) ?? state.searchScopeId
    : null;

  return [
    {
      key: 'snapshot-health',
      eyebrow: 'Snapshot health',
      title: completenessStatus,
      detail: payload.run.outcome
        ? `Run outcome ${payload.run.outcome}`
        : 'Run outcome not recorded',
      metrics: [
        {
          label: 'Coverage',
          value: `${payload.completeness.indexedFileCount}/${payload.completeness.totalFileCount || 0} files`,
          tone: payload.completeness.degradedFileCount > 0 ? 'warning' : 'success',
        },
        {
          label: 'Diagnostics',
          value: String(payload.diagnostics.length),
          tone: payload.diagnostics.some((diagnostic) => diagnostic.fatal) ? 'danger' : payload.diagnostics.length > 0 ? 'warning' : 'success',
        },
        {
          label: 'Warnings',
          value: String(warnings),
          tone: warnings > 0 ? 'warning' : 'success',
        },
      ],
    },
    {
      key: 'scope-context',
      eyebrow: 'Scope context',
      title: selectedScopeFacts?.scope.displayName?.trim() || selectedScopeFacts?.scope.name || 'No scope selected',
      detail: selectedScopePath ?? 'Choose a scope in the left tree to narrow analysis.',
      metrics: selectedScopeFacts ? [
        { label: 'Child scopes', value: String(selectedScopeFacts.childScopeIds.length) },
        { label: 'Direct entities', value: String(selectedScopeFacts.entityIds.length) },
        { label: 'Subtree entities', value: String(selectedScopeFacts.descendantEntityCount) },
      ] : [
        { label: 'Scopes', value: String(payload.scopes.length) },
        { label: 'Entities', value: String(payload.entities.length) },
        { label: 'Relationships', value: String(payload.relationships.length) },
      ],
    },
    {
      key: 'analysis-state',
      eyebrow: 'Analysis state',
      title: state.focusedElement ? `${state.focusedElement.kind}:${state.focusedElement.id}` : 'No focused element',
      detail: state.searchQuery.trim()
        ? `Search “${state.searchQuery}” in ${searchScopePath ?? 'entire snapshot'}`
        : 'Use the top search, canvas, or tree to drive local analysis.',
      metrics: [
        { label: 'Canvas nodes', value: String(state.canvasNodes.length) },
        { label: 'Canvas edges', value: String(state.canvasEdges.length) },
        { label: 'Search hits', value: String(state.searchResults.length) },
      ],
    },
  ];
}

export function BrowserOverviewStrip({ state }: { state: BrowserSessionState }) {
  const cards = buildBrowserOverviewCards(state);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="browser-overview-strip" aria-label="Compact browser overview">
      {cards.map((card) => (
        <article key={card.key} className="card browser-overview-strip__card">
          <p className="eyebrow">{card.eyebrow}</p>
          <h4>{card.title}</h4>
          <p className="muted browser-overview-strip__detail">{card.detail}</p>
          <div className="browser-overview-strip__metrics">
            {card.metrics.map((metric) => (
              <div key={`${card.key}:${metric.label}`} className={[
                'browser-overview-strip__metric',
                metric.tone ? `browser-overview-strip__metric--${metric.tone}` : '',
              ].filter(Boolean).join(' ')}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
