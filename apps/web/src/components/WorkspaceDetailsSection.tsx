import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { Workspace } from '../appModel';

type WorkspaceEditor = { name: string; description: string };

type WorkspaceDetailsSectionProps = {
  selectedWorkspace: Workspace | null;
  workspaceEditor: WorkspaceEditor;
  setWorkspaceEditor: Dispatch<SetStateAction<WorkspaceEditor>>;
  handleUpdateWorkspace: (event: FormEvent) => Promise<void>;
  handleArchiveWorkspace: () => Promise<void>;
};

export function WorkspaceDetailsSection({
  selectedWorkspace,
  workspaceEditor,
  setWorkspaceEditor,
  handleUpdateWorkspace,
  handleArchiveWorkspace,
}: WorkspaceDetailsSectionProps) {
  return (
    <article className="card">
      <div className="section-heading">
        <h2>Selected workspace</h2>
        {selectedWorkspace ? <span className="badge badge--status">{selectedWorkspace.status}</span> : null}
      </div>
      {selectedWorkspace ? (
        <>
          <dl className="kv kv--compact">
            <div><dt>Key</dt><dd>{selectedWorkspace.workspaceKey}</dd></div>
            <div><dt>Created</dt><dd>{selectedWorkspace.createdAt || '—'}</dd></div>
            <div><dt>Updated</dt><dd>{selectedWorkspace.updatedAt || '—'}</dd></div>
          </dl>
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
        </>
      ) : (
        <p className="muted">Select a workspace to edit its details or archive it.</p>
      )}
    </article>
  );
}
