import { useMemo, useState } from 'react';
import { formatDateTime } from '../appModel';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useSnapshotCachePreload } from '../hooks/useSnapshotCachePreload';

type SnapshotsViewProps = {
  onOpenBrowser: () => void;
  onOpenCompare: () => void;
  onOpenLegacy: () => void;
  onOpenRepositories?: () => void;
};

function completenessBadgeClass(completenessStatus: string) {
  if (completenessStatus === 'COMPLETE') {
    return 'badge badge--status';
  }
  if (completenessStatus === 'PARTIAL') {
    return 'badge badge--warning';
  }
  return 'badge badge--danger';
}

export function SnapshotsView({ onOpenBrowser, onOpenCompare, onOpenLegacy, onOpenRepositories }: SnapshotsViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selection = useAppSelectionContext();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    setBusyMessage,
    setError,
  });

  const selectedSnapshot = workspaceData.snapshots.find((snapshot) => snapshot.id === selection.selectedSnapshotId) ?? null;
  const snapshotCache = useSnapshotCachePreload(workspaceData.selectedWorkspaceId, selectedSnapshot);
  const latestSnapshot = useMemo(
    () => [...workspaceData.snapshots].sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt))[0] ?? null,
    [workspaceData.snapshots],
  );

  return (
    <div className="content-stack">
      <section className="card section-intro">
        <p className="eyebrow">Snapshots</p>
        <h2>Dedicated snapshot catalog and selection flow</h2>
        <p className="lead">
          Step 12 strengthens the handoff into Browser and Compare. The selected snapshot is now treated as the explicit bridge between indexing and architecture exploration.
        </p>
      </section>

      {selectedSnapshot ? (
        <section className="card discoverability-callout">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recommended next step</p>
              <h2>Open the selected snapshot in Browser</h2>
            </div>
            <span className={completenessBadgeClass(selectedSnapshot.completenessStatus)}>{selectedSnapshot.completenessStatus}</span>
          </div>
          <p className="lead discoverability-callout__lead">
            You have already selected a snapshot. Continue into Browser for architecture exploration, or switch to Compare if you want to evaluate changes against another imported snapshot.
          </p>
          {snapshotCache.message ? (
            <p className={snapshotCache.status === 'error' ? 'error' : 'notice'}>{snapshotCache.message}</p>
          ) : null}
          <div className="discoverability-stats">
            <span className="badge">{selectedSnapshot.repositoryName ?? selectedSnapshot.repositoryKey ?? selectedSnapshot.repositoryRegistrationId}</span>
            <span className="badge">{selectedSnapshot.snapshotKey}</span>
            <span className="badge">{selectedSnapshot.entityCount} entities</span>
            <span className="badge">{selectedSnapshot.relationshipCount} relationships</span>
            <span className="badge">{selectedSnapshot.diagnosticCount} diagnostics</span>
          </div>
          <div className="actions actions--wrap">
            <button type="button" onClick={onOpenBrowser}>Open selected snapshot in Browser</button>
            <button type="button" className="button-secondary" onClick={onOpenCompare}>Compare this snapshot</button>
            <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current stacked browser</button>
          </div>
        </section>
      ) : latestSnapshot ? (
        <section className="card discoverability-callout discoverability-callout--subtle">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest imported snapshot</p>
              <h2>Select a snapshot to continue</h2>
            </div>
            <span className="badge">Ready for review</span>
          </div>
          <p className="muted">
            The most recently imported snapshot is <strong>{latestSnapshot.snapshotKey}</strong> from{' '}
            <strong>{latestSnapshot.repositoryName ?? latestSnapshot.repositoryKey ?? latestSnapshot.repositoryRegistrationId}</strong>. Select it below, then open Browser or Compare.
          </p>
        </section>
      ) : null}

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div><dt>Status</dt><dd>{workspaceData.health.status}</dd></div>
            <div><dt>Service</dt><dd>{workspaceData.health.service}</dd></div>
            <div><dt>Version</dt><dd>{workspaceData.health.version}</dd></div>
            <div><dt>Time</dt><dd>{workspaceData.health.time || '—'}</dd></div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <div className="section-heading">
            <h2>Active workspace context</h2>
            <span className="badge">Shared selection</span>
          </div>
          {workspaceData.selectedWorkspace ? (
            <>
              <dl className="kv kv--compact">
                <div><dt>Name</dt><dd>{workspaceData.selectedWorkspace.name}</dd></div>
                <div><dt>Key</dt><dd>{workspaceData.selectedWorkspace.workspaceKey}</dd></div>
                <div><dt>Status</dt><dd>{workspaceData.selectedWorkspace.status}</dd></div>
                <div><dt>Snapshots</dt><dd>{workspaceData.snapshots.length}</dd></div>
              </dl>
              <p className="muted">
                Choose a snapshot here, then continue to Browser or Compare. Browser is now the primary next step after indexing, while Compare remains the place to inspect differences between imports.
              </p>
            </>
          ) : (
            <p className="muted">No workspace selected yet. Use the Workspaces view first, then return here to choose a snapshot for browsing.</p>
          )}
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <h2>Snapshot catalog</h2>
          <span className="badge">{workspaceData.snapshots.length}</span>
        </div>
        {workspaceData.selectedWorkspace ? (
          <div className="split-grid split-grid--wide">
            <div className="stack stack--compact">
              {workspaceData.snapshots.map((snapshot) => {
                const isActive = snapshot.id === selection.selectedSnapshotId;
                return (
                  <button
                    key={snapshot.id}
                    type="button"
                    className={isActive ? 'list-item list-item--active' : 'list-item'}
                    onClick={() => selection.setSelectedSnapshotId(snapshot.id)}
                  >
                    <strong>{snapshot.repositoryName ?? snapshot.repositoryKey ?? snapshot.repositoryRegistrationId}</strong>
                    <span>{snapshot.snapshotKey}</span>
                    <span>{snapshot.sourceBranch ?? '—'} · {snapshot.sourceRevision ?? '—'}</span>
                    <span>{snapshot.completenessStatus} · {snapshot.importedAt ? formatDateTime(snapshot.importedAt) : '—'}</span>
                    <span>{snapshot.entityCount} entities · {snapshot.relationshipCount} relationships · {snapshot.diagnosticCount} diagnostics</span>
                  </button>
                );
              })}
              {!workspaceData.snapshots.length ? (
                <div className="empty-state-card card card--nested">
                  <h3>No snapshots imported yet</h3>
                  <p className="muted">Run indexing from Repositories first, then come back here to pick a snapshot for Browser.</p>
                  {onOpenRepositories ? (
                    <div className="actions">
                      <button type="button" onClick={onOpenRepositories}>Open Repositories</button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="stack stack--compact">
              {selectedSnapshot ? (
                <>
                  <article className="card card--nested">
                    <div className="section-heading">
                      <h3>Selected snapshot</h3>
                      <span className={completenessBadgeClass(selectedSnapshot.completenessStatus)}>{selectedSnapshot.completenessStatus}</span>
                    </div>
                    {snapshotCache.message ? (
                      <p className={snapshotCache.status === 'error' ? 'error' : 'notice'}>{snapshotCache.message}</p>
                    ) : null}
                    <dl className="kv kv--compact">
                      <div><dt>Repository</dt><dd>{selectedSnapshot.repositoryName ?? selectedSnapshot.repositoryKey ?? selectedSnapshot.repositoryRegistrationId}</dd></div>
                      <div><dt>Snapshot key</dt><dd>{selectedSnapshot.snapshotKey}</dd></div>
                      <div><dt>Imported</dt><dd>{selectedSnapshot.importedAt ? formatDateTime(selectedSnapshot.importedAt) : '—'}</dd></div>
                      <div><dt>Branch</dt><dd>{selectedSnapshot.sourceBranch ?? '—'}</dd></div>
                      <div><dt>Revision</dt><dd>{selectedSnapshot.sourceRevision ?? '—'}</dd></div>
                      <div><dt>Status</dt><dd>{selectedSnapshot.status}</dd></div>
                      <div><dt>Outcome</dt><dd>{selectedSnapshot.derivedRunOutcome}</dd></div>
                      <div><dt>Schema / indexer</dt><dd>{selectedSnapshot.schemaVersion} / {selectedSnapshot.indexerVersion}</dd></div>
                    </dl>
                  </article>

                  <article className="card card--nested">
                    <div className="section-heading">
                      <h3>Catalog summary</h3>
                      <span className="badge">Ready for next step</span>
                    </div>
                    <div className="split-grid split-grid--compact">
                      <div>
                        <p className="eyebrow">Coverage</p>
                        <p>{selectedSnapshot.indexedFileCount} indexed / {selectedSnapshot.totalFileCount} total files</p>
                        <p className="muted">{selectedSnapshot.degradedFileCount} degraded files</p>
                      </div>
                      <div>
                        <p className="eyebrow">Model size</p>
                        <p>{selectedSnapshot.scopeCount} scopes</p>
                        <p className="muted">{selectedSnapshot.entityCount} entities · {selectedSnapshot.relationshipCount} relationships</p>
                      </div>
                      <div>
                        <p className="eyebrow">Diagnostics</p>
                        <p>{selectedSnapshot.diagnosticCount} diagnostics</p>
                        <p className="muted">Useful for deciding whether to inspect this snapshot now or compare it later.</p>
                      </div>
                    </div>
                  </article>

                  <article className="card card--nested discoverability-actions-card">
                    <div className="section-heading">
                      <h3>Primary actions</h3>
                      <span className="badge">Step 12</span>
                    </div>
                    <p className="muted">
                      The selected snapshot is carried in shared app context. Browser uses it as the main exploration target, Compare uses it as the baseline snapshot, and the legacy route still shows the older stacked workflow.
                    </p>
                    <div className="actions actions--wrap">
                      <button type="button" onClick={onOpenBrowser}>Open selected snapshot in Browser</button>
                      <button type="button" className="button-secondary" onClick={onOpenCompare}>Compare selected snapshot</button>
                      <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current stacked browser</button>
                    </div>
                  </article>
                </>
              ) : (
                <p className="muted">Select a snapshot to inspect metadata and open the next workflow.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">Select a workspace to browse imported snapshots.</p>
        )}
      </section>
    </div>
  );
}
