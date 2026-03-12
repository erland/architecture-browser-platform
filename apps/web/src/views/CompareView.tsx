import { useMemo, useState } from 'react';
import { summarizeComparisonHeadline } from '../compareViewModel';
import { ComparisonPanel } from '../components/ComparisonPanel';
import { ContextHeader } from '../components/ContextHeader';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useCompareExplorer } from '../hooks/useCompareExplorer';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

function completenessBadgeClass(completenessStatus: string | null | undefined) {
  if (completenessStatus === 'COMPLETE') {
    return 'badge badge--status';
  }
  if (completenessStatus === 'PARTIAL') {
    return 'badge badge--warning';
  }
  if (completenessStatus === 'FAILED') {
    return 'badge badge--danger';
  }
  return 'badge';
}

type CompareViewProps = {
  onOpenSnapshots: () => void;
  onOpenBrowser: () => void;
  onOpenLegacy: () => void;
};

export function CompareView({ onOpenSnapshots, onOpenBrowser, onOpenLegacy }: CompareViewProps) {
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

  const compareExplorer = useCompareExplorer({
    selectedWorkspaceId: workspaceData.selectedWorkspaceId,
    snapshots: workspaceData.snapshots,
    selectedSnapshotId: selection.selectedSnapshotId,
    setSelectedSnapshotId: selection.setSelectedSnapshotId,
    feedback: { setError },
  });

  const selectedRepository = useMemo(() => {
    const bySelection = workspaceData.repositories.find((repository) => repository.id === selection.selectedRepositoryId);
    if (bySelection) {
      return bySelection;
    }
    if (!compareExplorer.selectedSnapshot) {
      return null;
    }
    return workspaceData.repositories.find((repository) => repository.id === compareExplorer.selectedSnapshot?.repositoryRegistrationId) ?? null;
  }, [workspaceData.repositories, selection.selectedRepositoryId, compareExplorer.selectedSnapshot]);

  const repositoryLabel = selectedRepository?.name
    ?? compareExplorer.selectedSnapshot?.repositoryName
    ?? compareExplorer.selectedSnapshot?.repositoryKey
    ?? compareExplorer.selectedSnapshot?.repositoryRegistrationId
    ?? '—';

  return (
    <div className="content-stack compare-view">
      <section className="card section-intro">
        <p className="eyebrow">Compare</p>
        <h2>Dedicated snapshot comparison view</h2>
        <p className="lead">
          Step 9 moves snapshot comparison out of the temporary stacked browser flow and into a dedicated route where the active snapshot becomes the baseline for change analysis.
        </p>
        <div className="actions actions--wrap">
          <button type="button" onClick={onOpenSnapshots}>Choose snapshots</button>
          <button type="button" className="button-secondary" onClick={onOpenBrowser}>Open Browser view</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open current workspace</button>
        </div>
      </section>

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
            <h2>Comparison route status</h2>
            <span className="badge">Step 9</span>
          </div>
          <p className="muted">
            Compare now has a dedicated route and dedicated orchestration. The baseline snapshot comes from shared app context, and the target snapshot is selected from the current workspace catalog.
          </p>
        </article>
      </section>

      <ContextHeader
        selectedWorkspace={workspaceData.selectedWorkspace}
        repositoryLabel={repositoryLabel}
        selectedSnapshot={compareExplorer.selectedSnapshot}
        snapshotOverview={null}
      />

      {!workspaceData.selectedWorkspace ? (
        <article className="card empty-state-card">
          <h2>No workspace selected</h2>
          <p className="muted">Choose a workspace first, then return here to compare snapshots from that workspace.</p>
          <div className="actions">
            <button type="button" onClick={onOpenSnapshots}>Open Snapshots</button>
          </div>
        </article>
      ) : !compareExplorer.selectedSnapshot ? (
        <article className="card empty-state-card">
          <h2>No baseline snapshot selected</h2>
          <p className="muted">Use the Snapshots view to choose the baseline snapshot you want to compare.</p>
          <div className="actions">
            <button type="button" onClick={onOpenSnapshots}>Open Snapshots</button>
            <button type="button" className="button-secondary" onClick={onOpenBrowser}>Open Browser</button>
          </div>
        </article>
      ) : (
        <>
          <section className="grid grid--top compare-summary-grid">
            <article className="card">
              <div className="section-heading">
                <h2>Baseline snapshot</h2>
                <span className={completenessBadgeClass(compareExplorer.selectedSnapshot.completenessStatus)}>
                  {compareExplorer.selectedSnapshot.completenessStatus}
                </span>
              </div>
              <dl className="kv kv--compact">
                <div><dt>Repository</dt><dd>{repositoryLabel}</dd></div>
                <div><dt>Snapshot key</dt><dd>{compareExplorer.selectedSnapshot.snapshotKey}</dd></div>
                <div><dt>Branch</dt><dd>{compareExplorer.selectedSnapshot.sourceBranch ?? '—'}</dd></div>
                <div><dt>Revision</dt><dd>{compareExplorer.selectedSnapshot.sourceRevision ?? '—'}</dd></div>
                <div><dt>Imported</dt><dd>{compareExplorer.selectedSnapshot.importedAt || '—'}</dd></div>
              </dl>
            </article>

            <article className="card">
              <div className="section-heading">
                <h2>Comparison guidance</h2>
                <span className="badge">Focused workflow</span>
              </div>
              <p className="muted compare-guidance">
                Pick a target snapshot from the same workspace to compare model deltas, changed dependencies, and entry-point changes without the rest of the stacked workspace page competing for screen space.
              </p>
              {compareExplorer.snapshotComparison ? (
                <p>
                  <strong>{summarizeComparisonHeadline(compareExplorer.snapshotComparison.summary)}</strong>
                </p>
              ) : (
                <p className="muted">Select a target snapshot below to load the comparison summary.</p>
              )}
            </article>
          </section>

          <ComparisonPanel
            comparisonSnapshotId={compareExplorer.comparisonSnapshotId}
            setComparisonSnapshotId={compareExplorer.setComparisonSnapshotId}
            comparisonOptions={compareExplorer.comparisonOptions}
            snapshotComparison={compareExplorer.snapshotComparison}
          />
        </>
      )}
    </div>
  );
}
