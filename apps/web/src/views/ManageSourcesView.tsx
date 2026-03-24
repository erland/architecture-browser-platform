import { useState } from 'react';
import { RepositoriesView } from './RepositoriesView';
import { SnapshotsView } from './SnapshotsView';

type ManageSourcesViewProps = {
  onOpenBrowser: () => void;
  onOpenCompare: () => void;
  onOpenWorkspaces: () => void;
};

type ManageSourcesTab = 'source-trees' | 'indexed-versions';

export function ManageSourcesView({ onOpenBrowser, onOpenCompare, onOpenWorkspaces }: ManageSourcesViewProps) {
  const [activeTab, setActiveTab] = useState<ManageSourcesTab>('source-trees');

  return (
    <div className="content-stack">
      <section className="card section-intro">
        <p className="eyebrow">Manage sources</p>
        <h2>Unified source tree and indexed version workflow</h2>
        <p className="lead">
          Add source trees, trigger indexing, and review indexed versions here so Browser can stay focused on architecture analysis.
        </p>
        <div className="selection-summary">
          <span className="badge">Source trees</span>
          <span className="badge">Indexed versions</span>
          <span className="badge">Browser handoff</span>
        </div>
        <div className="actions actions--wrap">
          <button type="button" onClick={() => setActiveTab('source-trees')} aria-pressed={activeTab === 'source-trees'}>
            Source trees
          </button>
          <button type="button" className="button-secondary" onClick={() => setActiveTab('indexed-versions')} aria-pressed={activeTab === 'indexed-versions'}>
            Indexed versions
          </button>
          <button type="button" className="button-secondary" onClick={onOpenBrowser}>Back to Browser</button>
          <button type="button" className="button-secondary" onClick={onOpenWorkspaces}>Manage workspace context</button>
        </div>
      </section>

      {activeTab === 'source-trees' ? (
        <RepositoriesView onOpenBrowser={onOpenBrowser} onOpenSnapshots={() => setActiveTab('indexed-versions')} />
      ) : (
        <SnapshotsView onOpenBrowser={onOpenBrowser} onOpenCompare={onOpenCompare} onOpenRepositories={() => setActiveTab('source-trees')} />
      )}
    </div>
  );
}
