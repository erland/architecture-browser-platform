import type { SavedCanvasLocalRecord } from '../saved-canvas/storage';
import type { SavedCanvasRebindingUiSummary } from '../saved-canvas/rebinding';
import type { SavedCanvasOfflineAvailabilitySummary } from '../saved-canvas/opening';

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
  selectedSnapshotLabel: string | null;
  pendingSyncCount: number;
  currentCanvasHasLocalEdits: boolean;
  rebindingCanvasId: string | null;
  rebindingSummary: SavedCanvasRebindingUiSummary | null;
  isOffline: boolean;
  availabilityByCanvasId: Record<string, SavedCanvasOfflineAvailabilitySummary | undefined>;
  onOpenOriginalCanvas: (canvasId: string) => void;
  onOpenCurrentCanvas: (canvasId: string) => void;
  onOpenSelectedCanvas: (canvasId: string) => void;
  onDeleteCanvas: (canvasId: string) => void;
  onRefresh: () => void;
  onSyncNow: () => void;
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


function renderOfflineStatus(
  availability: SavedCanvasOfflineAvailabilitySummary | undefined,
  selectedSnapshotLabel: string | null,
) {
  if (!availability) {
    return null;
  }

  const selectedLabel = selectedSnapshotLabel ?? availability.selected?.snapshotLabel ?? 'selected';

  return (
    <div className="browser-saved-canvas-card__availability muted">
      <span>Original: {availability.origin.availableOffline ? 'offline ready' : 'not cached'}</span>
      {availability.currentTarget && availability.currentTarget.snapshotId !== availability.origin.snapshotId ? (
        <span> · Current: {availability.currentTarget.availableOffline ? 'offline ready' : 'not cached'}</span>
      ) : null}
      {availability.selected ? (
        <span> · Selected ({selectedLabel}): {availability.selected.availableOffline ? 'offline ready' : 'not cached'}</span>
      ) : null}
    </div>
  );
}

function renderUnresolvedList(title: string, values: string[]) {
  if (values.length === 0) {
    return null;
  }
  return (
    <div className="browser-saved-canvas-dialog__unresolved-group">
      <p className="muted">{title}</p>
      <ul className="browser-saved-canvas-dialog__unresolved-list">
        {values.map((value) => <li key={value}><code>{value}</code></li>)}
      </ul>
    </div>
  );
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
  selectedSnapshotLabel,
  pendingSyncCount,
  currentCanvasHasLocalEdits,
  rebindingCanvasId,
  rebindingSummary,
  isOffline,
  availabilityByCanvasId,
  onOpenOriginalCanvas,
  onOpenCurrentCanvas,
  onOpenSelectedCanvas,
  onDeleteCanvas,
  onRefresh,
  onSyncNow,
}: BrowserSavedCanvasDialogProps) {
  if (!isOpen) {
    return null;
  }

  const rebindingRecord = rebindingCanvasId ? records.find((record) => record.canvasId === rebindingCanvasId) ?? null : null;

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
            <h3>Save, reopen, delete, and review sync-safe canvases</h3>
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
            {currentCanvasId ? (currentCanvasHasLocalEdits ? 'Save changes' : 'Save current canvas') : 'Save current canvas'}
          </button>
          <button type="button" className="button-secondary" onClick={onSyncNow} disabled={isBusy || pendingSyncCount === 0}>
            Sync pending{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ''}
          </button>
          <button type="button" className="button-secondary" onClick={onRefresh} disabled={isBusy}>Refresh</button>
        </div>

        {statusMessage ? <p className="browser-saved-canvas-dialog__status muted">{statusMessage}</p> : null}
        {currentCanvasId && currentCanvasHasLocalEdits ? <p className="browser-saved-canvas-dialog__status muted">This opened saved canvas has local unsaved edits.</p> : null}
        {isOffline ? <p className="browser-saved-canvas-dialog__status muted">Offline mode: only snapshots already cached locally can be opened.</p> : null}

        {rebindingSummary ? (
          <section className="browser-saved-canvas-dialog__rebinding card" aria-label="Latest rebinding result">
            <div className="browser-saved-canvas-dialog__rebinding-header">
              <div>
                <p className="eyebrow">Latest remap result</p>
                <h4>{rebindingRecord?.name ?? (rebindingCanvasId ? `Canvas ${rebindingCanvasId}` : 'Selected saved canvas')}</h4>
              </div>
              <div className="browser-saved-canvas-card__badges">
                <span className="badge">{rebindingSummary.rebindingState}</span>
                <span className="badge">{rebindingSummary.exactMatchCount} exact</span>
                <span className="badge">{rebindingSummary.remappedCount} fallback</span>
                <span className="badge">{rebindingSummary.unresolvedCount} unresolved</span>
              </div>
            </div>
            {rebindingSummary.unresolvedCount > 0 ? (
              <div className="browser-saved-canvas-dialog__unresolved">
                <p className="muted">These items could not be rebound to the selected snapshot and were left out when the canvas was opened.</p>
                {renderUnresolvedList('Unresolved nodes', rebindingSummary.unresolvedNodeIds)}
                {renderUnresolvedList('Unresolved edges', rebindingSummary.unresolvedEdgeIds)}
              </div>
            ) : (
              <p className="muted">All saved canvas items rebound cleanly to the selected snapshot.</p>
            )}
          </section>
        ) : null}

        <div className="browser-saved-canvas-dialog__list" aria-label="Saved canvas list">
          {records.length === 0 ? (
            <p className="muted">No saved canvases yet for this source tree.</p>
          ) : (
            records.map((record) => {
              const isCurrent = currentCanvasId === record.canvasId;
              const isSelectedSnapshot = selectedSnapshotId !== null
                && (record.currentTargetSnapshotId === selectedSnapshotId || record.originSnapshotId === selectedSnapshotId);
              const availability = availabilityByCanvasId[record.canvasId];
              const openOriginalDisabled = isBusy || (isOffline && !(availability?.origin.availableOffline));
              const openCurrentDisabled = isBusy || (isOffline && record.currentTargetSnapshotId !== null && !(availability?.currentTarget?.availableOffline));
              const openSelectedDisabled = isBusy || (isOffline && selectedSnapshotId !== null && !(availability?.selected?.availableOffline));
              return (
                <article key={record.canvasId} className={`browser-saved-canvas-card ${isCurrent ? 'browser-saved-canvas-card--current' : ''}`}>
                  <div className="browser-saved-canvas-card__content">
                    <div className="browser-saved-canvas-card__title-row">
                      <h4>{record.name}</h4>
                      <div className="browser-saved-canvas-card__badges">
                        {isCurrent ? <span className="badge">Open</span> : null}
                        {isCurrent && currentCanvasHasLocalEdits ? <span className="badge">Unsaved edits</span> : null}
                        {isSelectedSnapshot ? <span className="badge">Current snapshot</span> : null}
                        <span className="badge">{record.syncState}</span>
                      </div>
                    </div>
                    <p className="muted">{record.snapshotKey} · Modified {formatCanvasTimestamp(record.lastModifiedAt)}{record.lastSyncedAt ? ` · Synced ${formatCanvasTimestamp(record.lastSyncedAt)}` : ''}</p>
                    {renderOfflineStatus(availability, selectedSnapshotLabel)}
                    {record.document.sync.conflict ? <p className="muted">Conflict: {record.document.sync.conflict.message}</p> : null}
                    {rebindingCanvasId === record.canvasId && rebindingSummary ? (
                      <div className="browser-saved-canvas-card__rebinding muted">
                        Rebinding {rebindingSummary.rebindingState.toLowerCase()} · {rebindingSummary.exactMatchCount} exact · {rebindingSummary.remappedCount} fallback · {rebindingSummary.unresolvedCount} unresolved
                      </div>
                    ) : null}
                  </div>
                  <div className="browser-saved-canvas-card__actions">
                    <button type="button" className="button-secondary" onClick={() => onOpenOriginalCanvas(record.canvasId)} disabled={openOriginalDisabled}>Open original</button>
                    {record.currentTargetSnapshotId && record.currentTargetSnapshotId !== record.originSnapshotId ? (
                      <button type="button" className="button-secondary" onClick={() => onOpenCurrentCanvas(record.canvasId)} disabled={openCurrentDisabled}>Open current</button>
                    ) : null}
                    {selectedSnapshotId && selectedSnapshotId !== record.originSnapshotId && selectedSnapshotId !== record.currentTargetSnapshotId ? (
                      <button type="button" className="button-secondary" onClick={() => onOpenSelectedCanvas(record.canvasId)} disabled={openSelectedDisabled}>Open selected{selectedSnapshotLabel ? ` (${selectedSnapshotLabel})` : ''}</button>
                    ) : null}
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
