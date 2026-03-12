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
    <div className="card card--nested">
      <div className="section-heading"><h3>Search and entity detail</h3><span className="badge">Step 10</span></div>
      <div className="split-grid split-grid--compact">
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
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Searchable entities</h4><p>{searchView.summary.searchableEntityCount}</p></div>
            <div className="card card--nested"><h4>Matches</h4><p>{searchView.summary.totalMatchCount}</p></div>
            <div className="card card--nested"><h4>Visible results</h4><p>{searchView.summary.visibleResultCount}</p></div>
            <div className="card card--nested"><h4>Scope</h4><p>{searchView.scope.path}</p></div>
          </div>
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Visible kinds</h4><p>{summarizeCounts(searchView.visibleKinds)}</p></div>
            <div className="card card--nested"><h4>Query</h4><p>{searchView.query || "—"}</p></div>
            <div className="card card--nested"><h4>Limit</h4><p>{searchView.summary.limit}</p></div>
            <div className="card card--nested"><h4>Status</h4><p>{searchView.summary.queryBlank ? "Enter a query" : (searchView.results.length ? "Results ready" : "No matches")}</p></div>
          </div>

          <div className="card card--nested">
            <div className="section-heading"><h4>Results</h4><span className="badge">{searchView.results.length}</span></div>
            <div className="stack stack--compact">
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

          {entityDetail ? (
            <div className="stack stack--compact">
              <div className="card card--nested">
                <div className="section-heading"><h4>Entity detail</h4><span className="badge">{entityDetail.entity.kind}</span></div>
                <p><strong>{entityDetail.entity.displayName ?? entityDetail.entity.name}</strong></p>
                <p className="muted">{entityDetail.entity.scopePath}</p>
                <p>{entityDetail.entity.inboundRelationshipCount} inbound · {entityDetail.entity.outboundRelationshipCount} outbound · {entityDetail.entity.sourceRefCount} source refs</p>
                <p>{entityDetail.entity.summary ?? "No summary available."}</p>
              </div>

              <div className="split-grid split-grid--compact">
                <div className="card card--nested"><h4>Related kinds</h4><p>{summarizeCounts(entityDetail.relatedKinds)}</p></div>
                <div className="card card--nested"><h4>Scope</h4><p>{entityDetail.scope.path}</p></div>
                <div className="card card--nested"><h4>Origin</h4><p>{entityDetail.entity.origin ?? "—"}</p></div>
                <div className="card card--nested"><h4>Metadata</h4><p>{entityDetail.metadataJson ? "Available" : "—"}</p></div>
              </div>

              <div className="card card--nested">
                <div className="section-heading"><h4>Source context</h4><span className="badge">{entityDetail.sourceRefs.length}</span></div>
                <div className="stack stack--compact">
                  {entityDetail.sourceRefs.map((sourceRef, index) => (
                    <div key={`${sourceRef.path ?? "source"}-${index}`} className="audit-item">
                      <strong>{sourceRef.path ?? "Unknown path"}</strong>
                      <span>{sourceRef.startLine ?? "—"}–{sourceRef.endLine ?? "—"}</span>
                      <span>{sourceRef.snippet ?? "No snippet"}</span>
                    </div>
                  ))}
                  {!entityDetail.sourceRefs.length ? <p className="muted">No source references available.</p> : null}
                </div>
                {entityDetail.metadataJson ? <pre>{entityDetail.metadataJson}</pre> : null}
              </div>

              <div className="split-grid split-grid--compact">
                <div className="card card--nested">
                  <div className="section-heading"><h4>Inbound relationships</h4><span className="badge">{entityDetail.inboundRelationships.length}</span></div>
                  <div className="stack stack--compact">
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
                  <div className="stack stack--compact">
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
            </div>
          ) : null}
        </div>
      ) : <p className="muted">Search and entity detail view will appear when a snapshot is available.</p>}
    </div>
  );
}
