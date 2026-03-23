import { useState } from 'react';
import { OperationsAndAuditSection } from '../components/OperationsAndAuditSection';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';

 type OperationsViewProps = {
  onOpenWorkspaces: () => void;
  onOpenRepositories: () => void;
  onOpenSnapshots: () => void;
  onOpenLegacy: () => void;
};

export function OperationsView({ onOpenWorkspaces, onOpenRepositories, onOpenSnapshots, onOpenLegacy }: OperationsViewProps) {
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
    <div className="content-stack operations-view">
      <section className="card section-intro">
        <p className="eyebrow">Operations</p>
        <h2>Dedicated operations and audit view</h2>
        <p className="lead">
          Step 10 moves operational administration, retention review, failed run visibility, and audit inspection into a dedicated route so the temporary stacked workspace page no longer competes with operational workflows.
        </p>
        <div className="actions actions--wrap">
          <button type="button" onClick={onOpenWorkspaces}>Choose workspace context</button>
          <button type="button" className="button-secondary" onClick={onOpenRepositories}>Open Manage sources</button>
          <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Open indexed versions</button>
          <button type="button" className="button-secondary" onClick={onOpenLegacy}>Open legacy view</button>
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
            <h2>Operations route status</h2>
            <span className="badge">Step 10</span>
          </div>
          {workspaceData.selectedWorkspace ? (
            <>
              <dl className="kv kv--compact">
                <div><dt>Workspace</dt><dd>{workspaceData.selectedWorkspace.name}</dd></div>
                <div><dt>Workspace key</dt><dd>{workspaceData.selectedWorkspace.workspaceKey}</dd></div>
                <div><dt>Source trees</dt><dd>{workspaceData.repositories.length}</dd></div>
                <div><dt>Recent runs</dt><dd>{workspaceData.recentRuns.length}</dd></div>
                <div><dt>Indexed versions</dt><dd>{workspaceData.snapshots.length}</dd></div>
                <div><dt>Audit events</dt><dd>{workspaceData.auditEvents.length}</dd></div>
              </dl>
              <p className="muted">
                Operations now has a dedicated route. Retention preview/apply, failed run review, problematic snapshot visibility, and audit inspection are focused here for the selected workspace.
              </p>
            </>
          ) : (
            <p className="muted">No workspace selected yet. Use Workspace context to choose one, then return here to review runs, retention, and audit activity.</p>
          )}
        </article>
      </section>

      {workspaceData.selectedWorkspace ? (
        <OperationsAndAuditSection
          recentRuns={workspaceData.recentRuns}
          selectedWorkspace={workspaceData.selectedWorkspace}
          operationsOverview={workspaceData.operationsOverview}
          retentionForm={workspaceData.retentionForm}
          setRetentionForm={workspaceData.setRetentionForm}
          handlePreviewRetention={workspaceData.handlePreviewRetention}
          handleApplyRetention={workspaceData.handleApplyRetention}
          retentionPreview={workspaceData.retentionPreview}
          auditEvents={workspaceData.auditEvents}
        />
      ) : (
        <article className="card empty-state-card">
          <h2>No workspace selected</h2>
          <p className="muted">Select a workspace first, then return here to inspect operations, retention, failures, and audit history.</p>
          <div className="actions">
            <button type="button" onClick={onOpenWorkspaces}>Open workspace context</button>
          </div>
        </article>
      )}
    </div>
  );
}
