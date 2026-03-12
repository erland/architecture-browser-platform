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
    <div className="card card--nested">
      <div className="section-heading"><h3>Dependency and relationship view</h3><span className="badge">Step 8</span></div>
      <div className="split-grid split-grid--compact">
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
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Scope entities</h4><p>{dependencyView.summary.scopeEntityCount}</p></div>
            <div className="card card--nested"><h4>Visible entities</h4><p>{dependencyView.summary.visibleEntityCount}</p></div>
            <div className="card card--nested"><h4>Relationships</h4><p>{dependencyView.summary.visibleRelationshipCount}</p></div>
            <div className="card card--nested"><h4>Kinds</h4><p>{summarizeDependencyKinds(dependencyView.relationships)}</p></div>
          </div>

          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Internal</h4><p>{dependencyView.summary.internalRelationshipCount}</p></div>
            <div className="card card--nested"><h4>Inbound</h4><p>{dependencyView.summary.inboundRelationshipCount}</p></div>
            <div className="card card--nested"><h4>Outbound</h4><p>{dependencyView.summary.outboundRelationshipCount}</p></div>
            <div className="card card--nested"><h4>Scope</h4><p>{dependencyView.scope.path}</p></div>
          </div>

          {dependencyView.focus ? (
            <div className="card card--nested">
              <div className="section-heading"><h4>Focused entity</h4><span className="badge">{dependencyView.focus.entity.kind}</span></div>
              <p><strong>{dependencyView.focus.entity.displayName ?? dependencyView.focus.entity.name}</strong></p>
              <p className="muted">{dependencyView.focus.entity.scopePath}</p>
              <p>{dependencyView.focus.inboundRelationshipCount} inbound · {dependencyView.focus.outboundRelationshipCount} outbound</p>
            </div>
          ) : null}

          <div className="card card--nested">
            <div className="section-heading"><h4>Visible entities</h4><span className="badge">{dependencyView.entities.length}</span></div>
            <div className="stack stack--compact">
              {dependencyView.entities.map((entity) => (
                <button key={entity.externalId} type="button" className={`list-item ${entity.externalId === focusedDependencyEntityId ? "list-item--active" : ""}`} onClick={() => setFocusedDependencyEntityId((current) => current === entity.externalId ? "" : entity.externalId)}>
                  <strong>{entity.displayName ?? entity.name}</strong>
                  <span>{entity.kind} · {entity.inScope ? "in scope" : "external neighbor"}</span>
                  <span>{entity.inboundCount} inbound · {entity.outboundCount} outbound</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card card--nested">
            <div className="section-heading"><h4>Relationship graph</h4><span className="badge">{dependencyView.relationships.length}</span></div>
            <div className="stack stack--compact">
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
          </div>
        </div>
      ) : <p className="muted">Dependency view will appear when a snapshot is available.</p>}
    </div>
  );
}
