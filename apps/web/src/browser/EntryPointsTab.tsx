import { EntryPointPanel } from '../components/EntryPointPanel';
import type { EntryPointPanelProps } from '../components/snapshotCatalogTypes';

export function EntryPointsTab(props: EntryPointPanelProps) {
  return (
    <div className="content-stack browser-tab-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser / Entry points</p>
        <h2>Entry and integration starting points</h2>
        <p className="lead">
          This tab keeps the current entry-point exploration behavior while making it an explicit browser screen for inbound flows and integration hotspots.
        </p>
      </section>

      <EntryPointPanel {...props} />
    </div>
  );
}
