import { DependencyPanel } from '../components/DependencyPanel';
import type { DependencyPanelProps } from '../components/snapshotCatalogTypes';

export function DependenciesTab(props: DependencyPanelProps) {
  return (
    <div className="content-stack browser-tab-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser / Dependencies</p>
        <h2>Dependency exploration</h2>
        <p className="lead">
          This tab wraps the current dependency tooling so directional filtering and entity focus become a dedicated browser workflow.
        </p>
      </section>

      <DependencyPanel {...props} />
    </div>
  );
}
