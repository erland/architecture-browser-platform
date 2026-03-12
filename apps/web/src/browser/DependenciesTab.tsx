import { DependencyPanel } from '../components/DependencyPanel';
import type { DependencyPanelProps } from '../components/snapshotCatalogTypes';

export function DependenciesTab(props: DependencyPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="card browser-tab-shell__intro">
        <p className="eyebrow">Browser / Dependencies</p>
        <h2>Dependency exploration</h2>
        <p className="muted">
          Keep filters and relationship context close at hand while giving the entity list and relationship graph a much larger reading surface.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <DependencyPanel {...props} />
      </section>
    </div>
  );
}
