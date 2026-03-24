import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { emptyRepositoryForm, type Repository, type RepositorySourceType, type RepositoryUpdateRequest, type Workspace } from '../appModel';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';

export type BrowserSourceTreeSwitcherDialogProps = {
  isOpen: boolean;
  items: SourceTreeLauncherItem[];
  repositories: Repository[];
  selectedWorkspace: Workspace | null;
  onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
  onCreateRepository: (payload: typeof emptyRepositoryForm) => Promise<void>;
  onInitializeWorkspace: () => Promise<void>;
  onRequestReindex: (repository: Repository) => Promise<void>;
  onArchiveRepository: (repository: Repository) => Promise<void>;
  onUpdateRepository: (repository: Repository, payload: RepositoryUpdateRequest) => Promise<void>;
  onClose: () => void;
};

function buildInitialRepositoryForm() {
  return { ...emptyRepositoryForm };
}

function isGitSource(sourceType: RepositorySourceType) {
  return sourceType === 'GIT';
}

function isLocalSource(sourceType: RepositorySourceType) {
  return sourceType === 'LOCAL_PATH';
}

function formatLastIndexedLabel(value: string | null) {
  return value ? `Indexed ${value}` : 'Not indexed yet';
}

export function BrowserSourceTreeSwitcherDialog({
  isOpen,
  items,
  repositories,
  selectedWorkspace,
  onSelectSourceTree,
  onCreateRepository,
  onInitializeWorkspace,
  onRequestReindex,
  onArchiveRepository,
  onUpdateRepository,
  onClose,
}: BrowserSourceTreeSwitcherDialogProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [repositoryForm, setRepositoryForm] = useState(buildInitialRepositoryForm);
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
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddDialogOpen, editRepositoryId, onClose]);

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

  const handleOpenAddDialog = () => {
    setRepositoryForm(buildInitialRepositoryForm());
    setIsAddDialogOpen(true);
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
      : window.confirm(`Archive source tree "${item.sourceTreeLabel}"?`);
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

  const handleSelect = (item: SourceTreeLauncherItem) => {
    onSelectSourceTree(item);
    onClose();
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
              <h4>Initialize source trees</h4>
              <p className="muted">Browser keeps a single source tree catalog behind the scenes. Initialize it once to start registering and indexing source trees.</p>
              <div className="browser-dialog__empty-actions">
                <button type="button" onClick={() => void onInitializeWorkspace()}>Initialize source tree catalog</button>
              </div>
            </section>
          ) : null}

          <div className="browser-dialog__source-list" role="list" aria-label="Source tree management list">
            {items.map((item) => {
              const busy = actionRepositoryId === item.repositoryId;
              const canOpen = item.latestSnapshotId !== null;
              const repository = repositoriesById.get(item.repositoryId) ?? null;
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
                    <button type="button" onClick={() => handleSelect(item)} disabled={!canOpen || busy}>
                      {canOpen ? 'Open in Browser' : 'Select source tree'}
                    </button>
                    <button type="button" className="button-secondary" onClick={() => void handleReindex(item)} disabled={busy}>
                      Re-index
                    </button>
                    <button type="button" className="button-secondary" onClick={() => repository && handleOpenEditDialog(repository)} disabled={busy || !repository}>
                      Edit
                    </button>
                    <button type="button" className="button-secondary" onClick={() => void handleArchive(item)} disabled={busy}>
                      Archive
                    </button>
                  </div>
                </section>
              );
            })}
            {!items.length && selectedWorkspace ? <p className="muted">No source trees are available yet. Add one to start indexing.</p> : null}
          </div>
        </section>

        {isAddDialogOpen ? (
          <section className="card browser-dialog__nested-panel" aria-label="Add source tree">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Register source tree</p>
                <h3>Add source tree</h3>
              </div>
              <button type="button" className="button-secondary" onClick={() => setIsAddDialogOpen(false)}>Close</button>
            </div>
            <form className="grid-form" onSubmit={(event) => void handleCreate(event)}>
              <label>
                <span>Key</span>
                <input
                  value={repositoryForm.repositoryKey}
                  onChange={(event) => setRepositoryForm((current) => ({ ...current, repositoryKey: event.target.value }))}
                  placeholder="customs-api"
                  required
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={repositoryForm.name}
                  onChange={(event) => setRepositoryForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Customs API"
                  required
                />
              </label>
              <label>
                <span>Source type</span>
                <select
                  value={repositoryForm.sourceType}
                  onChange={(event) => setRepositoryForm((current) => ({
                    ...current,
                    sourceType: event.target.value as RepositorySourceType,
                    localPath: event.target.value === 'LOCAL_PATH' ? current.localPath : '',
                    remoteUrl: event.target.value === 'GIT' ? current.remoteUrl : '',
                  }))}
                >
                  <option value="LOCAL_PATH">Local path</option>
                  <option value="GIT">Git</option>
                </select>
              </label>
              {isLocalSource(repositoryForm.sourceType) ? (
                <label>
                  <span>Local path</span>
                  <input
                    value={repositoryForm.localPath}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, localPath: event.target.value }))}
                    placeholder="/repos/customs-api"
                    required
                  />
                </label>
              ) : null}
              {isGitSource(repositoryForm.sourceType) ? (
                <label>
                  <span>Remote URL</span>
                  <input
                    value={repositoryForm.remoteUrl}
                    onChange={(event) => setRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))}
                    placeholder="https://github.com/example/customs-api.git"
                    required
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
                  placeholder='{"team":"platform"}'
                />
              </label>
              <div className="actions">
                <button type="submit">Save source tree</button>
              </div>
            </form>
          </section>
        ) : null}

        {editRepositoryId ? (
          <section className="card browser-dialog__nested-panel" aria-label="Edit source tree">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Source tree settings</p>
                <h3>Edit source tree</h3>
              </div>
              <button type="button" className="button-secondary" onClick={() => setEditRepositoryId(null)}>Close</button>
            </div>
            <form className="grid-form" onSubmit={(event) => void handleUpdate(event)}>
              <label>
                <span>Name</span>
                <input value={editRepositoryForm.name} onChange={(event) => setEditRepositoryForm((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label>
                <span>Local path</span>
                <input value={editRepositoryForm.localPath ?? ''} onChange={(event) => setEditRepositoryForm((current) => ({ ...current, localPath: event.target.value }))} />
              </label>
              <label>
                <span>Remote URL</span>
                <input value={editRepositoryForm.remoteUrl ?? ''} onChange={(event) => setEditRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))} />
              </label>
              <label>
                <span>Default branch</span>
                <input value={editRepositoryForm.defaultBranch ?? ''} onChange={(event) => setEditRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))} />
              </label>
              <label>
                <span>Metadata JSON</span>
                <textarea value={editRepositoryForm.metadataJson ?? ''} onChange={(event) => setEditRepositoryForm((current) => ({ ...current, metadataJson: event.target.value }))} />
              </label>
              <div className="actions">
                <button type="submit">Save source tree</button>
              </div>
            </form>
          </section>
        ) : null}
      </section>
    </div>
  );
}
