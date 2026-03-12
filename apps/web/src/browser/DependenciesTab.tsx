import { DependencyPanel } from '../components/DependencyPanel';
import type { DependencyPanelProps } from '../components/snapshotCatalogTypes';

export function DependenciesTab(props: DependencyPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="browser-workspace-header">
        <div>
          <p className="eyebrow">Dependencies</p>
          <h2>Relationship workspace</h2>
        </div>
        <p className="muted browser-workspace-header__hint">
          Filters stay at the top, entity navigation stays on the left, and the focused relationship context stays on the right.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <DependencyPanel {...props} />
      </section>
    </div>
  );
}
