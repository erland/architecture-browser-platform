import { summarizeMatchReasons } from "../searchViewModel";
import { summarizeCounts } from "../appModel";
import type { SearchDetailPanelProps } from "./snapshotCatalogTypes";

export function SearchDetailPanel({
  flattenedLayoutNodes,
  selectedSearchScopeId,
  setSelectedSearchScopeId,
  searchQuery,
  setSearchQuery,
  searchView,
  searchResultOptions,
  selectedSearchEntityId,
  setSelectedSearchEntityId,
  entityDetail,
}: SearchDetailPanelProps) {
  return (
    <div className="card card--nested browser-tool-panel">
      <div className="section-heading section-heading--tight"><h3>Search and entity detail</h3><span className="badge">Focused workspace</span></div>
      <div className="split-grid split-grid--compact browser-tool-filters">
        <label>
          <span>Search query</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, kind, summary, source path" />
        </label>
        <label>
          <span>Scope filter</span>
          <select value={selectedSearchScopeId} onChange={(event) => setSelectedSearchScopeId(event.target.value)}>
            <option value="">Repository-wide</option>
            {flattenedLayoutNodes.map((node) => (
              <option key={node.externalId} value={node.externalId}>{`${"  ".repeat(node.depth)}${node.displayName ?? node.name}`}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Detail focus</span>
          <select value={selectedSearchEntityId} onChange={(event) => setSelectedSearchEntityId(event.target.value)}>
            <option value="">No selected entity</option>
            {searchResultOptions.map((result) => (
              <option key={result.externalId} value={result.externalId}>{result.label}</option>
            ))}
          </select>
        </label>
      </div>
      {searchView ? (
        <div className="stack stack--compact">
          <div className="browser-tool-summary-strip">
            <span className="badge">Matches: {searchView.summary.totalMatchCount}</span>
            <span className="badge">Visible results: {searchView.summary.visibleResultCount}</span>
            <span className="badge">Kinds: {summarizeCounts(searchView.visibleKinds)}</span>
            <span className="badge">Scope: {searchView.scope.path}</span>
            <span className="badge">Status: {searchView.summary.queryBlank ? "Enter a query" : (searchView.results.length ? "Results ready" : "No matches")}</span>
          </div>

          <div className="browser-tool-workspace">
            <div className="card card--nested">
              <div className="section-heading"><h4>Results</h4><span className="badge">{searchView.results.length}</span></div>
              <div className="stack stack--compact browser-list-scroll">
                {searchView.results.map((result) => (
                  <button key={result.externalId} type="button" className={`list-item ${result.externalId === selectedSearchEntityId ? "list-item--active" : ""}`} onClick={() => setSelectedSearchEntityId((current) => current === result.externalId ? "" : result.externalId)}>
                    <strong>{result.displayName ?? result.name}</strong>
                    <span>{result.kind} · {result.scopePath}</span>
                    <span>{result.inboundRelationshipCount} inbound · {result.outboundRelationshipCount} outbound · {result.sourceRefCount} source refs</span>
                    <span>{summarizeMatchReasons(result.matchReasons)}</span>
                  </button>
                ))}
                {!searchView.results.length ? <p className="muted">{searchView.summary.queryBlank ? "Enter a search query to look up entities in the imported snapshot." : "No entities matched the current search."}</p> : null}
              </div>
            </div>

            <div className="stack stack--compact">
              {entityDetail ? (
                <>
                  <div className="card card--nested">
                    <div className="section-heading"><h4>Entity detail</h4><span className="badge">{entityDetail.entity.kind}</span></div>
                    <p><strong>{entityDetail.entity.displayName ?? entityDetail.entity.name}</strong></p>
                    <p className="muted">{entityDetail.entity.scopePath}</p>
                    <p>{entityDetail.entity.inboundRelationshipCount} inbound · {entityDetail.entity.outboundRelationshipCount} outbound · {entityDetail.entity.sourceRefCount} source refs</p>
                    <p>{entityDetail.entity.summary ?? "No summary available."}</p>
                  </div>

                  <div className="browser-tool-summary-strip">
                    <span className="badge">Related kinds: {summarizeCounts(entityDetail.relatedKinds)}</span>
                    <span className="badge">Origin: {entityDetail.entity.origin ?? "—"}</span>
                    <span className="badge">Metadata: {entityDetail.metadataJson ? "Available" : "—"}</span>
                  </div>

                  <details className="card browser-collapsible-panel" open={entityDetail.sourceRefs.length > 0 && entityDetail.sourceRefs.length <= 3}>
                    <summary>Source context ({entityDetail.sourceRefs.length})</summary>
                    <div className="stack stack--compact top-gap browser-list-scroll">
                      {entityDetail.sourceRefs.map((sourceRef, index) => (
                        <div key={`${sourceRef.path ?? "source"}-${index}`} className="audit-item">
                          <strong>{sourceRef.path ?? "Unknown path"}</strong>
                          <span>{sourceRef.startLine ?? "—"}–{sourceRef.endLine ?? "—"}</span>
                          <span>{sourceRef.snippet ?? "No snippet"}</span>
                        </div>
                      ))}
                      {!entityDetail.sourceRefs.length ? <p className="muted">No source references available.</p> : null}
                    </div>
                    {entityDetail.metadataJson ? <pre className="top-gap">{entityDetail.metadataJson}</pre> : null}
                  </details>

                  <details className="card browser-collapsible-panel" open>
                    <summary>Relationships ({entityDetail.inboundRelationships.length + entityDetail.outboundRelationships.length})</summary>
                    <div className="split-grid split-grid--compact top-gap">
                      <div className="card card--nested">
                        <div className="section-heading"><h4>Inbound relationships</h4><span className="badge">{entityDetail.inboundRelationships.length}</span></div>
                        <div className="stack stack--compact browser-list-scroll">
                          {entityDetail.inboundRelationships.map((relationship) => (
                            <button key={relationship.externalId} type="button" className="list-item" onClick={() => setSelectedSearchEntityId(relationship.otherEntityId)}>
                              <strong>{relationship.otherDisplayName}</strong>
                              <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                              <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                            </button>
                          ))}
                          {!entityDetail.inboundRelationships.length ? <p className="muted">No inbound relationships.</p> : null}
                        </div>
                      </div>
                      <div className="card card--nested">
                        <div className="section-heading"><h4>Outbound relationships</h4><span className="badge">{entityDetail.outboundRelationships.length}</span></div>
                        <div className="stack stack--compact browser-list-scroll">
                          {entityDetail.outboundRelationships.map((relationship) => (
                            <button key={relationship.externalId} type="button" className="list-item" onClick={() => setSelectedSearchEntityId(relationship.otherEntityId)}>
                              <strong>{relationship.otherDisplayName}</strong>
                              <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                              <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                            </button>
                          ))}
                          {!entityDetail.outboundRelationships.length ? <p className="muted">No outbound relationships.</p> : null}
                        </div>
                      </div>
                    </div>
                  </details>
                </>
              ) : (
                <div className="card card--nested">
                  <h4>No entity selected</h4>
                  <p className="muted">Pick a search result to inspect its summary, source context, and relationships.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : <p className="muted">Search and entity detail view will appear when a snapshot is available.</p>}
    </div>
  );
}
