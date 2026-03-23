import { useState } from 'react';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar';
import { WorkspaceDetailsSection } from '../components/WorkspaceDetailsSection';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

export function WorkspacesView() {
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
        <p className="eyebrow">Workspaces</p>
        <h2>Workspace context administration</h2>
        <p className="lead">
          Use this view for workspace-level setup, selection, update, and archival. Source tree registration and Browser workflows stay in their own views.
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
          <h2>Create workspace context</h2>
          <form className="form" onSubmit={workspaceData.handleCreateWorkspace}>
            <label>
              <span>Workspace key</span>
              <input value={workspaceData.workspaceForm.workspaceKey} onChange={(event) => workspaceData.setWorkspaceForm((current) => ({ ...current, workspaceKey: event.target.value }))} placeholder="customs-core" />
            </label>
            <label>
              <span>Name</span>
              <input value={workspaceData.workspaceForm.name} onChange={(event) => workspaceData.setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Swedish Customs Core" />
            </label>
            <label>
              <span>Description</span>
              <textarea value={workspaceData.workspaceForm.description} onChange={(event) => workspaceData.setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Architecture review workspace for initial MVP repositories." />
            </label>
            <button type="submit">Create workspace</button>
          </form>
        </article>
      </section>

      <section className="workspace-layout">
        <WorkspaceSidebar
          workspaces={workspaceData.workspaces}
          selectedWorkspaceId={workspaceData.selectedWorkspaceId}
          setSelectedWorkspaceId={workspaceData.setSelectedWorkspaceId}
        />

        <div className="content-stack">
          <WorkspaceDetailsSection
            selectedWorkspace={workspaceData.selectedWorkspace}
            workspaceEditor={workspaceData.workspaceEditor}
            setWorkspaceEditor={workspaceData.setWorkspaceEditor}
            handleUpdateWorkspace={workspaceData.handleUpdateWorkspace}
            handleArchiveWorkspace={workspaceData.handleArchiveWorkspace}
          />

          <article className="card section-note">
            <div className="section-heading">
              <h2>What lives elsewhere</h2>
              <span className="badge">Step 3</span>
            </div>
            <p className="muted">
              Source tree registration, indexed versions, and operations remain available in other views. This page is intentionally focused on workspace-level lifecycle management.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
