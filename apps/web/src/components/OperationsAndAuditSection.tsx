import type { Dispatch, FormEvent, SetStateAction } from "react";
import { summarizeOperationsHeadline } from "../operationsViewModel";
import {
  formatDateTime,
  type AuditEvent,
  type OperationsOverview,
  type RetentionPreview,
  type RunRecord,
  type Workspace,
} from "../appModel";

type Setter<T> = Dispatch<SetStateAction<T>>;

type RetentionFormState = {
  keepSnapshotsPerRepository: string;
  keepRunsPerRepository: string;
};

type OperationsAndAuditSectionProps = {
  recentRuns: RunRecord[];
  selectedWorkspace: Workspace | null;
  operationsOverview: OperationsOverview | null;
  retentionForm: RetentionFormState;
  setRetentionForm: Setter<RetentionFormState>;
  handlePreviewRetention: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleApplyRetention: () => Promise<void>;
  retentionPreview: RetentionPreview | null;
  auditEvents: AuditEvent[];
};

export function OperationsAndAuditSection(props: OperationsAndAuditSectionProps) {
  const { recentRuns, selectedWorkspace, operationsOverview, retentionForm, setRetentionForm, handlePreviewRetention, handleApplyRetention, retentionPreview, auditEvents } = props;

  return (
    <>
    <article className="card">
      <div className="section-heading"><h2>Current and recent runs</h2><span className="badge">{recentRuns.length}</span></div>
      <div className="stack stack--compact">
        {recentRuns.map((run) => (
          <div key={run.id} className="run-item">
            <div className="section-heading section-heading--compact">
              <strong>{run.repositoryName ?? run.repositoryKey ?? run.repositoryRegistrationId}</strong>
              <span className={`badge ${run.status === "FAILED" ? "badge--danger" : "badge--status"}`}>{run.status}</span>
            </div>
            <span>{run.triggerType}{run.outcome ? ` · ${run.outcome}` : ""}</span>
            <span>Requested {formatDateTime(run.requestedAt)}</span>
            <span>Started {formatDateTime(run.startedAt)}</span>
            <span>Completed {formatDateTime(run.completedAt)}</span>
            <span>Schema {run.schemaVersion ?? "—"} · Indexer {run.indexerVersion ?? "—"}</span>
            {run.errorSummary ? <code>{run.errorSummary}</code> : null}
          </div>
        ))}
        {!recentRuns.length && selectedWorkspace ? <p className="muted">No runs have been requested yet.</p> : null}
      </div>
    </article>

    <article className="card">
      <div className="section-heading"><h2>Administration and operations</h2><span className="badge">Step 13</span></div>
      {selectedWorkspace && operationsOverview ? (
        <div className="stack">
          <p>{summarizeOperationsHeadline(operationsOverview.summary)}</p>
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Health</h4><p>{operationsOverview.health.status} · {operationsOverview.health.service}</p><p className="muted">Updated {formatDateTime(operationsOverview.health.time)}</p></div>
            <div className="card card--nested"><h4>Repositories</h4><p>{operationsOverview.summary.repositoryCount} total · {operationsOverview.summary.activeRepositoryCount} active</p></div>
            <div className="card card--nested"><h4>Runs</h4><p>{operationsOverview.summary.runCount} total · {operationsOverview.summary.failedRunCount} failed</p></div>
            <div className="card card--nested"><h4>Snapshots</h4><p>{operationsOverview.summary.snapshotCount} total · {operationsOverview.summary.failedSnapshotCount} problematic</p></div>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested">
              <div className="section-heading"><h3>Repository administration</h3><span className="badge">{operationsOverview.repositories.length}</span></div>
              <div className="stack stack--compact">
                {operationsOverview.repositories.map((repository) => (
                  <div key={repository.id} className="audit-item">
                    <strong>{repository.name}</strong>
                    <span>{repository.repositoryKey} · {repository.status}</span>
                    <span>{repository.snapshotCount} snapshots · {repository.runCount} runs</span>
                    <span>Latest snapshot {formatDateTime(repository.latestSnapshotImportedAt)}</span>
                    <span>Latest run {repository.latestRunStatus ?? "—"}{repository.latestRunOutcome ? ` · ${repository.latestRunOutcome}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card--nested">
              <div className="section-heading"><h3>Retention</h3><span className="badge">Safe cleanup</span></div>
              <form className="stack stack--compact" onSubmit={handlePreviewRetention}>
                <label className="stack stack--compact">
                  <span>Keep snapshots per repository</span>
                  <input value={retentionForm.keepSnapshotsPerRepository} onChange={(event) => setRetentionForm((current) => ({ ...current, keepSnapshotsPerRepository: event.target.value }))} />
                </label>
                <label className="stack stack--compact">
                  <span>Keep terminal runs per repository</span>
                  <input value={retentionForm.keepRunsPerRepository} onChange={(event) => setRetentionForm((current) => ({ ...current, keepRunsPerRepository: event.target.value }))} />
                </label>
                <div className="button-row">
                  <button type="submit">Preview retention</button>
                  <button type="button" className="button-secondary" onClick={() => void handleApplyRetention()}>Apply retention</button>
                </div>
              </form>
              {retentionPreview ? (
                <div className="stack stack--compact">
                  <p>{retentionPreview.snapshotDeleteCount} snapshots and {retentionPreview.runDeleteCount} runs are currently eligible for cleanup.</p>
                  <div className="split-grid split-grid--compact">
                    <div className="card card--nested">
                      <div className="section-heading"><h4>Snapshots to delete</h4><span className="badge">{retentionPreview.snapshotDeleteCount}</span></div>
                      <div className="stack stack--compact">
                        {retentionPreview.snapshotsToDelete.map((snapshot) => (
                          <div key={snapshot.snapshotId} className="audit-item">
                            <strong>{snapshot.snapshotKey}</strong>
                            <span>{snapshot.repositoryName ?? snapshot.repositoryKey ?? snapshot.repositoryRegistrationId}</span>
                            <span>{snapshot.entityCount} entities · {snapshot.relationshipCount} relationships · {snapshot.diagnosticCount} diagnostics</span>
                          </div>
                        ))}
                        {!retentionPreview.snapshotsToDelete.length ? <p className="muted">No snapshot cleanup candidates right now.</p> : null}
                      </div>
                    </div>
                    <div className="card card--nested">
                      <div className="section-heading"><h4>Runs to delete</h4><span className="badge">{retentionPreview.runDeleteCount}</span></div>
                      <div className="stack stack--compact">
                        {retentionPreview.runsToDelete.map((run) => (
                          <div key={run.runId} className="audit-item">
                            <strong>{run.repositoryName ?? run.repositoryKey ?? run.repositoryRegistrationId}</strong>
                            <span>{run.status}{run.outcome ? ` · ${run.outcome}` : ""} · {formatDateTime(run.requestedAt)}</span>
                            {run.errorSummary ? <code>{run.errorSummary}</code> : null}
                          </div>
                        ))}
                        {!retentionPreview.runsToDelete.length ? <p className="muted">No run cleanup candidates right now.</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : <p className="muted">Preview retention to see what would be deleted before applying cleanup.</p>}
            </div>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested">
              <div className="section-heading"><h3>Failed runs</h3><span className="badge">{operationsOverview.failedRuns.length}</span></div>
              <div className="stack stack--compact">
                {operationsOverview.failedRuns.map((run) => (
                  <div key={run.id} className="audit-item">
                    <strong>{run.repositoryName ?? run.repositoryKey ?? run.repositoryRegistrationId}</strong>
                    <span>{run.status}{run.outcome ? ` · ${run.outcome}` : ""} · requested {formatDateTime(run.requestedAt)}</span>
                    {run.errorSummary ? <code>{run.errorSummary}</code> : null}
                  </div>
                ))}
                {!operationsOverview.failedRuns.length ? <p className="muted">No failed runs recorded.</p> : null}
              </div>
            </div>
            <div className="card card--nested">
              <div className="section-heading"><h3>Problematic snapshots</h3><span className="badge">{operationsOverview.failedSnapshots.length}</span></div>
              <div className="stack stack--compact">
                {operationsOverview.failedSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="audit-item">
                    <strong>{snapshot.repositoryName ?? snapshot.repositoryKey ?? snapshot.repositoryRegistrationId}</strong>
                    <span>{snapshot.snapshotKey} · {snapshot.status} · {snapshot.completenessStatus}</span>
                    {snapshot.diagnostics.map((diagnostic) => (
                      <span key={diagnostic.externalId}>{diagnostic.code}: {diagnostic.message}</span>
                    ))}
                    {snapshot.warnings.map((warning, index) => <span key={`${snapshot.id}-warning-${index}`}>{warning}</span>)}
                  </div>
                ))}
                {!operationsOverview.failedSnapshots.length ? <p className="muted">No problematic snapshots recorded.</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : <p className="muted">Select a workspace to review operational health, retention, and diagnostics.</p>}
    </article>

    <article className="card">
      <div className="section-heading"><h2>Audit trail</h2><span className="badge">{auditEvents.length}</span></div>
      <div className="stack">
        {auditEvents.map((event) => (
          <div key={event.id} className="audit-item">
            <strong>{event.eventType}</strong>
            <span>{new Date(event.happenedAt).toLocaleString()}</span>
            <span>{event.actorType}{event.actorId ? ` · ${event.actorId}` : ""}{event.runId ? ` · run ${event.runId}` : ""}</span>
            {event.detailsJson ? <code>{event.detailsJson}</code> : null}
          </div>
        ))}
        {!auditEvents.length && selectedWorkspace ? <p className="muted">No audit entries yet.</p> : null}
      </div>
    </article>
    </>
  );
}
