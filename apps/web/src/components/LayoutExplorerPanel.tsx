import { summarizeCounts } from "../appModel";
import type { LayoutExplorerPanelProps } from "./snapshotCatalogTypes";

export function LayoutExplorerPanel({
  flattenedLayoutNodes,
  selectedLayoutScopeId,
  setSelectedLayoutScopeId,
  layoutTree,
  layoutScopeDetail,
}: LayoutExplorerPanelProps) {
  return (
    <div className="card card--nested browser-tool-panel">
      <div className="section-heading section-heading--tight"><h3>Layout explorer</h3><span className="badge">Scope tree</span></div>
      {layoutTree ? (
        <div className="browser-tool-workspace browser-tool-workspace--wide">
          <div className="stack stack--compact">
            <div className="card card--nested">
              <div className="section-heading section-heading--tight"><h4>Tree</h4><span className="badge">{flattenedLayoutNodes.length}</span></div>
              <div className="stack stack--compact browser-list-scroll">
                {flattenedLayoutNodes.map((node) => (
                  <button
                    key={node.externalId}
                    type="button"
                    className={`list-item ${node.externalId === selectedLayoutScopeId ? "list-item--active" : ""}`}
                    style={{ paddingLeft: `${12 + node.depth * 16}px` }}
                    onClick={() => setSelectedLayoutScopeId(node.externalId)}
                  >
                    <strong>{node.displayName ?? node.name}</strong>
                    <span>{node.kind} · {node.directChildScopeCount} child scopes · {node.directEntityCount} direct entities</span>
                    <span>{node.descendantScopeCount} nested scopes · {node.descendantEntityCount} entities in subtree</span>
                  </button>
                ))}
              </div>
            </div>

            <details className="card browser-collapsible-panel">
              <summary>Layout summary</summary>
              <div className="split-grid split-grid--compact top-gap">
                <div className="card card--nested"><h4>Scope kinds</h4><p>{summarizeCounts(layoutTree.summary.scopeKinds)}</p></div>
                <div className="card card--nested"><h4>Entity kinds</h4><p>{summarizeCounts(layoutTree.summary.entityKinds)}</p></div>
              </div>
            </details>
          </div>

          <div className="stack stack--compact">
            {layoutScopeDetail ? (
              <>
                <div className="card card--nested">
                  <div className="section-heading">
                    <h4>{layoutScopeDetail.scope.displayName ?? layoutScopeDetail.scope.name}</h4>
                    <span className="badge">{layoutScopeDetail.scope.kind}</span>
                  </div>
                  <dl className="kv kv--compact">
                    <div><dt>Path</dt><dd>{layoutScopeDetail.scope.path}</dd></div>
                    <div><dt>Depth</dt><dd>{layoutScopeDetail.scope.depth}</dd></div>
                    <div><dt>Direct child scopes</dt><dd>{layoutScopeDetail.scope.directChildScopeCount}</dd></div>
                    <div><dt>Direct entities</dt><dd>{layoutScopeDetail.scope.directEntityCount}</dd></div>
                    <div><dt>Nested scopes</dt><dd>{layoutScopeDetail.scope.descendantScopeCount}</dd></div>
                    <div><dt>Entities in subtree</dt><dd>{layoutScopeDetail.scope.descendantEntityCount}</dd></div>
                  </dl>
                  <p className="muted top-gap">{layoutScopeDetail.breadcrumb.map((item) => item.displayName ?? item.name).join(" / ")}</p>
                </div>

                <div className="browser-tool-summary-strip">
                  <span className="badge">Entity kinds: {summarizeCounts(layoutScopeDetail.entityKinds)}</span>
                  <span className="badge">Child scopes: {layoutScopeDetail.childScopes.length || "—"}</span>
                  <span className="badge">Direct entities: {layoutScopeDetail.entities.length}</span>
                </div>

                <div className="card card--nested">
                  <div className="section-heading"><h4>Child scopes</h4><span className="badge">{layoutScopeDetail.childScopes.length}</span></div>
                  <div className="stack stack--compact">
                    {layoutScopeDetail.childScopes.map((scope) => (
                      <button key={scope.externalId} type="button" className="list-item" onClick={() => setSelectedLayoutScopeId(scope.externalId)}>
                        <strong>{scope.displayName ?? scope.name}</strong>
                        <span>{scope.kind} · {scope.directChildScopeCount} child scopes · {scope.directEntityCount} direct entities</span>
                      </button>
                    ))}
                    {!layoutScopeDetail.childScopes.length ? <p className="muted">No lower-level scopes under this node.</p> : null}
                  </div>
                </div>

                <details className="card browser-collapsible-panel" open={layoutScopeDetail.entities.length <= 8}>
                  <summary>Direct entities ({layoutScopeDetail.entities.length})</summary>
                  <div className="stack stack--compact top-gap">
                    {layoutScopeDetail.entities.map((entity) => (
                      <div key={entity.externalId} className="run-item">
                        <strong>{entity.displayName ?? entity.name}</strong>
                        <span>{entity.kind}{entity.origin ? ` · ${entity.origin}` : ""}</span>
                        <span>{entity.sourceRefCount} source references</span>
                        <span>{entity.summary ?? "—"}</span>
                      </div>
                    ))}
                    {!layoutScopeDetail.entities.length ? <p className="muted">No direct entities under this scope.</p> : null}
                  </div>
                </details>
              </>
            ) : <p className="muted">Select a scope to inspect its drill-down view.</p>}
          </div>
        </div>
      ) : <p className="muted">Layout explorer will appear when a snapshot is available.</p>}
    </div>
  );
}
