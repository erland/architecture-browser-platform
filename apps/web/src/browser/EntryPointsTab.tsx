import { EntryPointPanel } from '../components/EntryPointPanel';
import type { EntryPointPanelProps } from '../components/snapshotCatalogTypes';

export function EntryPointsTab(props: EntryPointPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="card browser-tab-shell__intro">
        <p className="eyebrow">Browser / Entry points</p>
        <h2>Entry and integration starting points</h2>
        <p className="muted">
          Separate entry analysis from the rest of the browser so inbound flows, integrations, and focused detail can use the full workspace width.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <EntryPointPanel {...props} />
      </section>
    </div>
  );
}
