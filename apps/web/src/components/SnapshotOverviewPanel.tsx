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
        <div className="browser-tool-summary-strip top-gap">
          <span className="badge">Scope kinds: {summarizeCounts(snapshotOverview.scopeKinds)}</span>
          <span className="badge">Entity kinds: {summarizeCounts(snapshotOverview.entityKinds)}</span>
          <span className="badge">Relationship kinds: {summarizeCounts(snapshotOverview.relationshipKinds)}</span>
          <span className="badge">Diagnostics: {summarizeCounts(snapshotOverview.diagnosticCodes)}</span>
        </div>
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
          <details className="card browser-collapsible-panel top-gap">
            <summary>Warnings ({snapshotOverview.warnings.length})</summary>
            <div className="stack stack--compact top-gap">
              {snapshotOverview.warnings.map((warning) => <p key={warning} className="warning">{warning}</p>)}
            </div>
          </details>
        ) : null}
      </div>

      <details className="card browser-collapsible-panel" open={snapshotOverview.topScopes.length <= 5}>
        <summary>Top scopes ({snapshotOverview.topScopes.length})</summary>
        <div className="stack stack--compact top-gap">
          {snapshotOverview.topScopes.map((scope) => <div key={scope.externalId} className="summary-row"><strong>{scope.name}</strong><span>{scope.count} facts</span></div>)}
          {!snapshotOverview.topScopes.length ? <p className="muted">No scope breakdown available.</p> : null}
        </div>
      </details>
    </>
  );
}
