import { LayoutExplorerPanel } from '../components/LayoutExplorerPanel';
import type { LayoutExplorerPanelProps } from '../components/snapshotCatalogTypes';

export function LayoutTab(props: LayoutExplorerPanelProps) {
  return (
    <div className="content-stack browser-tab-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser / Layout</p>
        <h2>Scope and layout explorer</h2>
        <p className="lead">
          This tab keeps the existing layout tree and scope detail behavior, but gives it a dedicated browser screen instead of sharing space with unrelated panels.
        </p>
      </section>

      <LayoutExplorerPanel {...props} />
    </div>
  );
}
