import type { Workspace } from "../appModel";

type WorkspaceSidebarProps = {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (workspaceId: string) => void;
};

export function WorkspaceSidebar({ workspaces, selectedWorkspaceId, setSelectedWorkspaceId }: WorkspaceSidebarProps) {
  return (
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
  );
}
