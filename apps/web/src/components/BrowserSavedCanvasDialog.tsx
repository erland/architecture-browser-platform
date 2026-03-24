import type { SavedCanvasLocalRecord } from '../savedCanvasLocalStore';

export type BrowserSavedCanvasDialogProps = {
  isOpen: boolean;
  draftName: string;
  onDraftNameChange: (value: string) => void;
  onClose: () => void;
  onSaveCurrentCanvas: () => void;
  records: SavedCanvasLocalRecord[];
  currentCanvasId: string | null;
  isBusy: boolean;
  statusMessage: string | null;
  selectedSnapshotId: string | null;
  onOpenCanvas: (canvasId: string) => void;
  onDeleteCanvas: (canvasId: string) => void;
  onRefresh: () => void;
};

function formatCanvasTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BrowserSavedCanvasDialog({
  isOpen,
  draftName,
  onDraftNameChange,
  onClose,
  onSaveCurrentCanvas,
  records,
  currentCanvasId,
  isBusy,
  statusMessage,
  selectedSnapshotId,
  onOpenCanvas,
  onDeleteCanvas,
  onRefresh,
}: BrowserSavedCanvasDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="browser-saved-canvas-dialog__backdrop" role="presentation" onClick={onClose}>
      <section
        className="card browser-saved-canvas-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Saved canvases"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="browser-saved-canvas-dialog__header">
          <div>
            <p className="eyebrow">Saved canvases</p>
            <h3>Save, reopen, and delete local canvases</h3>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </header>

        <div className="browser-saved-canvas-dialog__save-row">
          <label className="browser-saved-canvas-dialog__field">
            <span className="muted">Canvas name</span>
            <input
              type="text"
              value={draftName}
              onChange={(event) => onDraftNameChange(event.target.value)}
              placeholder="Saved canvas"
              disabled={isBusy}
            />
          </label>
          <button type="button" onClick={onSaveCurrentCanvas} disabled={isBusy || !draftName.trim()}>
            {currentCanvasId ? 'Save changes' : 'Save current canvas'}
          </button>
          <button type="button" className="button-secondary" onClick={onRefresh} disabled={isBusy}>Refresh</button>
        </div>

        {statusMessage ? <p className="browser-saved-canvas-dialog__status muted">{statusMessage}</p> : null}

        <div className="browser-saved-canvas-dialog__list" aria-label="Saved canvas list">
          {records.length === 0 ? (
            <p className="muted">No saved canvases yet for this source tree.</p>
          ) : (
            records.map((record) => {
              const isCurrent = currentCanvasId === record.canvasId;
              const isSelectedSnapshot = selectedSnapshotId !== null
                && (record.currentTargetSnapshotId === selectedSnapshotId || record.originSnapshotId === selectedSnapshotId);
              return (
                <article key={record.canvasId} className={`browser-saved-canvas-card ${isCurrent ? 'browser-saved-canvas-card--current' : ''}`}>
                  <div className="browser-saved-canvas-card__content">
                    <div className="browser-saved-canvas-card__title-row">
                      <h4>{record.name}</h4>
                      <div className="browser-saved-canvas-card__badges">
                        {isCurrent ? <span className="badge">Open</span> : null}
                        {isSelectedSnapshot ? <span className="badge">Current snapshot</span> : null}
                        <span className="badge">{record.syncState}</span>
                      </div>
                    </div>
                    <p className="muted">{record.snapshotKey} · Modified {formatCanvasTimestamp(record.lastModifiedAt)}</p>
                  </div>
                  <div className="browser-saved-canvas-card__actions">
                    <button type="button" className="button-secondary" onClick={() => onOpenCanvas(record.canvasId)} disabled={isBusy}>Open</button>
                    <button type="button" className="button-secondary" onClick={() => onDeleteCanvas(record.canvasId)} disabled={isBusy}>Delete</button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
