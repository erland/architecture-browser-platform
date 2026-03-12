import type { SnapshotOverview, SnapshotSummary, Workspace } from '../appModel';

function outcomeBadgeClass(value: string | null | undefined) {
  if (!value) {
    return 'badge';
  }
  if (value === 'SUCCESS' || value === 'COMPLETE') {
    return 'badge badge--status';
  }
  if (value === 'PARTIAL') {
    return 'badge badge--warning';
  }
  return 'badge badge--danger';
}

type ContextHeaderProps = {
  selectedWorkspace: Workspace | null;
  repositoryLabel: string;
  selectedSnapshot: SnapshotSummary | null;
  snapshotOverview: SnapshotOverview | null;
};

export function ContextHeader({ selectedWorkspace, repositoryLabel, selectedSnapshot, snapshotOverview }: ContextHeaderProps) {
  return (
    <section className="card browser-context-header">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Browser context</p>
          <h2>Focused architecture browsing</h2>
        </div>
        <div className="browser-context-header__badges">
          <span className={outcomeBadgeClass(selectedSnapshot?.completenessStatus)}>
            {selectedSnapshot?.completenessStatus ?? 'No snapshot'}
          </span>
          <span className={outcomeBadgeClass(selectedSnapshot?.derivedRunOutcome)}>
            Run {selectedSnapshot?.derivedRunOutcome ?? '—'}
          </span>
        </div>
      </div>

      <div className="browser-context-grid">
        <article className="card card--nested">
          <h3>Workspace</h3>
          <p><strong>{selectedWorkspace?.name ?? '—'}</strong></p>
          <p className="muted">{selectedWorkspace?.workspaceKey ?? 'No workspace selected'}</p>
        </article>
        <article className="card card--nested">
          <h3>Repository</h3>
          <p><strong>{repositoryLabel || '—'}</strong></p>
          <p className="muted">Source for the selected snapshot</p>
        </article>
        <article className="card card--nested">
          <h3>Snapshot</h3>
          <p><strong>{selectedSnapshot?.snapshotKey ?? '—'}</strong></p>
          <p className="muted">{selectedSnapshot?.schemaVersion ? `Schema ${selectedSnapshot.schemaVersion}` : 'No snapshot selected'}</p>
        </article>
        <article className="card card--nested">
          <h3>Branch and revision</h3>
          <p><strong>{selectedSnapshot?.sourceBranch ?? snapshotOverview?.source.branch ?? '—'}</strong></p>
          <p className="muted">{selectedSnapshot?.sourceRevision ?? snapshotOverview?.source.revision ?? '—'}</p>
        </article>
      </div>
    </section>
  );
}
