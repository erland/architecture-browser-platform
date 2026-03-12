import type { SnapshotCatalogSectionProps } from "./snapshotCatalogTypes";
import { formatDateTime } from "../appModel";
import { SnapshotOverviewPanel } from "./SnapshotOverviewPanel";
import { LayoutExplorerPanel } from "./LayoutExplorerPanel";
import { DependencyPanel } from "./DependencyPanel";
import { EntryPointPanel } from "./EntryPointPanel";
import { SearchDetailPanel } from "./SearchDetailPanel";
import { CustomizationPanel } from "./CustomizationPanel";
import { ComparisonPanel } from "./ComparisonPanel";
import { RecentDiagnosticsPanel } from "./RecentDiagnosticsPanel";

export function SnapshotCatalogSection(props: SnapshotCatalogSectionProps) {
  const {
    snapshots,
    selectedWorkspace,
    selectedSnapshotId,
    setSelectedSnapshotId,
    selectedSnapshot,
    snapshotOverview,
    flattenedLayoutNodes,
    selectedLayoutScopeId,
    setSelectedLayoutScopeId,
    layoutTree,
    layoutScopeDetail,
    selectedDependencyScopeId,
    setSelectedDependencyScopeId,
    dependencyDirection,
    setDependencyDirection,
    dependencyView,
    dependencyEntityOptions,
    focusedDependencyEntityId,
    setFocusedDependencyEntityId,
    selectedEntryPointScopeId,
    setSelectedEntryPointScopeId,
    entryCategory,
    setEntryCategory,
    entryPointView,
    entryPointOptions,
    focusedEntryPointId,
    setFocusedEntryPointId,
    selectedSearchScopeId,
    setSelectedSearchScopeId,
    searchQuery,
    setSearchQuery,
    searchView,
    searchResultOptions,
    selectedSearchEntityId,
    setSelectedSearchEntityId,
    entityDetail,
    customizationOverview,
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
    comparisonSnapshotId,
    setComparisonSnapshotId,
    comparisonOptions,
    snapshotComparison,
    showCatalogList = true,
  } = props;

  return (
    <article className="card">
      <div className="section-heading">
        <h2>Snapshot catalog</h2>
        <span className="badge">{snapshots.length}</span>
      </div>
      {selectedWorkspace ? (
        <div className={showCatalogList ? 'split-grid split-grid--wide' : 'stack stack--compact'}>
          {showCatalogList ? (
            <div className="stack stack--compact">
              {snapshots.map((snapshot) => (
                <button key={snapshot.id} type="button" className={`list-item ${snapshot.id === selectedSnapshotId ? "list-item--active" : ""}`} onClick={() => setSelectedSnapshotId(snapshot.id)}>
                  <strong>{snapshot.repositoryName ?? snapshot.repositoryKey ?? snapshot.repositoryRegistrationId}</strong>
                  <span>{snapshot.snapshotKey}</span>
                  <span>{snapshot.completenessStatus} · {snapshot.importedAt ? formatDateTime(snapshot.importedAt) : "—"}</span>
                  <span>{snapshot.entityCount} entities · {snapshot.relationshipCount} relationships · {snapshot.diagnosticCount} diagnostics</span>
                </button>
              ))}
              {!snapshots.length ? <p className="muted">No snapshots imported yet.</p> : null}
            </div>
          ) : null}

          <div className="stack stack--compact">
            {selectedSnapshot && snapshotOverview ? (
              <>
                <SnapshotOverviewPanel selectedSnapshot={selectedSnapshot} snapshotOverview={snapshotOverview} />
                <LayoutExplorerPanel
                  flattenedLayoutNodes={flattenedLayoutNodes}
                  selectedLayoutScopeId={selectedLayoutScopeId}
                  setSelectedLayoutScopeId={setSelectedLayoutScopeId}
                  layoutTree={layoutTree}
                  layoutScopeDetail={layoutScopeDetail}
                />
                <DependencyPanel
                  flattenedLayoutNodes={flattenedLayoutNodes}
                  selectedDependencyScopeId={selectedDependencyScopeId}
                  setSelectedDependencyScopeId={setSelectedDependencyScopeId}
                  dependencyDirection={dependencyDirection}
                  setDependencyDirection={setDependencyDirection}
                  dependencyView={dependencyView}
                  dependencyEntityOptions={dependencyEntityOptions}
                  focusedDependencyEntityId={focusedDependencyEntityId}
                  setFocusedDependencyEntityId={setFocusedDependencyEntityId}
                />
                <EntryPointPanel
                  flattenedLayoutNodes={flattenedLayoutNodes}
                  selectedEntryPointScopeId={selectedEntryPointScopeId}
                  setSelectedEntryPointScopeId={setSelectedEntryPointScopeId}
                  entryCategory={entryCategory}
                  setEntryCategory={setEntryCategory}
                  entryPointView={entryPointView}
                  entryPointOptions={entryPointOptions}
                  focusedEntryPointId={focusedEntryPointId}
                  setFocusedEntryPointId={setFocusedEntryPointId}
                />
                <SearchDetailPanel
                  flattenedLayoutNodes={flattenedLayoutNodes}
                  selectedSearchScopeId={selectedSearchScopeId}
                  setSelectedSearchScopeId={setSelectedSearchScopeId}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchView={searchView}
                  searchResultOptions={searchResultOptions}
                  selectedSearchEntityId={selectedSearchEntityId}
                  setSelectedSearchEntityId={setSelectedSearchEntityId}
                  entityDetail={entityDetail}
                />
                <CustomizationPanel
                  customizationOverview={customizationOverview}
                  selectedSnapshot={selectedSnapshot}
                  selectedSearchEntityId={selectedSearchEntityId}
                  selectedSearchScopeId={selectedSearchScopeId}
                  selectedLayoutScopeId={selectedLayoutScopeId}
                  overlayName={overlayName}
                  setOverlayName={setOverlayName}
                  overlayKind={overlayKind}
                  setOverlayKind={setOverlayKind}
                  overlayNote={overlayNote}
                  setOverlayNote={setOverlayNote}
                  handleCreateOverlay={handleCreateOverlay}
                  selectedOverlayId={selectedOverlayId}
                  setSelectedOverlayId={setSelectedOverlayId}
                  handleDeleteOverlay={handleDeleteOverlay}
                  savedViewName={savedViewName}
                  setSavedViewName={setSavedViewName}
                  handleSaveCurrentView={handleSaveCurrentView}
                  selectedSavedViewId={selectedSavedViewId}
                  handleApplySavedView={handleApplySavedView}
                  handleDuplicateSavedView={handleDuplicateSavedView}
                  handleDeleteSavedView={handleDeleteSavedView}
                />
                <ComparisonPanel
                  comparisonSnapshotId={comparisonSnapshotId}
                  setComparisonSnapshotId={setComparisonSnapshotId}
                  comparisonOptions={comparisonOptions}
                  snapshotComparison={snapshotComparison}
                />
                <RecentDiagnosticsPanel snapshotOverview={snapshotOverview} />
              </>
            ) : <p className="muted">Select a snapshot to inspect its overview.</p>}
          </div>
        </div>
      ) : <p className="muted">Select a workspace to browse imported snapshots.</p>}
    </article>
  );
}
