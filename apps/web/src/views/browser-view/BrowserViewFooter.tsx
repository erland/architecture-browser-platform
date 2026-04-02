type BrowserViewFooterProps = {
  repositoryLabel: string;
  activeModeLabel: string;
  selectedScopeLabel: string | null;
  activeViewpointLabel: string;
  selectedSnapshotLabel: string;
  selectedSnapshotImportedAt: string | null | undefined;
  hasPreparedSnapshot: boolean;
};

function formatFooterTimestamp(value: string | null | undefined) {
  if (!value) {
    return 'Captured —';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `Captured ${value}`;
  }

  return `Captured ${date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function BrowserViewFooter({
  repositoryLabel,
  activeModeLabel,
  selectedScopeLabel,
  activeViewpointLabel,
  selectedSnapshotLabel,
  selectedSnapshotImportedAt,
  hasPreparedSnapshot,
}: BrowserViewFooterProps) {
  return (
    <footer className="card browser-workspace__footer" aria-label="Current browser context">
      <p className="browser-workspace__lead muted">
        {repositoryLabel} · {activeModeLabel}
      </p>
      <div className="browser-workspace__context-strip">
        <span className="badge">Scope {selectedScopeLabel ?? 'Entire snapshot'}</span>
        <span className="badge">{activeViewpointLabel}</span>
        <span
          className="badge"
          title={selectedSnapshotLabel !== '—' ? `Snapshot ${selectedSnapshotLabel}` : undefined}
        >
          {formatFooterTimestamp(selectedSnapshotImportedAt)}
        </span>
        {hasPreparedSnapshot ? <span className="badge badge--status">Prepared locally</span> : null}
      </div>
    </footer>
  );
}
