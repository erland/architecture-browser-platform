import type { Repository } from '../../app-model';
import type { SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';
import { formatLastIndexedLabel } from './useBrowserSourceTreeSwitcherController';

export type BrowserSourceTreeManagementListProps = {
  items: SourceTreeLauncherItem[];
  repositoriesById: Map<string, Repository>;
  actionRepositoryId: string | null;
  selectedWorkspaceAvailable: boolean;
  onSelectItem: (item: SourceTreeLauncherItem) => void;
  onReindexItem: (item: SourceTreeLauncherItem) => Promise<void>;
  onEditRepository: (repository: Repository) => void;
  onArchiveItem: (item: SourceTreeLauncherItem) => Promise<void>;
  onDownloadSnapshotJson: (item: SourceTreeLauncherItem) => Promise<void>;
};

export function BrowserSourceTreeManagementList({
  items,
  repositoriesById,
  actionRepositoryId,
  selectedWorkspaceAvailable,
  onSelectItem,
  onReindexItem,
  onEditRepository,
  onArchiveItem,
  onDownloadSnapshotJson,
}: BrowserSourceTreeManagementListProps) {
  return (
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
              <button type="button" onClick={() => onSelectItem(item)} disabled={!canOpen || busy}>
                {canOpen ? 'Open in Browser' : 'Select source tree'}
              </button>
              <button type="button" className="button-secondary" onClick={() => void onReindexItem(item)} disabled={busy}>
                Re-index
              </button>
              <button type="button" className="button-secondary" onClick={() => void onDownloadSnapshotJson(item)} disabled={!canOpen || busy}>
                Download JSON
              </button>
              <button type="button" className="button-secondary" onClick={() => repository && onEditRepository(repository)} disabled={busy || !repository}>
                Edit
              </button>
              <button type="button" className="button-secondary" onClick={() => void onArchiveItem(item)} disabled={busy}>
                Archive
              </button>
            </div>
          </section>
        );
      })}
      {!items.length && selectedWorkspaceAvailable ? <p className="muted">No source trees are available yet. Add one to start indexing.</p> : null}
    </div>
  );
}
