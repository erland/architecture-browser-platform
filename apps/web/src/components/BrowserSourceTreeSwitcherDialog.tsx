import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { emptyRepositoryForm, emptyWorkspaceForm, type Repository, type RepositorySourceType, type RepositoryUpdateRequest, type Workspace } from '../appModel';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';

export type BrowserSourceTreeSwitcherDialogProps = {
  isOpen: boolean;
  items: SourceTreeLauncherItem[];
  repositories: Repository[];
  selectedWorkspace: Workspace | null;
  onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
  onCreateRepository: (payload: typeof emptyRepositoryForm) => Promise<void>;
  onCreateWorkspace: (payload: typeof emptyWorkspaceForm) => Promise<void>;
  onRequestReindex: (repository: Repository) => Promise<void>;
  onArchiveRepository: (repository: Repository) => Promise<void>;
  onUpdateRepository: (repository: Repository, payload: RepositoryUpdateRequest) => Promise<void>;
  onClose: () => void;
};

function buildInitialRepositoryForm() {
  return { ...emptyRepositoryForm };
}

function buildInitialWorkspaceForm() {
  return { ...emptyWorkspaceForm };
}

function isGitSource(sourceType: RepositorySourceType) {
  return sourceType === 'GIT';
}

function isLocalPathSource(sourceType: RepositorySourceType) {
  return sourceType === 'LOCAL_PATH';
}

function formatLastIndexedLabel(value: string) {
  if (value === 'Never indexed') {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `Indexed ${date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function BrowserSourceTreeSwitcherDialog({
  isOpen,
  items,
  repositories,
  selectedWorkspace,
  onSelectSourceTree,
  onCreateRepository,
  onCreateWorkspace,
  onRequestReindex,
  onArchiveRepository,
  onUpdateRepository,
  onClose,
}: BrowserSourceTreeSwitcherDialogProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateWorkspaceDialogOpen, setIsCreateWorkspaceDialogOpen] = useState(false);
  const [repositoryForm, setRepositoryForm] = useState(buildInitialRepositoryForm);
  const [workspaceForm, setWorkspaceForm] = useState(buildInitialWorkspaceForm);
  const [actionRepositoryId, setActionRepositoryId] = useState<string | null>(null);
  const [editRepositoryId, setEditRepositoryId] = useState<string | null>(null);
  const [editRepositoryForm, setEditRepositoryForm] = useState<RepositoryUpdateRequest>({
    name: '',
    localPath: '',
    remoteUrl: '',
    defaultBranch: 'main',
    metadataJson: '',
  });

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editRepositoryId) {
          setEditRepositoryId(null);
          return;
        }
        if (isAddDialogOpen) {
          setIsAddDialogOpen(false);
          return;
        }
        if (isCreateWorkspaceDialogOpen) {
          setIsCreateWorkspaceDialogOpen(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddDialogOpen, isCreateWorkspaceDialogOpen, editRepositoryId, onClose]);

  const repositoriesById = useMemo(() => {
    const result = new Map<string, Repository>();
    for (const repository of repositories) {
      result.set(repository.id, repository);
    }
    return result;
  }, [repositories]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (item: SourceTreeLauncherItem) => {
    onSelectSourceTree(item);
    onClose();
  };




  const handleOpenAddDialog = () => {
    setRepositoryForm(buildInitialRepositoryForm());
    setIsAddDialogOpen(true);
  };

  const handleOpenCreateWorkspaceDialog = () => {
    setWorkspaceForm(buildInitialWorkspaceForm());
    setIsCreateWorkspaceDialogOpen(true);
  };

  const handleOpenEditDialog = (repository: Repository) => {
    setEditRepositoryId(repository.id);
    setEditRepositoryForm({
      name: repository.name,
      localPath: repository.localPath ?? '',
      remoteUrl: repository.remoteUrl ?? '',
      defaultBranch: repository.defaultBranch ?? '',
      metadataJson: repository.metadataJson ?? '',
    });
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editRepositoryId) {
      return;
    }
    const repository = repositoriesById.get(editRepositoryId);
    if (!repository) {
      return;
    }
    setActionRepositoryId(repository.id);
    try {
      await onUpdateRepository(repository, editRepositoryForm);
      setEditRepositoryId(null);
    } finally {
      setActionRepositoryId(null);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateRepository(repositoryForm);
    setRepositoryForm(buildInitialRepositoryForm());
    setIsAddDialogOpen(false);
  };

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateWorkspace(workspaceForm);
    setWorkspaceForm(buildInitialWorkspaceForm());
    setIsCreateWorkspaceDialogOpen(false);
  };

  const handleReindex = async (item: SourceTreeLauncherItem) => {
    const repository = repositoriesById.get(item.repositoryId);
    if (!repository) {
      return;
    }
    setActionRepositoryId(repository.id);
    try {
      await onRequestReindex(repository);
    } finally {
      setActionRepositoryId(null);
    }
  };

  const handleArchive = async (item: SourceTreeLauncherItem) => {
    const repository = repositoriesById.get(item.repositoryId);
    if (!repository) {
      return;
    }
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`Archive source tree \"${item.sourceTreeLabel}\"?`);
    if (!confirmed) {
      return;
    }
    setActionRepositoryId(repository.id);
    try {
      await onArchiveRepository(repository);
    } finally {
      setActionRepositoryId(null);
    }
  };

  return (
    <div className="browser-dialog" role="presentation">
      <button
        type="button"
        className="browser-dialog__backdrop"
        aria-label="Close source tree switcher"
        onClick={onClose}
      />
      <section
        className="card browser-dialog__surface browser-dialog__surface--source-tree browser-dialog__surface--management"
        role="dialog"
        aria-modal="true"
        aria-labelledby="browser-source-tree-switcher-title"
      >
        <section className="browser-dialog__management" aria-label="Source tree management actions">
          <div className="section-heading browser-dialog__management-heading">
            <div>
              <p className="eyebrow">Manage sources</p>
              <h2 id="browser-source-tree-switcher-title">Source trees</h2>
            </div>
            <div className="browser-dialog__header-actions">
              <button type="button" onClick={handleOpenAddDialog} disabled={!selectedWorkspace}>Add source tree</button>
              <button type="button" className="button-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
          {!selectedWorkspace ? (
            <section className="browser-dialog__empty-state">
              <h4>No workspace selected</h4>
              <p className="muted">Create a workspace to start registering and indexing source trees.</p>
              <div className="browser-dialog__empty-actions">
                <button type="button" onClick={handleOpenCreateWorkspaceDialog}>Create workspace</button>
              </div>
            </section>
          ) : null}

          <div className="browser-dialog__source-list" role="list" aria-label="Source tree management list">
            {items.map((item) => {
              const busy = actionRepositoryId === item.repositoryId;
              const canOpen = item.latestSnapshotId !== null;
              return (
                <section key={item.id} className="browser-dialog__source-item" role="listitem">
                  <div className="browser-dialog__source-main">
                    <div>
                      <h4>{item.sourceTreeLabel}</h4>
                      <p className="muted">{item.sourceSummary}</p>
                    </div>
                    <div className="browser-source-tree-launcher__badges">
                      <span className="badge">{item.sourceTreeKey}</span>
                      <span className={`badge ${item.latestRunStatusLabel === 'Success' ? 'badge--status' : ''}`}>{item.latestRunStatusLabel}</span>
                      <span className={`badge ${item.status === 'ready' ? 'badge--status' : ''}`}>{formatLastIndexedLabel(item.latestIndexedAtLabel)}</span>
                    </div>
                  </div>
                  <div className="browser-dialog__source-actions">
                    <button type="button" className="button-secondary" onClick={() => handleSelect(item)} disabled={!canOpen || busy}>Open</button>
                    <button type="button" className="button-secondary" onClick={() => void handleReindex(item)} disabled={busy}>Re-index</button>
                    <button type="button" className="button-secondary" onClick={() => { const repository = repositoriesById.get(item.repositoryId); if (repository) { handleOpenEditDialog(repository); } }} disabled={busy || !repositoriesById.get(item.repositoryId)}>Edit source</button>
                    <button type="button" className="button-secondary" onClick={() => void handleArchive(item)} disabled={busy}>Archive</button>
                  </div>
                </section>
              );
            })}
            {!items.length && selectedWorkspace ? <p className="muted">No source trees are available yet. Add one to start indexing.</p> : null}
          </div>
        </section>


        {editRepositoryId ? (
          <div className="browser-dialog browser-dialog--nested" role="presentation">
            <button
              type="button"
              className="browser-dialog__backdrop"
              aria-label="Close edit source tree dialog"
              onClick={() => setEditRepositoryId(null)}
            />
            <section className="card browser-dialog__surface browser-dialog__surface--nested" role="dialog" aria-modal="true" aria-labelledby="browser-edit-source-tree-title">
              <div className="browser-dialog__header">
                <div>
                  <p className="eyebrow">Edit source tree</p>
                  <h2 id="browser-edit-source-tree-title">Update source configuration</h2>
                </div>
                <button type="button" className="button-secondary" onClick={() => setEditRepositoryId(null)}>Close</button>
              </div>

              <form className="form browser-dialog__form" onSubmit={(event) => void handleUpdate(event)}>
                <label>
                  <span>Name</span>
                  <input
                    value={editRepositoryForm.name}
                    onChange={(event) => setEditRepositoryForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Backend API"
                    required
                  />
                </label>
                <label>
                  <span>Source type</span>
                  <select
                    value={repositoriesById.get(editRepositoryId)?.sourceType ?? 'GIT'}
                    disabled
                  >
                    <option value="LOCAL_PATH">Server path</option>
                    <option value="GIT">Git repository</option>
                  </select>
                </label>
                {isLocalPathSource(repositoriesById.get(editRepositoryId)?.sourceType ?? 'GIT') ? (
                  <label>
                    <span>Server path</span>
                    <input
                      value={editRepositoryForm.localPath}
                      onChange={(event) => setEditRepositoryForm((current) => ({ ...current, localPath: event.target.value }))}
                      placeholder="/workspace/sources/backend-api"
                    />
                    <small className="muted">This path must be visible to the API/indexer container or server, not just your local machine.</small>
                  </label>
                ) : null}
                {isGitSource(repositoriesById.get(editRepositoryId)?.sourceType ?? 'GIT') ? (
                  <label>
                    <span>Repository URL</span>
                    <input
                      value={editRepositoryForm.remoteUrl}
                      onChange={(event) => setEditRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))}
                      placeholder="https://github.com/example/backend-api"
                    />
                  </label>
                ) : null}
                <label>
                  <span>Default branch</span>
                  <input
                    value={editRepositoryForm.defaultBranch}
                    onChange={(event) => setEditRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))}
                    placeholder="main"
                  />
                </label>
                <label>
                  <span>Metadata JSON</span>
                  <textarea
                    value={editRepositoryForm.metadataJson}
                    onChange={(event) => setEditRepositoryForm((current) => ({ ...current, metadataJson: event.target.value }))}
                    rows={4}
                    placeholder='{"team":"platform"}'
                  />
                </label>
                <div className="browser-dialog__footer-actions">
                  <button type="submit">Save changes</button>
                  <button type="button" className="button-secondary" onClick={() => setEditRepositoryId(null)}>Cancel</button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isCreateWorkspaceDialogOpen ? (
          <div className="browser-dialog browser-dialog--nested" role="presentation">
            <button
              type="button"
              className="browser-dialog__backdrop"
              aria-label="Close create workspace dialog"
              onClick={() => setIsCreateWorkspaceDialogOpen(false)}
            />
            <section className="card browser-dialog__surface browser-dialog__surface--nested" role="dialog" aria-modal="true" aria-labelledby="browser-create-workspace-title">
              <div className="browser-dialog__header">
                <div>
                  <p className="eyebrow">Create workspace</p>
                  <h2 id="browser-create-workspace-title">Create a workspace</h2>
                  <p className="muted browser-dialog__lead">A workspace is the container used to organize source trees and indexed versions.</p>
                </div>
                <button type="button" className="button-secondary" onClick={() => setIsCreateWorkspaceDialogOpen(false)}>Close</button>
              </div>

              <form className="form browser-dialog__form" onSubmit={(event) => void handleCreateWorkspace(event)}>
                <label>
                  <span>Workspace key</span>
                  <input
                    value={workspaceForm.workspaceKey}
                    onChange={(event) => setWorkspaceForm((current) => ({ ...current, workspaceKey: event.target.value }))}
                    placeholder="default-workspace"
                    required
                  />
                </label>
                <label>
                  <span>Name</span>
                  <input
                    value={workspaceForm.name}
                    onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Default workspace"
                    required
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    value={workspaceForm.description}
                    onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    placeholder="Optional description"
                  />
                </label>
                <div className="actions actions--inline browser-dialog__form-actions">
                  <button type="submit">Create workspace</button>
                  <button type="button" className="button-secondary" onClick={() => setIsCreateWorkspaceDialogOpen(false)}>Cancel</button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isAddDialogOpen ? (
          <div className="browser-dialog browser-dialog--nested" role="presentation">
            <button
              type="button"
              className="browser-dialog__backdrop"
              aria-label="Close add source tree dialog"
              onClick={() => setIsAddDialogOpen(false)}
            />
            <section className="card browser-dialog__surface browser-dialog__surface--nested" role="dialog" aria-modal="true" aria-labelledby="browser-add-source-tree-title">
              <div className="browser-dialog__header">
                <div>
                  <p className="eyebrow">Add source tree</p>
                  <h2 id="browser-add-source-tree-title">Register a new source tree</h2>
                  <p className="muted browser-dialog__lead">Create the source entry here, then use Re-index to produce the first indexed version.</p>
                </div>
                <button type="button" className="button-secondary" onClick={() => setIsAddDialogOpen(false)}>Close</button>
              </div>

              <form className="form browser-dialog__form" onSubmit={(event) => void handleCreate(event)}>
                <label>
                  <span>Source tree key</span>
                  <input
                    value={repositoryForm.repositoryKey}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, repositoryKey: event.target.value }))}
                    placeholder="backend-api"
                    required
                  />
                </label>
                <label>
                  <span>Name</span>
                  <input
                    value={repositoryForm.name}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Backend API"
                    required
                  />
                </label>
                <label>
                  <span>Source type</span>
                  <select
                    value={repositoryForm.sourceType}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, sourceType: event.target.value as RepositorySourceType, localPath: event.target.value === 'LOCAL_PATH' ? current.localPath : '', remoteUrl: event.target.value === 'GIT' ? current.remoteUrl : '' }))}
                  >
                    <option value="LOCAL_PATH">Server path</option>
                    <option value="GIT">Git repository</option>
                  </select>
                </label>
                {isLocalPathSource(repositoryForm.sourceType) ? (
                  <label>
                    <span>Server path</span>
                    <input
                      value={repositoryForm.localPath}
                      onChange={(event) => setRepositoryForm((current) => ({ ...current, localPath: event.target.value }))}
                      placeholder="/workspace/sources/backend-api"
                    />
                    <small className="muted">This path must be mounted and visible inside the API/indexer container or server.</small>
                  </label>
                ) : null}
                {isGitSource(repositoryForm.sourceType) ? (
                  <label>
                    <span>Repository URL</span>
                    <input
                      value={repositoryForm.remoteUrl}
                      onChange={(event) => setRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))}
                      placeholder="https://github.com/example/backend-api"
                    />
                  </label>
                ) : null}
                <label>
                  <span>Default branch</span>
                  <input
                    value={repositoryForm.defaultBranch}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))}
                    placeholder="main"
                  />
                </label>
                <label>
                  <span>Metadata JSON</span>
                  <textarea
                    value={repositoryForm.metadataJson}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, metadataJson: event.target.value }))}
                    placeholder='{"owner":"architecture"}'
                  />
                </label>
                <div className="actions actions--inline browser-dialog__form-actions">
                  <button type="submit">Create source tree</button>
                  <button type="button" className="button-secondary" onClick={() => setIsAddDialogOpen(false)}>Cancel</button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
