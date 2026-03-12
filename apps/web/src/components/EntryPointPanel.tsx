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
    <div className="card card--nested browser-tool-panel">
      <div className="section-heading section-heading--tight"><h3>Entry points and integration surfaces</h3><span className="badge">Focused workspace</span></div>
      <div className="split-grid split-grid--compact browser-tool-filters">
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
          <div className="browser-tool-summary-strip">
            <span className="badge">Visible items: {entryPointView.summary.visibleItemCount}</span>
            <span className="badge">Entry points: {entryPointView.summary.entryPointCount}</span>
            <span className="badge">Data: {entryPointView.summary.dataCount}</span>
            <span className="badge">Integrations: {entryPointView.summary.integrationCount}</span>
            <span className="badge">Kinds: {summarizeEntryKinds(entryPointView.items)}</span>
          </div>

          <div className="browser-tool-workspace">
            <div className="card card--nested">
              <div className="section-heading"><h4>Visible items</h4><span className="badge">{entryPointView.items.length}</span></div>
              <div className="stack stack--compact browser-list-scroll">
                {entryPointView.items.map((item) => (
                  <button key={item.externalId} type="button" className={`list-item ${item.externalId === focusedEntryPointId ? "list-item--active" : ""}`} onClick={() => setFocusedEntryPointId((current) => current === item.externalId ? "" : item.externalId)}>
                    <strong>{item.displayName ?? item.name}</strong>
                    <span>{item.kind} · {item.scopePath}</span>
                    <span>{item.inboundRelationshipCount} inbound · {item.outboundRelationshipCount} outbound · {item.sourceRefCount} source refs</span>
                  </button>
                ))}
                {!entryPointView.items.length ? <p className="muted">No items match the current filters.</p> : null}
              </div>
            </div>

            <div className="stack stack--compact">
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

              <details className="card browser-collapsible-panel" open={Boolean(entryPointView.focus)}>
                <summary>Relationships {entryPointView.focus ? `(${entryPointView.focus.inboundRelationships.length + entryPointView.focus.outboundRelationships.length})` : ''}</summary>
                {entryPointView.focus ? (
                  <div className="split-grid split-grid--compact top-gap">
                    <div className="card card--nested">
                      <div className="section-heading"><h4>Inbound relationships</h4><span className="badge">{entryPointView.focus.inboundRelationships.length}</span></div>
                      <div className="stack stack--compact browser-list-scroll">
                        {entryPointView.focus.inboundRelationships.map((relationship) => (
                          <div key={relationship.externalId} className="audit-item">
                            <strong>{relationship.otherDisplayName}</strong>
                            <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                            <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                          </div>
                        ))}
                        {!entryPointView.focus.inboundRelationships.length ? <p className="muted">No inbound relationships.</p> : null}
                      </div>
                    </div>
                    <div className="card card--nested">
                      <div className="section-heading"><h4>Outbound relationships</h4><span className="badge">{entryPointView.focus.outboundRelationships.length}</span></div>
                      <div className="stack stack--compact browser-list-scroll">
                        {entryPointView.focus.outboundRelationships.map((relationship) => (
                          <div key={relationship.externalId} className="audit-item">
                            <strong>{relationship.otherDisplayName}</strong>
                            <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                            <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                          </div>
                        ))}
                        {!entryPointView.focus.outboundRelationships.length ? <p className="muted">No outbound relationships.</p> : null}
                      </div>
                    </div>
                  </div>
                ) : <p className="muted top-gap">Select an item to inspect its linked relationships.</p>}
              </details>

              <details className="card browser-collapsible-panel">
                <summary>More inventory metrics</summary>
                <div className="browser-tool-summary-strip top-gap">
                  <span className="badge">Relevant inventory: {entryPointView.summary.totalRelevantItemCount}</span>
                  <span className="badge">Linked relationships: {entryPointView.summary.relationshipCount}</span>
                  <span className="badge">Scope: {entryPointView.scope.path}</span>
                </div>
              </details>
            </div>
          </div>
        </div>
      ) : <p className="muted">Entry-point and integration view will appear when a snapshot is available.</p>}
    </div>
  );
}
