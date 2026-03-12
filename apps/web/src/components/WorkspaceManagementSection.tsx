import type { FormEvent, Dispatch, SetStateAction } from "react";
import type {
  Repository,
  RepositorySourceType,
  RunRecord,
  StubRunResult,
  TriggerType,
  Workspace,
} from "../appModel";
import { formatDateTime } from "../appModel";

type WorkspaceEditor = { name: string; description: string };
type RepositoryForm = {
  repositoryKey: string;
  name: string;
  sourceType: RepositorySourceType;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};
type RepositoryEditor = {
  id: string | null;
  name: string;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};
type RunRequestForm = {
  triggerType: TriggerType;
  requestedSchemaVersion: string;
  requestedIndexerVersion: string;
  metadataJson: string;
  requestedResult: StubRunResult;
};

type WorkspaceManagementSectionProps = {
  selectedWorkspace: Workspace | null;
  workspaceEditor: WorkspaceEditor;
  setWorkspaceEditor: Dispatch<SetStateAction<WorkspaceEditor>>;
  handleUpdateWorkspace: (event: FormEvent) => Promise<void>;
  handleArchiveWorkspace: () => Promise<void>;
  repositories: Repository[];
  repositoryForm: RepositoryForm;
  setRepositoryForm: Dispatch<SetStateAction<RepositoryForm>>;
  handleCreateRepository: (event: FormEvent) => Promise<void>;
  repositoryEditor: RepositoryEditor;
  setRepositoryEditor: Dispatch<SetStateAction<RepositoryEditor>>;
  handleUpdateRepository: (event: FormEvent) => Promise<void>;
  runRequestForm: RunRequestForm;
  setRunRequestForm: Dispatch<SetStateAction<RunRequestForm>>;
  latestRunByRepository: Map<string, RunRecord>;
  selectRepositoryForEdit: (repository: Repository) => void;
  handleRequestRun: (repository: Repository, requestedResult: StubRunResult) => Promise<void>;
  handleArchiveRepository: (repositoryId: string) => Promise<void>;
};

export function WorkspaceManagementSection({
  selectedWorkspace,
  workspaceEditor,
  setWorkspaceEditor,
  handleUpdateWorkspace,
  handleArchiveWorkspace,
  repositories,
  repositoryForm,
  setRepositoryForm,
  handleCreateRepository,
  repositoryEditor,
  setRepositoryEditor,
  handleUpdateRepository,
  runRequestForm,
  setRunRequestForm,
  latestRunByRepository,
  selectRepositoryForEdit,
  handleRequestRun,
  handleArchiveRepository,
}: WorkspaceManagementSectionProps) {
  return (
    <>
      <article className="card">
        <div className="section-heading">
          <h2>Selected workspace</h2>
          {selectedWorkspace ? <span className="badge badge--status">{selectedWorkspace.status}</span> : null}
        </div>
        {selectedWorkspace ? (
          <form className="form" onSubmit={(event) => void handleUpdateWorkspace(event)}>
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
          <p className="muted">Select a workspace to manage repositories, runs, snapshots, and audit history.</p>
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
              <form className="form" onSubmit={(event) => void handleCreateRepository(event)}>
                <h3>Create</h3>
                <label><span>Repository key</span><input value={repositoryForm.repositoryKey} onChange={(event) => setRepositoryForm((current) => ({ ...current, repositoryKey: event.target.value }))} placeholder="backend-api" /></label>
                <label><span>Name</span><input value={repositoryForm.name} onChange={(event) => setRepositoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Backend API" /></label>
                <label>
                  <span>Source type</span>
                  <select value={repositoryForm.sourceType} onChange={(event) => setRepositoryForm((current) => ({ ...current, sourceType: event.target.value as RepositorySourceType }))}>
                    <option value="LOCAL_PATH">LOCAL_PATH</option>
                    <option value="GIT">GIT</option>
                  </select>
                </label>
                <label><span>Local path</span><input value={repositoryForm.localPath} onChange={(event) => setRepositoryForm((current) => ({ ...current, localPath: event.target.value }))} placeholder="/repos/backend-api" /></label>
                <label><span>Remote URL</span><input value={repositoryForm.remoteUrl} onChange={(event) => setRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))} placeholder="https://github.com/erland/backend-api" /></label>
                <label><span>Default branch</span><input value={repositoryForm.defaultBranch} onChange={(event) => setRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))} /></label>
                <label><span>Metadata JSON</span><textarea value={repositoryForm.metadataJson} onChange={(event) => setRepositoryForm((current) => ({ ...current, metadataJson: event.target.value }))} placeholder='{"owner":"architecture"}' /></label>
                <button type="submit">Create repository</button>
              </form>

              <form className="form" onSubmit={(event) => void handleUpdateRepository(event)}>
                <h3>Edit selected</h3>
                {repositoryEditor.id ? (
                  <>
                    <label><span>Name</span><input value={repositoryEditor.name} onChange={(event) => setRepositoryEditor((current) => ({ ...current, name: event.target.value }))} /></label>
                    <label><span>Local path</span><input value={repositoryEditor.localPath} onChange={(event) => setRepositoryEditor((current) => ({ ...current, localPath: event.target.value }))} /></label>
                    <label><span>Remote URL</span><input value={repositoryEditor.remoteUrl} onChange={(event) => setRepositoryEditor((current) => ({ ...current, remoteUrl: event.target.value }))} /></label>
                    <label><span>Default branch</span><input value={repositoryEditor.defaultBranch} onChange={(event) => setRepositoryEditor((current) => ({ ...current, defaultBranch: event.target.value }))} /></label>
                    <label><span>Metadata JSON</span><textarea value={repositoryEditor.metadataJson} onChange={(event) => setRepositoryEditor((current) => ({ ...current, metadataJson: event.target.value }))} /></label>
                    <button type="submit">Save repository</button>
                  </>
                ) : <p className="muted">Pick a repository from the list below to edit it.</p>}
              </form>
            </div>

            <div className="card card--nested">
              <div className="section-heading">
                <h3>Stub run request defaults</h3>
                <span className="badge">Step 4</span>
              </div>
              <div className="split-grid split-grid--compact">
                <label><span>Trigger type</span><select value={runRequestForm.triggerType} onChange={(event) => setRunRequestForm((current) => ({ ...current, triggerType: event.target.value as TriggerType }))}><option value="MANUAL">MANUAL</option><option value="SCHEDULED">SCHEDULED</option><option value="IMPORT_ONLY">IMPORT_ONLY</option><option value="SYSTEM">SYSTEM</option></select></label>
                <label><span>Schema version</span><input value={runRequestForm.requestedSchemaVersion} onChange={(event) => setRunRequestForm((current) => ({ ...current, requestedSchemaVersion: event.target.value }))} /></label>
                <label><span>Indexer version</span><input value={runRequestForm.requestedIndexerVersion} onChange={(event) => setRunRequestForm((current) => ({ ...current, requestedIndexerVersion: event.target.value }))} /></label>
                <label><span>Metadata JSON</span><textarea value={runRequestForm.metadataJson} onChange={(event) => setRunRequestForm((current) => ({ ...current, metadataJson: event.target.value }))} /></label>
              </div>
            </div>
          </>
        ) : <p className="muted">Select a workspace to manage repository registrations.</p>}

        <div className="table-list">
          {repositories.map((repository) => {
            const latestRun = latestRunByRepository.get(repository.id);
            return (
              <div key={repository.id} className="table-row table-row--stacked">
                <div>
                  <strong>{repository.name}</strong>
                  <p>{repository.repositoryKey} · {repository.sourceType} · {repository.status}</p>
                  {latestRun ? <p>Latest run: {latestRun.status}{latestRun.outcome ? ` · ${latestRun.outcome}` : ""}{latestRun.completedAt ? ` · ${formatDateTime(latestRun.completedAt)}` : ""}</p> : <p>No runs requested yet.</p>}
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
    </>
  );
}
