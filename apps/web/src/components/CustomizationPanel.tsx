import { formatDateTime, type OverlayKind } from "../appModel";
import { toSavedViewStateLabel } from "../savedViewModel";
import type { CustomizationPanelProps } from "./snapshotCatalogTypes";

export function CustomizationPanel({
  customizationOverview,
  selectedSnapshot,
  selectedSearchEntityId,
  selectedSearchScopeId,
  selectedLayoutScopeId,
  overlayName,
  setOverlayName,
  overlayKind,
  setOverlayKind,
  overlayNote,
  setOverlayNote,
  handleCreateOverlay,
  selectedOverlayId,
  setSelectedOverlayId,
  handleDeleteOverlay,
  savedViewName,
  setSavedViewName,
  handleSaveCurrentView,
  selectedSavedViewId,
  handleApplySavedView,
  handleDuplicateSavedView,
  handleDeleteSavedView,
}: CustomizationPanelProps) {
  return (
    <div className="card card--nested">
      <div className="section-heading"><h3>Overlays, notes, and saved views</h3><span className="badge">Step 11</span></div>
      {customizationOverview ? (
        <div className="stack stack--compact">
          <div className="split-grid split-grid--compact">
            <div className="card card--nested"><h4>Overlays</h4><p>{customizationOverview.overlays.length}</p></div>
            <div className="card card--nested"><h4>Saved views</h4><p>{customizationOverview.savedViews.length}</p></div>
            <div className="card card--nested"><h4>Focused entity</h4><p>{selectedSearchEntityId || "—"}</p></div>
            <div className="card card--nested"><h4>Focused scope</h4><p>{selectedSearchScopeId || selectedLayoutScopeId || "—"}</p></div>
          </div>

          <form className="split-grid split-grid--compact" onSubmit={handleCreateOverlay}>
            <label>
              <span>Overlay name</span>
              <input value={overlayName} onChange={(event) => setOverlayName(event.target.value)} placeholder="Review notes" />
            </label>
            <label>
              <span>Kind</span>
              <select value={overlayKind} onChange={(event) => setOverlayKind(event.target.value as OverlayKind)}>
                <option value="ANNOTATION">Annotation/note</option>
                <option value="TAG_SET">Tag set</option>
                <option value="HIGHLIGHT">Highlight</option>
                <option value="HEATMAP">Heatmap</option>
              </select>
            </label>
            <label className="grid-span-2">
              <span>Note</span>
              <input value={overlayNote} onChange={(event) => setOverlayNote(event.target.value)} placeholder="Stored separately from imported facts" />
            </label>
            <div className="grid-span-2">
              <button type="submit" disabled={!overlayName.trim()}>Create overlay from current focus</button>
            </div>
          </form>

          <div className="card card--nested">
            <div className="section-heading"><h4>Stored overlays</h4><span className="badge">{customizationOverview.overlays.length}</span></div>
            <div className="stack stack--compact">
              {customizationOverview.overlays.map((overlay) => (
                <div key={overlay.id} className={`list-item ${overlay.id === selectedOverlayId ? "list-item--active" : ""}`}>
                  <strong>{overlay.name}</strong>
                  <span>{overlay.kind} · {overlay.targetEntityCount} entities · {overlay.targetScopeCount} scopes</span>
                  <span>{overlay.note || "No note"}</span>
                  <div className="button-row">
                    <button type="button" onClick={() => setSelectedOverlayId(overlay.id)}>Inspect</button>
                    <button type="button" onClick={() => handleDeleteOverlay(overlay.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {!customizationOverview.overlays.length ? <p className="muted">No overlays or notes stored for this snapshot yet.</p> : null}
            </div>
            {selectedOverlayId ? <pre>{customizationOverview.overlays.find((overlay) => overlay.id === selectedOverlayId)?.definitionJson}</pre> : null}
          </div>

          <form className="split-grid split-grid--compact" onSubmit={handleSaveCurrentView}>
            <label className="grid-span-2">
              <span>Saved view name</span>
              <input value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} placeholder="Backend orders focus" />
            </label>
            <div className="grid-span-2">
              <button type="submit" disabled={!savedViewName.trim()}>Save current filters and focus</button>
            </div>
          </form>

          <div className="card card--nested">
            <div className="section-heading"><h4>Saved views</h4><span className="badge">{customizationOverview.savedViews.length}</span></div>
            <div className="stack stack--compact">
              {customizationOverview.savedViews.map((savedView) => (
                <div key={savedView.id} className={`list-item ${savedView.id === selectedSavedViewId ? "list-item--active" : ""}`}>
                  <strong>{toSavedViewStateLabel(savedView.name, savedView.viewType, selectedSnapshot?.snapshotKey ?? null)}</strong>
                  <span>Updated {formatDateTime(savedView.updatedAt)}</span>
                  <span>{savedView.queryJson ? "Query state saved" : "No query state"} · {savedView.layoutJson ? "Layout state saved" : "No layout state"}</span>
                  <div className="button-row">
                    <button type="button" onClick={() => void handleApplySavedView(savedView.id)}>Open</button>
                    <button type="button" onClick={() => void handleDuplicateSavedView(savedView.id)}>Duplicate</button>
                    <button type="button" onClick={() => void handleDeleteSavedView(savedView.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {!customizationOverview.savedViews.length ? <p className="muted">No saved views for this snapshot yet.</p> : null}
            </div>
          </div>
        </div>
      ) : <p className="muted">Customization view will appear when a snapshot is available.</p>}
    </div>
  );
}
