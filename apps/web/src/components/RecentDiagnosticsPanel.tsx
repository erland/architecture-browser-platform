import type { SnapshotOverview } from "../appModel";

type RecentDiagnosticsPanelProps = { snapshotOverview: SnapshotOverview };

export function RecentDiagnosticsPanel({ snapshotOverview }: RecentDiagnosticsPanelProps) {
  return (
    <div className="card card--nested">
      <div className="section-heading"><h3>Recent diagnostics</h3><span className="badge">{snapshotOverview.recentDiagnostics.length}</span></div>
      <div className="stack stack--compact browser-list-scroll">
        {snapshotOverview.recentDiagnostics.map((diagnostic) => (
          <div key={diagnostic.externalId} className="audit-item">
            <strong>{diagnostic.code}</strong>
            <span>{diagnostic.severity}</span>
            <span>{diagnostic.message}</span>
            <span>{diagnostic.filePath ?? diagnostic.scopeId ?? diagnostic.entityId ?? "—"}</span>
          </div>
        ))}
        {!snapshotOverview.recentDiagnostics.length ? <p className="muted">No diagnostics recorded for this snapshot.</p> : null}
      </div>
    </div>
  );
}
