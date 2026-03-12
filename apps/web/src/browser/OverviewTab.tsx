import { RecentDiagnosticsPanel } from '../components/RecentDiagnosticsPanel';
import { SnapshotOverviewPanel } from '../components/SnapshotOverviewPanel';
import type { SnapshotOverviewPanelProps } from '../components/snapshotCatalogTypes';
import type { SnapshotOverview } from '../appModel';

type OverviewTabProps = SnapshotOverviewPanelProps & {
  snapshotOverview: SnapshotOverview;
};

export function OverviewTab({ selectedSnapshot, snapshotOverview }: OverviewTabProps) {
  return (
    <div className="content-stack browser-tab-view">
      <section className="card section-intro">
        <p className="eyebrow">Browser / Overview</p>
        <h2>Snapshot summary</h2>
        <p className="lead">
          This tab wraps the existing overview and diagnostics panels so the browser route exposes summary context as its own task-focused screen.
        </p>
      </section>

      <div className="content-stack">
        <SnapshotOverviewPanel
          selectedSnapshot={selectedSnapshot}
          snapshotOverview={snapshotOverview}
        />
        <RecentDiagnosticsPanel snapshotOverview={snapshotOverview} />
      </div>
    </div>
  );
}
