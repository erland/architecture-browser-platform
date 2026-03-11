import { FormEvent, useEffect, useMemo, useState } from "react";

type ApiHealth = {
  status: string;
  service: string;
  version: string;
  time: string;
};

type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
type RepositoryStatus = "ACTIVE" | "ARCHIVED";
type RepositorySourceType = "LOCAL_PATH" | "GIT";
type TriggerType = "MANUAL" | "SCHEDULED" | "IMPORT_ONLY" | "SYSTEM";
type RunStatus = "REQUESTED" | "RUNNING" | "IMPORTING" | "COMPLETED" | "FAILED" | "CANCELED";
type RunOutcome = "SUCCESS" | "PARTIAL" | "FAILED" | null;
type StubRunResult = "SUCCESS" | "FAILURE";

type Workspace = {
  id: string;
  workspaceKey: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  repositoryCount: number;
};

type Repository = {
  id: string;
  workspaceId: string;
  repositoryKey: string;
  name: string;
  sourceType: RepositorySourceType;
  localPath: string | null;
  remoteUrl: string | null;
  defaultBranch: string | null;
  status: RepositoryStatus;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditEvent = {
  id: string;
  eventType: string;
  actorType: string;
  actorId: string | null;
  happenedAt: string;
  detailsJson: string | null;
  repositoryRegistrationId: string | null;
  runId: string | null;
};

type RunRecord = {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  triggerType: TriggerType;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  schemaVersion: string | null;
  indexerVersion: string | null;
  errorSummary: string | null;
  metadataJson: string | null;
};

type ApiError = {
  code: string;
  message: string;
  details: string[];
};

const initialHealth: ApiHealth = {
  status: "unknown",
  service: "architecture-browser-platform-api",
  version: "0.1.0",
  time: "",
};

const emptyWorkspaceForm = {
  workspaceKey: "",
  name: "",
  description: "",
};

const emptyRepositoryForm = {
  repositoryKey: "",
  name: "",
  sourceType: "LOCAL_PATH" as RepositorySourceType,
  localPath: "",
  remoteUrl: "",
  defaultBranch: "main",
  metadataJson: "",
};

const initialRunRequest = {
  triggerType: "MANUAL" as TriggerType,
  requestedSchemaVersion: "indexer-ir-v1",
  requestedIndexerVersion: "step4-stub",
  metadataJson: '{"requestedBy":"web-ui"}',
  requestedResult: "SUCCESS" as StubRunResult,
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    const details = payload?.details?.length ? ` ${payload.details.join(" ")}` : "";
    throw new Error(`${payload?.message ?? `Request failed with status ${response.status}`}.${details}`.trim());
  }

  return (await response.json()) as T;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

export function App() {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceForm, setWorkspaceForm] = useState(emptyWorkspaceForm);
  const [repositoryForm, setRepositoryForm] = useState(emptyRepositoryForm);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceEditor, setWorkspaceEditor] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [repositoryEditor, setRepositoryEditor] = useState<{ id: string | null; name: string; localPath: string; remoteUrl: string; defaultBranch: string; metadataJson: string }>({
    id: null,
    name: "",
    localPath: "",
    remoteUrl: "",
    defaultBranch: "main",
    metadataJson: "",
  });
  const [runRequestForm, setRunRequestForm] = useState(initialRunRequest);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const latestRunByRepository = useMemo(() => {
    const result = new Map<string, RunRecord>();
    for (const run of recentRuns) {
      if (!result.has(run.repositoryRegistrationId)) {
        result.set(run.repositoryRegistrationId, run);
      }
    }
    return result;
  }, [recentRuns]);

  useEffect(() => {
    void loadHealth();
    void loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      setWorkspaceEditor({
        name: selectedWorkspace.name,
        description: selectedWorkspace.description ?? "",
      });
      void loadWorkspaceDetail(selectedWorkspace.id);
    } else {
      setRepositories([]);
      setAuditEvents([]);
      setRecentRuns([]);
      setWorkspaceEditor({ name: "", description: "" });
      setRepositoryEditor({ id: null, name: "", localPath: "", remoteUrl: "", defaultBranch: "main", metadataJson: "" });
    }
  }, [selectedWorkspaceId, selectedWorkspace]);

  async function loadHealth() {
    try {
      const payload = await fetchJson<ApiHealth>("/api/health", { method: "GET" });
      setHealth(payload);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown error";
      setError(message);
    }
  }

  async function loadWorkspaces() {
    try {
      const payload = await fetchJson<Workspace[]>("/api/workspaces", { method: "GET" });
      setWorkspaces(payload);
      setSelectedWorkspaceId((current) => {
        if (current && payload.some((item) => item.id === current)) {
          return current;
        }
        return payload[0]?.id ?? null;
      });
      setError(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown error";
      setError(message);
    }
  }

  async function loadWorkspaceDetail(workspaceId: string) {
    try {
      const [repositoryPayload, auditPayload, runPayload] = await Promise.all([
        fetchJson<Repository[]>(`/api/workspaces/${workspaceId}/repositories`, { method: "GET" }),
        fetchJson<AuditEvent[]>(`/api/workspaces/${workspaceId}/audit-events`, { method: "GET" }),
        fetchJson<RunRecord[]>(`/api/workspaces/${workspaceId}/runs/recent`, { method: "GET" }),
      ]);
      setRepositories(repositoryPayload);
      setAuditEvents(auditPayload);
      setRecentRuns(runPayload);
      setRepositoryEditor((current) => (current.id ? current : {
        id: null,
        name: "",
        localPath: "",
        remoteUrl: "",
        defaultBranch: "main",
        metadataJson: "",
      }));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unknown error";
      setError(message);
    }
  }

  async function handleCreateWorkspace(event: FormEvent) {
    event.preventDefault();
    setBusyMessage("Creating workspace…");
    try {
      const created = await fetchJson<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(workspaceForm),
      });
      setWorkspaceForm(emptyWorkspaceForm);
      await loadWorkspaces();
      setSelectedWorkspaceId(created.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Updating workspace…");
    try {
      const updated = await fetchJson<Workspace>(`/api/workspaces/${selectedWorkspaceId}`, {
        method: "PUT",
        body: JSON.stringify(workspaceEditor),
      });
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
      await loadWorkspaceDetail(selectedWorkspaceId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveWorkspace() {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Archiving workspace…");
    try {
      const updated = await fetchJson<Workspace>(`/api/workspaces/${selectedWorkspaceId}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Creating repository registration…");
    try {
      await fetchJson<Repository>(`/api/workspaces/${selectedWorkspaceId}/repositories`, {
        method: "POST",
        body: JSON.stringify(repositoryForm),
      });
      setRepositoryForm(emptyRepositoryForm);
      await loadWorkspaces();
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !repositoryEditor.id) {
      return;
    }
    const existing = repositories.find((item) => item.id === repositoryEditor.id);
    if (!existing) {
      return;
    }
    setBusyMessage("Updating repository registration…");
    try {
      await fetchJson<Repository>(`/api/workspaces/${selectedWorkspaceId}/repositories/${repositoryEditor.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: repositoryEditor.name,
          localPath: repositoryEditor.localPath,
          remoteUrl: repositoryEditor.remoteUrl,
          defaultBranch: repositoryEditor.defaultBranch,
          metadataJson: repositoryEditor.metadataJson,
        }),
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveRepository(repositoryId: string) {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Archiving repository registration…");
    try {
      await fetchJson<Repository>(`/api/workspaces/${selectedWorkspaceId}/repositories/${repositoryId}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleRequestRun(repository: Repository, requestedResult: StubRunResult) {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage(`Requesting ${requestedResult.toLowerCase()} run for ${repository.name}…`);
    try {
      await fetchJson<RunRecord>(`/api/workspaces/${selectedWorkspaceId}/repositories/${repository.id}/runs`, {
        method: "POST",
        body: JSON.stringify({
          ...runRequestForm,
          requestedResult,
        }),
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  function selectRepositoryForEdit(repository: Repository) {
    setRepositoryEditor({
      id: repository.id,
      name: repository.name,
      localPath: repository.localPath ?? "",
      remoteUrl: repository.remoteUrl ?? "",
      defaultBranch: repository.defaultBranch ?? "",
      metadataJson: repository.metadataJson ?? "",
    });
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Index-run orchestration and status tracking</h1>
        <p className="lead">
          Step 4 adds run request APIs, persisted run history, status transitions, and a stub indexer adapter so the platform can request
          repository indexing runs and surface their current and recent outcomes in the UI.
        </p>
      </section>

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div>
              <dt>Status</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{health.service}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{health.version}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{health.time || "—"}</dd>
            </div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <h2>Create workspace</h2>
          <form className="form" onSubmit={handleCreateWorkspace}>
            <label>
              <span>Workspace key</span>
              <input value={workspaceForm.workspaceKey} onChange={(event) => setWorkspaceForm((current) => ({ ...current, workspaceKey: event.target.value }))} placeholder="customs-core" />
            </label>
            <label>
              <span>Name</span>
              <input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Swedish Customs Core" />
            </label>
            <label>
              <span>Description</span>
              <textarea value={workspaceForm.description} onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Architecture review workspace for initial MVP repositories." />
            </label>
            <button type="submit">Create workspace</button>
          </form>
        </article>
      </section>

      <section className="workspace-layout">
        <article className="card sidebar">
          <div className="section-heading">
            <h2>Workspaces</h2>
            <span className="badge">{workspaces.length}</span>
          </div>
          <div className="stack">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className={`list-item ${workspace.id === selectedWorkspaceId ? "list-item--active" : ""}`}
                onClick={() => setSelectedWorkspaceId(workspace.id)}
              >
                <strong>{workspace.name}</strong>
                <span>{workspace.workspaceKey}</span>
                <span>{workspace.status} · {workspace.repositoryCount} repos</span>
              </button>
            ))}
            {!workspaces.length ? <p className="muted">No workspaces created yet.</p> : null}
          </div>
        </article>

        <div className="content-stack">
          <article className="card">
            <div className="section-heading">
              <h2>Selected workspace</h2>
              {selectedWorkspace ? <span className="badge badge--status">{selectedWorkspace.status}</span> : null}
            </div>
            {selectedWorkspace ? (
              <form className="form" onSubmit={handleUpdateWorkspace}>
                <label>
                  <span>Name</span>
                  <input value={workspaceEditor.name} onChange={(event) => setWorkspaceEditor((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  <span>Description</span>
                  <textarea value={workspaceEditor.description} onChange={(event) => setWorkspaceEditor((current) => ({ ...current, description: event.target.value }))} />
                </label>
                <div className="actions">
                  <button type="submit">Save workspace</button>
                  <button type="button" className="button-secondary" onClick={() => void handleArchiveWorkspace()}>Archive workspace</button>
                </div>
              </form>
            ) : (
              <p className="muted">Select a workspace to manage repositories, runs, and audit history.</p>
            )}
          </article>

          <article className="card">
            <div className="section-heading">
              <h2>Repository registrations</h2>
              <span className="badge">{repositories.length}</span>
            </div>
            {selectedWorkspace ? (
              <>
                <div className="split-grid">
                  <form className="form" onSubmit={handleCreateRepository}>
                    <h3>Create</h3>
                    <label>
                      <span>Repository key</span>
                      <input value={repositoryForm.repositoryKey} onChange={(event) => setRepositoryForm((current) => ({ ...current, repositoryKey: event.target.value }))} placeholder="backend-api" />
                    </label>
                    <label>
                      <span>Name</span>
                      <input value={repositoryForm.name} onChange={(event) => setRepositoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Backend API" />
                    </label>
                    <label>
                      <span>Source type</span>
                      <select value={repositoryForm.sourceType} onChange={(event) => setRepositoryForm((current) => ({ ...current, sourceType: event.target.value as RepositorySourceType }))}>
                        <option value="LOCAL_PATH">LOCAL_PATH</option>
                        <option value="GIT">GIT</option>
                      </select>
                    </label>
                    <label>
                      <span>Local path</span>
                      <input value={repositoryForm.localPath} onChange={(event) => setRepositoryForm((current) => ({ ...current, localPath: event.target.value }))} placeholder="/repos/backend-api" />
                    </label>
                    <label>
                      <span>Remote URL</span>
                      <input value={repositoryForm.remoteUrl} onChange={(event) => setRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))} placeholder="https://github.com/erland/backend-api" />
                    </label>
                    <label>
                      <span>Default branch</span>
                      <input value={repositoryForm.defaultBranch} onChange={(event) => setRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))} />
                    </label>
                    <label>
                      <span>Metadata JSON</span>
                      <textarea value={repositoryForm.metadataJson} onChange={(event) => setRepositoryForm((current) => ({ ...current, metadataJson: event.target.value }))} placeholder='{"owner":"architecture"}' />
                    </label>
                    <button type="submit">Create repository</button>
                  </form>

                  <form className="form" onSubmit={handleUpdateRepository}>
                    <h3>Edit selected</h3>
                    {repositoryEditor.id ? (
                      <>
                        <label>
                          <span>Name</span>
                          <input value={repositoryEditor.name} onChange={(event) => setRepositoryEditor((current) => ({ ...current, name: event.target.value }))} />
                        </label>
                        <label>
                          <span>Local path</span>
                          <input value={repositoryEditor.localPath} onChange={(event) => setRepositoryEditor((current) => ({ ...current, localPath: event.target.value }))} />
                        </label>
                        <label>
                          <span>Remote URL</span>
                          <input value={repositoryEditor.remoteUrl} onChange={(event) => setRepositoryEditor((current) => ({ ...current, remoteUrl: event.target.value }))} />
                        </label>
                        <label>
                          <span>Default branch</span>
                          <input value={repositoryEditor.defaultBranch} onChange={(event) => setRepositoryEditor((current) => ({ ...current, defaultBranch: event.target.value }))} />
                        </label>
                        <label>
                          <span>Metadata JSON</span>
                          <textarea value={repositoryEditor.metadataJson} onChange={(event) => setRepositoryEditor((current) => ({ ...current, metadataJson: event.target.value }))} />
                        </label>
                        <button type="submit">Save repository</button>
                      </>
                    ) : (
                      <p className="muted">Pick a repository from the list below to edit it.</p>
                    )}
                  </form>
                </div>

                <div className="card card--nested">
                  <div className="section-heading">
                    <h3>Stub run request defaults</h3>
                    <span className="badge">Step 4</span>
                  </div>
                  <div className="split-grid split-grid--compact">
                    <label>
                      <span>Trigger type</span>
                      <select value={runRequestForm.triggerType} onChange={(event) => setRunRequestForm((current) => ({ ...current, triggerType: event.target.value as TriggerType }))}>
                        <option value="MANUAL">MANUAL</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="IMPORT_ONLY">IMPORT_ONLY</option>
                        <option value="SYSTEM">SYSTEM</option>
                      </select>
                    </label>
                    <label>
                      <span>Schema version</span>
                      <input value={runRequestForm.requestedSchemaVersion} onChange={(event) => setRunRequestForm((current) => ({ ...current, requestedSchemaVersion: event.target.value }))} />
                    </label>
                    <label>
                      <span>Indexer version</span>
                      <input value={runRequestForm.requestedIndexerVersion} onChange={(event) => setRunRequestForm((current) => ({ ...current, requestedIndexerVersion: event.target.value }))} />
                    </label>
                    <label>
                      <span>Metadata JSON</span>
                      <textarea value={runRequestForm.metadataJson} onChange={(event) => setRunRequestForm((current) => ({ ...current, metadataJson: event.target.value }))} />
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <p className="muted">Select a workspace to manage repository registrations.</p>
            )}

            <div className="table-list">
              {repositories.map((repository) => {
                const latestRun = latestRunByRepository.get(repository.id);
                return (
                  <div key={repository.id} className="table-row table-row--stacked">
                    <div>
                      <strong>{repository.name}</strong>
                      <p>{repository.repositoryKey} · {repository.sourceType} · {repository.status}</p>
                      {latestRun ? (
                        <p>
                          Latest run: {latestRun.status}
                          {latestRun.outcome ? ` · ${latestRun.outcome}` : ""}
                          {latestRun.completedAt ? ` · ${formatDateTime(latestRun.completedAt)}` : ""}
                        </p>
                      ) : (
                        <p>No runs requested yet.</p>
                      )}
                    </div>
                    <div className="actions actions--inline actions--wrap">
                      <button type="button" className="button-secondary" onClick={() => selectRepositoryForEdit(repository)}>Edit</button>
                      <button type="button" className="button-secondary" onClick={() => void handleRequestRun(repository, "SUCCESS")}>Run success</button>
                      <button type="button" className="button-secondary" onClick={() => void handleRequestRun(repository, "FAILURE")}>Run failure</button>
                      <button type="button" className="button-secondary" onClick={() => void handleArchiveRepository(repository.id)}>Archive</button>
                    </div>
                  </div>
                );
              })}
              {!repositories.length && selectedWorkspace ? <p className="muted">No repositories registered yet.</p> : null}
            </div>
          </article>

          <article className="card">
            <div className="section-heading">
              <h2>Current and recent runs</h2>
              <span className="badge">{recentRuns.length}</span>
            </div>
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
            <div className="section-heading">
              <h2>Audit trail</h2>
              <span className="badge">{auditEvents.length}</span>
            </div>
            <div className="stack">
              {auditEvents.map((event) => (
                <div key={event.id} className="audit-item">
                  <strong>{event.eventType}</strong>
                  <span>{new Date(event.happenedAt).toLocaleString()}</span>
                  <span>
                    {event.actorType}{event.actorId ? ` · ${event.actorId}` : ""}
                    {event.runId ? ` · run ${event.runId}` : ""}
                  </span>
                  {event.detailsJson ? <code>{event.detailsJson}</code> : null}
                </div>
              ))}
              {!auditEvents.length && selectedWorkspace ? <p className="muted">No audit entries yet.</p> : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
