import { summarizeEntryKinds } from "../entryPointViewModel";
import type { EntryPointPanelProps } from "./snapshotCatalogTypes";

export function EntryPointPanel({
  flattenedLayoutNodes,
  selectedEntryPointScopeId,
  setSelectedEntryPointScopeId,
  entryCategory,
  setEntryCategory,
  entryPointView,
  entryPointOptions,
  focusedEntryPointId,
  setFocusedEntryPointId,
}: EntryPointPanelProps) {
  return (
    <div className="card card--nested">
      <div className="section-heading"><h3>Entry points and data/integration surfaces</h3><span className="badge">Step 9</span></div>
      <div className="split-grid split-grid--compact">
        <label>
          <span>Scope filter</span>
          <select value={selectedEntryPointScopeId} onChange={(event) => setSelectedEntryPointScopeId(event.target.value)}>
            <option value="">Repository-wide</option>
            {flattenedLayoutNodes.map((node) => (
              <option key={node.externalId} value={node.externalId}>{`${"  ".repeat(node.depth)}${node.displayName ?? node.name}`}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select value={entryCategory} onChange={(event) => setEntryCategory(event.target.value as typeof entryCategory)}>
            <option value="ALL">All</option>
            <option value="ENTRY_POINT">Entry points</option>
            <option value="DATA">Data stores/adapters</option>
            <option value="INTEGRATION">Channels/external systems</option>
          </select>
        </label>
        <label>
          <span>Detail focus</span>
          <select value={focusedEntryPointId} onChange={(event) => setFocusedEntryPointId(event.target.value)}>
            <option value="">No focused item</option>
            {entryPointOptions.map((item) => (
              <option key={item.externalId} value={item.externalId}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      {entryPointView ? (
        <div className="stack stack--compact">
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Visible items</h4><p>{entryPointView.summary.visibleItemCount}</p></div>
            <div className="card card--nested"><h4>Entry points</h4><p>{entryPointView.summary.entryPointCount}</p></div>
            <div className="card card--nested"><h4>Data</h4><p>{entryPointView.summary.dataCount}</p></div>
            <div className="card card--nested"><h4>Integrations</h4><p>{entryPointView.summary.integrationCount}</p></div>
          </div>
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Relevant inventory</h4><p>{entryPointView.summary.totalRelevantItemCount}</p></div>
            <div className="card card--nested"><h4>Linked relationships</h4><p>{entryPointView.summary.relationshipCount}</p></div>
            <div className="card card--nested"><h4>Visible kinds</h4><p>{summarizeEntryKinds(entryPointView.items)}</p></div>
            <div className="card card--nested"><h4>Scope</h4><p>{entryPointView.scope.path}</p></div>
          </div>

          {entryPointView.focus ? (
            <div className="card card--nested">
              <div className="section-heading"><h4>Focused detail</h4><span className="badge">{entryPointView.focus.item.kind}</span></div>
              <p><strong>{entryPointView.focus.item.displayName ?? entryPointView.focus.item.name}</strong></p>
              <p className="muted">{entryPointView.focus.item.scopePath}</p>
              <p>{entryPointView.focus.item.inboundRelationshipCount} inbound · {entryPointView.focus.item.outboundRelationshipCount} outbound · {entryPointView.focus.item.sourceRefCount} source refs</p>
              <p>{entryPointView.focus.item.sourcePath ?? "No source path"}</p>
              {entryPointView.focus.item.sourceSnippet ? <code>{entryPointView.focus.item.sourceSnippet}</code> : null}
            </div>
          ) : null}

          <div className="card card--nested">
            <div className="section-heading"><h4>Visible items</h4><span className="badge">{entryPointView.items.length}</span></div>
            <div className="stack stack--compact">
              {entryPointView.items.map((item) => (
                <button key={item.externalId} type="button" className={`list-item ${item.externalId === focusedEntryPointId ? "list-item--active" : ""}`} onClick={() => setFocusedEntryPointId((current) => current === item.externalId ? "" : item.externalId)}>
                  <strong>{item.displayName ?? item.name}</strong>
                  <span>{item.kind} · {item.scopePath}</span>
                  <span>{item.inboundRelationshipCount} inbound · {item.outboundRelationshipCount} outbound · {item.relatedKinds.length ? item.relatedKinds.join(", ") : "—"}</span>
                </button>
              ))}
              {!entryPointView.items.length ? <p className="muted">No items match the current filter.</p> : null}
            </div>
          </div>

          {entryPointView.focus ? (
            <div className="split-grid split-grid--compact">
              <div className="card card--nested">
                <div className="section-heading"><h4>Inbound relationships</h4><span className="badge">{entryPointView.focus.inboundRelationships.length}</span></div>
                <div className="stack stack--compact">
                  {entryPointView.focus.inboundRelationships.map((relationship) => (
                    <div key={relationship.externalId} className="audit-item">
                      <strong>{relationship.otherDisplayName}</strong>
                      <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                      <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card card--nested">
                <div className="section-heading"><h4>Outbound relationships</h4><span className="badge">{entryPointView.focus.outboundRelationships.length}</span></div>
                <div className="stack stack--compact">
                  {entryPointView.focus.outboundRelationships.map((relationship) => (
                    <div key={relationship.externalId} className="audit-item">
                      <strong>{relationship.otherDisplayName}</strong>
                      <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                      <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : <p className="muted">Entry-point and integration view will appear when a snapshot is available.</p>}
    </div>
  );
}
