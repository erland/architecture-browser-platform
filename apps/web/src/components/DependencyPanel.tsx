import { summarizeDependencyKinds } from "../dependencyViewModel";
import type { DependencyPanelProps } from "./snapshotCatalogTypes";

export function DependencyPanel({
  flattenedLayoutNodes,
  selectedDependencyScopeId,
  setSelectedDependencyScopeId,
  dependencyDirection,
  setDependencyDirection,
  dependencyView,
  dependencyEntityOptions,
  focusedDependencyEntityId,
  setFocusedDependencyEntityId,
}: DependencyPanelProps) {
  return (
    <div className="card card--nested browser-tool-panel">
      <div className="section-heading section-heading--tight"><h3>Dependency and relationship view</h3><span className="badge">Focused workspace</span></div>
      <div className="split-grid split-grid--compact browser-tool-filters">
        <label>
          <span>Scope focus</span>
          <select value={selectedDependencyScopeId} onChange={(event) => { setSelectedDependencyScopeId(event.target.value); setFocusedDependencyEntityId(""); }}>
            <option value="">All scopes</option>
            {flattenedLayoutNodes.map((node) => (
              <option key={node.externalId} value={node.externalId}>{`${" ".repeat(node.depth * 2)}${node.displayName ?? node.name}`}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Direction</span>
          <select value={dependencyDirection} onChange={(event) => setDependencyDirection(event.target.value as typeof dependencyDirection)}>
            <option value="ALL">All</option>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
          </select>
        </label>
        <label>
          <span>Entity focus</span>
          <select value={focusedDependencyEntityId} onChange={(event) => setFocusedDependencyEntityId(event.target.value)}>
            <option value="">No focused entity</option>
            {dependencyEntityOptions.map((entity) => (
              <option key={entity.externalId} value={entity.externalId}>{entity.label}</option>
            ))}
          </select>
        </label>
      </div>
      {dependencyView ? (
        <div className="stack stack--compact">
          <div className="browser-tool-summary-strip">
            <span className="badge">Visible entities: {dependencyView.summary.visibleEntityCount}</span>
            <span className="badge">Relationships: {dependencyView.summary.visibleRelationshipCount}</span>
            <span className="badge">Kinds: {summarizeDependencyKinds(dependencyView.relationships)}</span>
            <span className="badge">Scope: {dependencyView.scope.path}</span>
          </div>

          {dependencyView.focus ? (
            <div className="card card--nested">
              <div className="section-heading"><h4>Focused entity</h4><span className="badge">{dependencyView.focus.entity.kind}</span></div>
              <p><strong>{dependencyView.focus.entity.displayName ?? dependencyView.focus.entity.name}</strong></p>
              <p className="muted">{dependencyView.focus.entity.scopePath}</p>
              <p>{dependencyView.focus.inboundRelationshipCount} inbound · {dependencyView.focus.outboundRelationshipCount} outbound</p>
            </div>
          ) : null}

          <div className="browser-tool-workspace">
            <div className="card card--nested">
              <div className="section-heading"><h4>Visible entities</h4><span className="badge">{dependencyView.entities.length}</span></div>
              <div className="stack stack--compact browser-list-scroll">
                {dependencyView.entities.map((entity) => (
                  <button key={entity.externalId} type="button" className={`list-item ${entity.externalId === focusedDependencyEntityId ? "list-item--active" : ""}`} onClick={() => setFocusedDependencyEntityId((current) => current === entity.externalId ? "" : entity.externalId)}>
                    <strong>{entity.displayName ?? entity.name}</strong>
                    <span>{entity.kind} · {entity.inScope ? "in scope" : "external neighbor"}</span>
                    <span>{entity.inboundCount} inbound · {entity.outboundCount} outbound</span>
                  </button>
                ))}
                {!dependencyView.entities.length ? <p className="muted">No entities match the current filter.</p> : null}
              </div>
            </div>

            <div className="stack stack--compact">
              <details className="card browser-collapsible-panel" open>
                <summary>Relationship graph ({dependencyView.relationships.length})</summary>
                <div className="stack stack--compact top-gap browser-list-scroll">
                  {dependencyView.relationships.map((relationship) => (
                    <div key={relationship.externalId} className="run-item">
                      <strong>{relationship.fromDisplayName}</strong>
                      <span>{relationship.fromKind} · {relationship.fromInScope ? "scope" : "external"}</span>
                      <span>↓ {relationship.kind} {relationship.crossesScopeBoundary ? "· boundary" : "· internal"}</span>
                      <strong>{relationship.toDisplayName}</strong>
                      <span>{relationship.toKind} · {relationship.toInScope ? "scope" : "external"}</span>
                      <span>{relationship.fromScopePath} → {relationship.toScopePath}</span>
                    </div>
                  ))}
                  {!dependencyView.relationships.length ? <p className="muted">No relationships match the current filter.</p> : null}
                </div>
              </details>

              <details className="card browser-collapsible-panel">
                <summary>More scope metrics</summary>
                <div className="browser-tool-summary-strip top-gap">
                  <span className="badge">Scope entities: {dependencyView.summary.scopeEntityCount}</span>
                  <span className="badge">Internal: {dependencyView.summary.internalRelationshipCount}</span>
                  <span className="badge">Inbound: {dependencyView.summary.inboundRelationshipCount}</span>
                  <span className="badge">Outbound: {dependencyView.summary.outboundRelationshipCount}</span>
                </div>
              </details>
            </div>
          </div>
        </div>
      ) : <p className="muted">Dependency view will appear when a snapshot is available.</p>}
    </div>
  );
}
