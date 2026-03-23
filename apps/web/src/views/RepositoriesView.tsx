import { useMemo, useState } from 'react';
import type { Repository, SnapshotSummary, StubRunResult } from '../appModel';
import { formatDateTime } from '../appModel';
import { RepositoryManagementSection } from '../components/RepositoryManagementSection';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useBrowserSnapshotPreparation } from '../hooks/useBrowserSnapshotPreparation';

type RunCompletionState = {
  requestedResult: StubRunResult;
  snapshot: SnapshotSummary | null;
} | null;

function latestWorkspaceSnapshotLabel(snapshot: SnapshotSummary | null) {
  if (!snapshot) {
    return 'No snapshot selected yet';
  }
  const repositoryLabel = snapshot.repositoryName ?? snapshot.repositoryKey ?? snapshot.repositoryRegistrationId;
  return `${repositoryLabel} · ${snapshot.snapshotKey}`;
}

type RepositoriesViewProps = {
  onOpenBrowser: () => void;
  onOpenSnapshots: () => void;
};

export function RepositoriesView({ onOpenBrowser, onOpenSnapshots }: RepositoriesViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runCompletion, setRunCompletion] = useState<RunCompletionState>(null);
  const [openingBrowser, setOpeningBrowser] = useState(false);
  const selection = useAppSelectionContext();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    setBusyMessage,
    setError,
  });

  const latestWorkspaceSnapshot = useMemo(
    () => [...workspaceData.snapshots].sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt))[0] ?? null,
    [workspaceData.snapshots],
  );

  const browserPreparation = useBrowserSnapshotPreparation({
    workspaceId: workspaceData.selectedWorkspaceId,
    snapshot: runCompletion?.snapshot ?? latestWorkspaceSnapshot,
    autoPrepare: false,
  });

  async function handleOpenBrowserPrepared() {
    const targetSnapshot = runCompletion?.snapshot ?? latestWorkspaceSnapshot;
    if (!targetSnapshot || openingBrowser) {
      return;
    }
    selection.setSelectedSnapshotId(targetSnapshot.id);
    setOpeningBrowser(true);
    try {
      const prepared = browserPreparation.isReady ? true : await browserPreparation.prepareSnapshot();
      if (prepared) {
        onOpenBrowser();
      }
    } finally {
      setOpeningBrowser(false);
    }
  }

  async function handleRepositoryRun(repository: Repository, requestedResult: StubRunResult) {
    const latestSnapshot = await workspaceData.handleRequestRun(repository, requestedResult);
    if (latestSnapshot) {
      selection.setSelectedSnapshotId(latestSnapshot.id);
    }
    setRunCompletion({
      requestedResult,
      snapshot: latestSnapshot,
    });
  }

  return (
    <div className="content-stack">
      <section className="card section-intro">
        <p className="eyebrow">Source trees</p>
        <h2>Source tree registration and indexing flow</h2>
        <p className="lead">
          Register source trees and trigger indexing here. After a successful run, the newest indexed version is called out so you can jump straight into Browser instead of searching for the next step.
        </p>
      </section>

      {runCompletion ? (
        <section className="card discoverability-callout">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Next step after indexing</p>
              <h2>{runCompletion.requestedResult === 'SUCCESS' ? 'Open the newest indexed version in Browser' : 'Run completed without a ready indexed version'}</h2>
            </div>
            <span className={runCompletion.snapshot ? 'badge badge--status' : 'badge badge--warning'}>
              {runCompletion.snapshot ? 'Indexed version ready' : runCompletion.requestedResult}
            </span>
          </div>
          {runCompletion.snapshot ? (
            <>
              <p className="lead discoverability-callout__lead">
                The latest indexed version for this source tree is now selected in shared app context. Open Browser to continue with architecture exploration, or go to Indexed versions if you want to inspect metadata first.
              </p>
              <dl className="kv kv--compact discoverability-kv">
                <div><dt>Indexed version</dt><dd>{latestWorkspaceSnapshotLabel(runCompletion.snapshot)}</dd></div>
                <div><dt>Imported</dt><dd>{formatDateTime(runCompletion.snapshot.importedAt)}</dd></div>
                <div><dt>Status</dt><dd>{runCompletion.snapshot.completenessStatus} · {runCompletion.snapshot.derivedRunOutcome}</dd></div>
              </dl>
              {browserPreparation.message ? (
                <p className={browserPreparation.status === 'failed' ? 'error' : 'notice'}>{browserPreparation.message}</p>
              ) : null}
              <div className="actions actions--wrap">
                <button
                  type="button"
                  onClick={() => { void handleOpenBrowserPrepared(); }}
                  disabled={openingBrowser || browserPreparation.status === 'downloading' || browserPreparation.status === 'preparing'}
                >
                  {openingBrowser
                    ? 'Preparing Browser…'
                    : browserPreparation.isReady
                      ? 'Open latest indexed version in Browser'
                      : browserPreparation.status === 'failed'
                        ? 'Retry Browser preparation'
                        : 'Prepare and open Browser'}
                </button>
                <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Review indexed versions</button>
              </div>
            </>
          ) : (
            <p className="muted">
              This run did not produce a ready indexed version to open directly. Review the latest run status below, then use Indexed versions once a successful import has completed.
            </p>
          )}
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
                <div><dt>Source trees</dt><dd>{workspaceData.repositories.length}</dd></div>
                <div><dt>Latest indexed version</dt><dd>{latestWorkspaceSnapshotLabel(latestWorkspaceSnapshot)}</dd></div>
              </dl>
              <p className="muted">
                Source tree registration and indexing requests are handled here for the selected workspace. The newest indexed version becomes the clearest handoff into Indexed versions and Browser.
              </p>
            </>
          ) : (
            <p className="muted">No workspace selected yet. Use Workspace context first, then return here to manage source trees and trigger indexing runs.</p>
          )}
        </article>
      </section>

      <RepositoryManagementSection
        selectedWorkspace={workspaceData.selectedWorkspace}
        repositories={workspaceData.repositories}
        repositoryForm={workspaceData.repositoryForm}
        setRepositoryForm={workspaceData.setRepositoryForm}
        handleCreateRepository={workspaceData.handleCreateRepository}
        repositoryEditor={workspaceData.repositoryEditor}
        setRepositoryEditor={workspaceData.setRepositoryEditor}
        handleUpdateRepository={workspaceData.handleUpdateRepository}
        runRequestForm={workspaceData.runRequestForm}
        setRunRequestForm={workspaceData.setRunRequestForm}
        latestRunByRepository={workspaceData.latestRunByRepository}
        selectRepositoryForEdit={workspaceData.selectRepositoryForEdit}
        handleRequestRun={handleRepositoryRun}
        handleArchiveRepository={workspaceData.handleArchiveRepository}
      />

      <section className="grid grid--top">
        <article className="card section-note">
          <div className="section-heading">
            <h2>What moved out</h2>
            <span className="badge">Step 12</span>
          </div>
          <p className="muted">
            Source tree create, edit, archive, and run actions remain here, but the path after a successful run is now explicit: Browser for exploration, Indexed versions for review, Compare for delta analysis.
          </p>
        </article>
      </section>
    </div>
  );
}
