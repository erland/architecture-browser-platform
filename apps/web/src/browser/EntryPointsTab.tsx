import { EntryPointPanel } from '../components/EntryPointPanel';
import type { EntryPointPanelProps } from '../components/snapshotCatalogTypes';

export function EntryPointsTab(props: EntryPointPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="browser-workspace-header">
        <div>
          <p className="eyebrow">Entry points</p>
          <h2>Inbound and integration surfaces</h2>
        </div>
        <p className="muted browser-workspace-header__hint">
          Use this tab as a focused inventory and drill-down view for exposed entry points, data stores, and integration edges.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <EntryPointPanel {...props} />
      </section>
    </div>
  );
}
