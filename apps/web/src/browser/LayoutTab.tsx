import { LayoutExplorerPanel } from '../components/LayoutExplorerPanel';
import type { LayoutExplorerPanelProps } from '../components/snapshotCatalogTypes';

export function LayoutTab(props: LayoutExplorerPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="browser-workspace-header">
        <div>
          <p className="eyebrow">Layout</p>
          <h2>Scope explorer</h2>
        </div>
        <p className="muted browser-workspace-header__hint">
          Pick a scope on the left and keep its detail on the right. Secondary summaries are collapsed so the tree stays central.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <LayoutExplorerPanel {...props} />
      </section>
    </div>
  );
}
