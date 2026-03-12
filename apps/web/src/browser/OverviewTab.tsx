import { RecentDiagnosticsPanel } from '../components/RecentDiagnosticsPanel';
import { SnapshotOverviewPanel } from '../components/SnapshotOverviewPanel';
import type { SnapshotOverviewPanelProps } from '../components/snapshotCatalogTypes';
import type { SnapshotOverview } from '../appModel';

type OverviewTabProps = SnapshotOverviewPanelProps & {
  snapshotOverview: SnapshotOverview;
};

export function OverviewTab({ selectedSnapshot, snapshotOverview }: OverviewTabProps) {
  return (
    <div className="browser-tab-shell browser-tab-shell--overview">
      <section className="card browser-tab-shell__intro">
        <p className="eyebrow">Browser / Overview</p>
        <h2>Snapshot summary</h2>
        <p className="muted">
          Keep high-level context, completeness, and recent diagnostics visible without forcing the architect to scroll past unrelated admin sections.
        </p>
      </section>

      <section className="browser-tab-shell__content browser-overview-grid">
        <div className="content-stack">
          <SnapshotOverviewPanel
            selectedSnapshot={selectedSnapshot}
            snapshotOverview={snapshotOverview}
          />
        </div>
        <div className="content-stack">
          <RecentDiagnosticsPanel snapshotOverview={snapshotOverview} />
        </div>
      </section>
    </div>
  );
}
