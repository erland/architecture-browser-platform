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
      <section className="browser-workspace-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Snapshot summary</h2>
        </div>
        <p className="muted browser-workspace-header__hint">
          Keep the current snapshot readable at a glance. Less-frequent diagnostics stay available below without dominating the workspace.
        </p>
      </section>

      <section className="browser-tab-shell__content browser-overview-grid browser-overview-grid--clean">
        <div className="content-stack">
          <SnapshotOverviewPanel
            selectedSnapshot={selectedSnapshot}
            snapshotOverview={snapshotOverview}
          />
        </div>
        <details className="card browser-collapsible-panel" open={snapshotOverview.recentDiagnostics.length > 0 && snapshotOverview.recentDiagnostics.length <= 3}>
          <summary>Diagnostics ({snapshotOverview.recentDiagnostics.length})</summary>
          <div className="top-gap">
            <RecentDiagnosticsPanel snapshotOverview={snapshotOverview} />
          </div>
        </details>
      </section>
    </div>
  );
}
