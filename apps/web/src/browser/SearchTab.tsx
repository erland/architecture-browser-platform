import { SearchDetailPanel } from '../components/SearchDetailPanel';
import type { SearchDetailPanelProps } from '../components/snapshotCatalogTypes';

export function SearchTab(props: SearchDetailPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="browser-workspace-header">
        <div>
          <p className="eyebrow">Search</p>
          <h2>Entity lookup workspace</h2>
        </div>
        <p className="muted browser-workspace-header__hint">
          Search, scan the result list, and inspect the selected entity without scrolling past multiple summary layers.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <SearchDetailPanel {...props} />
      </section>
    </div>
  );
}
