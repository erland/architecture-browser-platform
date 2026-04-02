import { emptyRepositoryForm, type Repository, type RepositoryUpdateRequest, type Workspace } from '../../app-model';
import type { SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';
import { BrowserSourceTreeManagementList } from './BrowserSourceTreeManagementList';
import { BrowserSourceTreeCreateFormPanel, BrowserSourceTreeEditFormPanel } from './BrowserSourceTreeRepositoryFormPanel';
import { useBrowserSourceTreeSwitcherController } from './useBrowserSourceTreeSwitcherController';

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
  const controller = useBrowserSourceTreeSwitcherController({
    isOpen,
    items,
    repositories,
    onSelectSourceTree,
    onCreateRepository,
    onRequestReindex,
    onArchiveRepository,
    onUpdateRepository,
    onClose,
  });

  if (!isOpen) {
    return null;
  }

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
              <button type="button" onClick={controller.openAddDialog} disabled={!selectedWorkspace}>Add source tree</button>
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

          <BrowserSourceTreeManagementList
            items={items}
            repositoriesById={controller.repositoriesById}
            actionRepositoryId={controller.actionRepositoryId}
            selectedWorkspaceAvailable={selectedWorkspace !== null}
            onSelectItem={controller.selectItem}
            onReindexItem={controller.reindexItem}
            onEditRepository={controller.openEditDialog}
            onArchiveItem={controller.archiveItem}
          />
        </section>

        {controller.isAddDialogOpen ? (
          <BrowserSourceTreeCreateFormPanel
            repositoryForm={controller.repositoryForm}
            onChange={controller.setRepositoryForm}
            onSubmit={controller.createRepository}
            onClose={controller.closeAddDialog}
          />
        ) : null}

        {controller.editRepositoryId ? (
          <BrowserSourceTreeEditFormPanel
            repositoryForm={controller.editRepositoryForm}
            onChange={controller.setEditRepositoryForm}
            onSubmit={controller.updateRepository}
            onClose={controller.closeEditDialog}
          />
        ) : null}
      </section>
    </div>
  );
}
