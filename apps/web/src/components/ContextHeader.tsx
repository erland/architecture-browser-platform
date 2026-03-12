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

function buildStatusExplanation(selectedSnapshot: SnapshotSummary | null, snapshotOverview: SnapshotOverview | null) {
  if (!selectedSnapshot) {
    return null;
  }

  const indexedFileCount = snapshotOverview?.completeness.indexedFileCount ?? selectedSnapshot.indexedFileCount;
  const totalFileCount = snapshotOverview?.completeness.totalFileCount ?? selectedSnapshot.totalFileCount;
  const degradedFileCount = snapshotOverview?.completeness.degradedFileCount ?? selectedSnapshot.degradedFileCount;
  const notes = snapshotOverview?.completeness.notes ?? [];
  const warnings = snapshotOverview?.warnings ?? [];
  const primaryMessage = notes[0] ?? warnings[0] ?? null;

  if (selectedSnapshot.completenessStatus === 'COMPLETE') {
    return {
      title: 'Snapshot fully imported',
      summary: `Indexed ${indexedFileCount} of ${totalFileCount} files with ${degradedFileCount} degraded files.`,
      details: primaryMessage ? [primaryMessage] : [],
    };
  }

  if (selectedSnapshot.completenessStatus === 'PARTIAL') {
    return {
      title: 'Partial snapshot explanation',
      summary: `Indexed ${indexedFileCount} of ${totalFileCount} files. ${degradedFileCount} files were degraded or omitted, so some browser results may be incomplete.`,
      details: [...notes, ...warnings].slice(0, 3),
    };
  }

  return {
    title: 'Snapshot import failed',
    summary: `This snapshot is not fully usable for browsing. Indexed ${indexedFileCount} of ${totalFileCount} files before the run failed.`,
    details: [...notes, ...warnings].slice(0, 3),
  };
}

type ContextHeaderProps = {
  selectedWorkspace: Workspace | null;
  repositoryLabel: string;
  selectedSnapshot: SnapshotSummary | null;
  snapshotOverview: SnapshotOverview | null;
};

export function ContextHeader({ selectedWorkspace, repositoryLabel, selectedSnapshot, snapshotOverview }: ContextHeaderProps) {
  const statusExplanation = buildStatusExplanation(selectedSnapshot, snapshotOverview);

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

      {statusExplanation ? (
        <article className="browser-status-explanation">
          <div className="section-heading section-heading--tight">
            <h3>{statusExplanation.title}</h3>
            <span className="badge">{selectedSnapshot?.diagnosticCount ?? 0} diagnostics</span>
          </div>
          <p>{statusExplanation.summary}</p>
          {statusExplanation.details.length ? (
            <ul className="browser-status-explanation__list">
              {statusExplanation.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ) : null}

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
