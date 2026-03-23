import type { SourceTreeLauncherItem } from '../appModel.sourceTree';
import { formatTimestamp } from '../views/browserView.shared';

export type BrowserSourceTreeLauncherProps = {
  title: string;
  description: string;
  workspaceName: string | null;
  items: SourceTreeLauncherItem[];
  onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
  onOpenRepositories: () => void;
  onOpenSnapshots: () => void;
  onOpenWorkspaces: () => void;
};

export function BrowserSourceTreeLauncher({
  title,
  description,
  workspaceName,
  items,
  onSelectSourceTree,
  onOpenRepositories,
  onOpenSnapshots,
  onOpenWorkspaces,
}: BrowserSourceTreeLauncherProps) {
  return (
    <article className="card empty-state-card browser-empty-state" aria-label="Source tree launcher">
      <p className="eyebrow">Browser launcher</p>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {workspaceName ? (
        <p className="browser-empty-state__workspace-hint">Workspace context: <strong>{workspaceName}</strong></p>
      ) : null}

      {items.length ? (
        <div className="browser-source-tree-launcher">
          <div className="browser-source-tree-launcher__list" role="list" aria-label="Available source trees">
            {items.map((item) => {
              const buttonLabel = item.status === 'ready' ? 'Open in Browser' : 'Select source tree';
              return (
                <section key={item.id} className="browser-source-tree-launcher__item" role="listitem">
                  <div className="browser-source-tree-launcher__item-main">
                    <div>
                      <h3>{item.sourceTreeLabel}</h3>
                      <p className="muted">{item.sourceSummary}</p>
                    </div>
                    <div className="browser-source-tree-launcher__badges" aria-label="Source tree status">
                      <span className="badge">{item.sourceTreeKey}</span>
                      <span className={`badge ${item.status === 'ready' ? 'badge--status' : ''}`}>{item.indexedVersionLabel}</span>
                      <span className="badge">{item.latestImportedAt ? `Imported ${formatTimestamp(item.latestImportedAt)}` : 'No indexed version yet'}</span>
                    </div>
                  </div>
                  <div className="browser-source-tree-launcher__item-actions">
                    <button type="button" onClick={() => onSelectSourceTree(item)}>{buttonLabel}</button>
                    {item.status === 'empty' ? (
                      <button type="button" className="button-secondary" onClick={onOpenRepositories}>Manage sources</button>
                    ) : (
                      <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Indexed versions</button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="browser-source-tree-launcher browser-source-tree-launcher--empty">
          <p className="muted">No source trees are available in the current workspace context yet.</p>
        </div>
      )}

      <div className="actions">
        <button type="button" onClick={onOpenRepositories}>Manage sources</button>
        <button type="button" className="button-secondary" onClick={onOpenSnapshots}>View indexed versions</button>
        <button type="button" className="button-secondary" onClick={onOpenWorkspaces}>Manage workspace context</button>
      </div>
    </article>
  );
}
