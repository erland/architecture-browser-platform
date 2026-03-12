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
      toneClassName: 'browser-context-status browser-context-status--ok',
      summary: `Complete import · ${indexedFileCount}/${totalFileCount} files indexed`,
      detail: degradedFileCount > 0 ? `${degradedFileCount} degraded files` : primaryMessage,
    };
  }

  if (selectedSnapshot.completenessStatus === 'PARTIAL') {
    return {
      toneClassName: 'browser-context-status browser-context-status--warning',
      summary: `Partial import · ${indexedFileCount}/${totalFileCount} files indexed`,
      detail: primaryMessage ?? `${degradedFileCount} degraded or omitted files may affect browser results.`,
    };
  }

  return {
    toneClassName: 'browser-context-status browser-context-status--danger',
    summary: `Import failed · ${indexedFileCount}/${totalFileCount} files indexed`,
    detail: primaryMessage ?? 'This snapshot is not fully usable for browsing.',
  };
}

type ContextHeaderProps = {
  selectedWorkspace: Workspace | null;
  repositoryLabel: string;
  selectedSnapshot: SnapshotSummary | null;
  snapshotOverview: SnapshotOverview | null;
  onOpenWorkspaces?: () => void;
  onOpenRepositories?: () => void;
  onOpenSnapshots?: () => void;
};

export function ContextHeader({
  selectedWorkspace,
  repositoryLabel,
  selectedSnapshot,
  snapshotOverview,
  onOpenWorkspaces,
  onOpenRepositories,
  onOpenSnapshots,
}: ContextHeaderProps) {
  const statusExplanation = buildStatusExplanation(selectedSnapshot, snapshotOverview);

  return (
    <section className="card browser-context-header browser-context-header--compact">
      <div className="browser-context-header__top browser-context-header__top--compact">
        <div>
          <p className="eyebrow">Current context</p>
          <h2>Browse this snapshot</h2>
          <p className="muted browser-context-header__lead">Use the selectors below to switch context. The left rail is meant to help you move between views, not to summarize the whole snapshot.</p>
        </div>
      </div>

      <div className="browser-context-switchers" aria-label="Current browser context">
        <div className="browser-context-switcher-row">
          <div>
            <span className="browser-context-switcher-row__label">Workspace</span>
            <strong className="browser-context-switcher-row__value">{selectedWorkspace?.name ?? '—'}</strong>
          </div>
          {onOpenWorkspaces ? (
            <button type="button" className="button-secondary browser-context-switcher-row__action" onClick={onOpenWorkspaces}>
              Change
            </button>
          ) : null}
        </div>

        <div className="browser-context-switcher-row">
          <div>
            <span className="browser-context-switcher-row__label">Repository</span>
            <strong className="browser-context-switcher-row__value">{repositoryLabel || '—'}</strong>
          </div>
          {onOpenRepositories ? (
            <button type="button" className="button-secondary browser-context-switcher-row__action" onClick={onOpenRepositories}>
              Change
            </button>
          ) : null}
        </div>

        <div className="browser-context-switcher-row">
          <div>
            <span className="browser-context-switcher-row__label">Snapshot</span>
            <strong className="browser-context-switcher-row__value">{selectedSnapshot?.snapshotKey ?? '—'}</strong>
            <span className="browser-context-switcher-row__meta">{selectedSnapshot?.sourceBranch ?? snapshotOverview?.source.branch ?? 'No branch recorded'}</span>
          </div>
          {onOpenSnapshots ? (
            <button type="button" className="button-secondary browser-context-switcher-row__action" onClick={onOpenSnapshots}>
              Change
            </button>
          ) : null}
        </div>
      </div>

      <div className="browser-context-header__badges">
        <span className={outcomeBadgeClass(selectedSnapshot?.completenessStatus)}>
          {selectedSnapshot?.completenessStatus ?? 'No snapshot'}
        </span>
        <span className={outcomeBadgeClass(selectedSnapshot?.derivedRunOutcome)}>
          Run {selectedSnapshot?.derivedRunOutcome ?? '—'}
        </span>
      </div>

      {statusExplanation ? (
        <div className={statusExplanation.toneClassName}>
          <strong>{statusExplanation.summary}</strong>
          {statusExplanation.detail ? <span>{statusExplanation.detail}</span> : null}
        </div>
      ) : null}
    </section>
  );
}
