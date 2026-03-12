import { summarizeComparisonHeadline } from "../compareViewModel";
import type { ComparisonPanelProps } from "./snapshotCatalogTypes";

export function ComparisonPanel({ comparisonSnapshotId, setComparisonSnapshotId, comparisonOptions, snapshotComparison }: ComparisonPanelProps) {
  return (
    <div className="card card--nested">
      <div className="section-heading"><h3>Snapshot comparison summary</h3><span className="badge">Step 12</span></div>
      <div className="split-grid split-grid--compact">
        <label>
          <span>Compare current snapshot to</span>
          <select value={comparisonSnapshotId} onChange={(event) => setComparisonSnapshotId(event.target.value)}>
            <option value="">Select another snapshot</option>
            {comparisonOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      {snapshotComparison ? (
        <div className="stack stack--compact">
          <div className="card card--nested">
            <div className="section-heading"><h4>Headline</h4><span className="badge">{snapshotComparison.targetSnapshot.snapshotKey}</span></div>
            <p>{summarizeComparisonHeadline(snapshotComparison.summary)}</p>
            <p className="muted">Base {snapshotComparison.baseSnapshot.snapshotKey} → Target {snapshotComparison.targetSnapshot.snapshotKey}</p>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Added scopes</h4><p>{snapshotComparison.summary.addedScopeCount}</p></div>
            <div className="card card--nested"><h4>Removed scopes</h4><p>{snapshotComparison.summary.removedScopeCount}</p></div>
            <div className="card card--nested"><h4>Added entities</h4><p>{snapshotComparison.summary.addedEntityCount}</p></div>
            <div className="card card--nested"><h4>Removed entities</h4><p>{snapshotComparison.summary.removedEntityCount}</p></div>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Added relationships</h4><p>{snapshotComparison.summary.addedRelationshipCount}</p></div>
            <div className="card card--nested"><h4>Removed relationships</h4><p>{snapshotComparison.summary.removedRelationshipCount}</p></div>
            <div className="card card--nested"><h4>Added entry points</h4><p>{snapshotComparison.summary.addedEntryPointCount}</p></div>
            <div className="card card--nested"><h4>Changed integration/persistence</h4><p>{snapshotComparison.summary.changedIntegrationAndPersistenceCount}</p></div>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested">
              <div className="section-heading"><h4>Added entry points</h4><span className="badge">{snapshotComparison.addedEntryPoints.length}</span></div>
              <div className="stack stack--compact">
                {snapshotComparison.addedEntryPoints.map((item) => (
                  <div key={item.externalId} className="audit-item"><strong>{item.displayName}</strong><span>{item.kind} · {item.scopePath}</span></div>
                ))}
                {!snapshotComparison.addedEntryPoints.length ? <p className="muted">No added entry points.</p> : null}
              </div>
            </div>
            <div className="card card--nested">
              <div className="section-heading"><h4>Integration/persistence changes</h4><span className="badge">{snapshotComparison.changedIntegrationAndPersistence.length}</span></div>
              <div className="stack stack--compact">
                {snapshotComparison.changedIntegrationAndPersistence.map((item) => (
                  <div key={item.externalId} className="audit-item"><strong>{item.displayName}</strong><span>{item.kind} · {item.scopePath}</span></div>
                ))}
                {!snapshotComparison.changedIntegrationAndPersistence.length ? <p className="muted">No notable integration or persistence changes.</p> : null}
              </div>
            </div>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested">
              <div className="section-heading"><h4>Added dependencies</h4><span className="badge">{snapshotComparison.addedDependencies.length}</span></div>
              <div className="stack stack--compact">
                {snapshotComparison.addedDependencies.map((change) => (
                  <div key={change.externalId} className="audit-item"><strong>{change.label}</strong><span>{change.kind}</span><span>{change.fromDisplayName} → {change.toDisplayName}</span></div>
                ))}
                {!snapshotComparison.addedDependencies.length ? <p className="muted">No added dependency changes in preview.</p> : null}
              </div>
            </div>
            <div className="card card--nested">
              <div className="section-heading"><h4>Removed dependencies</h4><span className="badge">{snapshotComparison.removedDependencies.length}</span></div>
              <div className="stack stack--compact">
                {snapshotComparison.removedDependencies.map((change) => (
                  <div key={change.externalId} className="audit-item"><strong>{change.label}</strong><span>{change.kind}</span><span>{change.fromDisplayName} → {change.toDisplayName}</span></div>
                ))}
                {!snapshotComparison.removedDependencies.length ? <p className="muted">No removed dependency changes in preview.</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : <p className="muted">Select another snapshot to compare with the current one.</p>}
    </div>
  );
}
