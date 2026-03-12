import { formatDateTime, summarizeCounts } from "../appModel";
import type { SnapshotOverviewPanelProps } from "./snapshotCatalogTypes";

export function SnapshotOverviewPanel({ selectedSnapshot, snapshotOverview }: SnapshotOverviewPanelProps) {
  return (
    <>
      <div className="card card--nested">
        <div className="section-heading">
          <h3>Overview</h3>
          <span className={`badge ${selectedSnapshot.completenessStatus === "PARTIAL" ? "badge--warning" : "badge--status"}`}>{selectedSnapshot.completenessStatus}</span>
        </div>
        <dl className="kv kv--compact">
          <div><dt>Repository</dt><dd>{selectedSnapshot.repositoryName ?? selectedSnapshot.repositoryKey ?? "—"}</dd></div>
          <div><dt>Imported</dt><dd>{formatDateTime(selectedSnapshot.importedAt)}</dd></div>
          <div><dt>Revision</dt><dd>{snapshotOverview.source.revision ?? "—"}</dd></div>
          <div><dt>Branch</dt><dd>{snapshotOverview.source.branch ?? "—"}</dd></div>
          <div><dt>Schema / Indexer</dt><dd>{selectedSnapshot.schemaVersion} / {selectedSnapshot.indexerVersion}</dd></div>
          <div><dt>Run outcome</dt><dd>{selectedSnapshot.derivedRunOutcome}</dd></div>
          <div><dt>Technologies</dt><dd>{snapshotOverview.run.detectedTechnologies.join(", ") || "—"}</dd></div>
          <div><dt>Files</dt><dd>{snapshotOverview.completeness.indexedFileCount}/{snapshotOverview.completeness.totalFileCount} indexed · {snapshotOverview.completeness.degradedFileCount} degraded</dd></div>
        </dl>
        {selectedSnapshot.completenessStatus === "PARTIAL" ? (
          <div className="stack stack--compact top-gap">
            <p className="warning">
              Partial means the snapshot was imported successfully, but some files were indexed with degraded completeness.
            </p>
            {snapshotOverview.completeness.notes.length ? (
              <ul className="stack stack--compact muted">
                {snapshotOverview.completeness.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            ) : null}
          </div>
        ) : null}
        {snapshotOverview.warnings.length ? (
          <div className="stack stack--compact top-gap">
            {snapshotOverview.warnings.map((warning) => <p key={warning} className="warning">{warning}</p>)}
          </div>
        ) : null}
      </div>

      <div className="split-grid split-grid--compact">
        <div className="card card--nested"><h3>Scope kinds</h3><p>{summarizeCounts(snapshotOverview.scopeKinds)}</p></div>
        <div className="card card--nested"><h3>Entity kinds</h3><p>{summarizeCounts(snapshotOverview.entityKinds)}</p></div>
        <div className="card card--nested"><h3>Relationship kinds</h3><p>{summarizeCounts(snapshotOverview.relationshipKinds)}</p></div>
        <div className="card card--nested"><h3>Diagnostics</h3><p>{summarizeCounts(snapshotOverview.diagnosticCodes)}</p></div>
      </div>

      <div className="card card--nested">
        <div className="section-heading"><h3>Top scopes</h3><span className="badge">{snapshotOverview.topScopes.length}</span></div>
        <div className="stack stack--compact">
          {snapshotOverview.topScopes.map((scope) => <div key={scope.externalId} className="summary-row"><strong>{scope.name}</strong><span>{scope.count} facts</span></div>)}
          {!snapshotOverview.topScopes.length ? <p className="muted">No scope breakdown available.</p> : null}
        </div>
      </div>
    </>
  );
}
