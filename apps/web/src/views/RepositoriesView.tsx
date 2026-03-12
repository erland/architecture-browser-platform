import { useState } from 'react';
import { RepositoryManagementSection } from '../components/RepositoryManagementSection';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

export function RepositoriesView() {
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

  return (
    <div className="content-stack">
      <section className="card section-intro">
        <p className="eyebrow">Repositories</p>
        <h2>Dedicated repository registration and run flow</h2>
        <p className="lead">
          Step 4 moves repository lifecycle management and run requests into their own view. The shared app selection still carries the chosen workspace and repository across routes.
        </p>
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
            <h2>Active workspace context</h2>
            <span className="badge">Shared selection</span>
          </div>
          {workspaceData.selectedWorkspace ? (
            <>
              <dl className="kv kv--compact">
                <div><dt>Name</dt><dd>{workspaceData.selectedWorkspace.name}</dd></div>
                <div><dt>Key</dt><dd>{workspaceData.selectedWorkspace.workspaceKey}</dd></div>
                <div><dt>Status</dt><dd>{workspaceData.selectedWorkspace.status}</dd></div>
                <div><dt>Repositories</dt><dd>{workspaceData.repositories.length}</dd></div>
              </dl>
              <p className="muted">
                Repository registration and run requests are now handled here for the selected workspace. Snapshot browsing remains in the Current workspace and upcoming Snapshots/Browser views.
              </p>
            </>
          ) : (
            <p className="muted">No workspace selected yet. Use the Workspaces view first, then return here to manage repositories and trigger runs.</p>
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
        handleRequestRun={workspaceData.handleRequestRun}
        handleArchiveRepository={workspaceData.handleArchiveRepository}
      />

      <section className="grid grid--top">
        <article className="card section-note">
          <div className="section-heading">
            <h2>What moved out</h2>
            <span className="badge">Step 4</span>
          </div>
          <p className="muted">
            Repository create, edit, archive, and run actions now live in this route. The temporary Current workspace screen is reduced to snapshot exploration and operations while the remaining views are split out.
          </p>
        </article>
      </section>
    </div>
  );
}
