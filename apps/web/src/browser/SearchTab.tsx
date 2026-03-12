import { SearchDetailPanel } from '../components/SearchDetailPanel';
import type { SearchDetailPanelProps } from '../components/snapshotCatalogTypes';

export function SearchTab(props: SearchDetailPanelProps) {
  return (
    <div className="content-stack browser-tab-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser / Search</p>
        <h2>Search and entity drill-down</h2>
        <p className="lead">
          This tab wraps the existing search and entity detail flow so architects can search the snapshot without competing visually with layout or dependency tools.
        </p>
      </section>

      <SearchDetailPanel {...props} />
    </div>
  );
}
