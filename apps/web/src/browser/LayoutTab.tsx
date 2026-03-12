import { LayoutExplorerPanel } from '../components/LayoutExplorerPanel';
import type { LayoutExplorerPanelProps } from '../components/snapshotCatalogTypes';

export function LayoutTab(props: LayoutExplorerPanelProps) {
  return (
    <div className="browser-tab-shell">
      <section className="card browser-tab-shell__intro">
        <p className="eyebrow">Browser / Layout</p>
        <h2>Scope and layout explorer</h2>
        <p className="muted">
          Keep the scope tree and drill-down detail in a wide workspace where the hierarchy can stay visible while the selected scope detail uses the rest of the screen.
        </p>
      </section>

      <section className="browser-tab-shell__content">
        <LayoutExplorerPanel {...props} />
      </section>
    </div>
  );
}
