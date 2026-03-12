import { SearchDetailPanel } from '../components/SearchDetailPanel';
import type { SearchDetailPanelProps } from '../components/snapshotCatalogTypes';

export function SearchTab(props: SearchDetailPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="card browser-tab-shell__intro">
        <p className="eyebrow">Browser / Search</p>
        <h2>Search and entity drill-down</h2>
        <p className="muted">
          Let the result list and entity detail dominate the screen so architects can pivot quickly between search results and relationship context.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <SearchDetailPanel {...props} />
      </section>
    </div>
  );
}
