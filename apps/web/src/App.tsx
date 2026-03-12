import { useState } from "react";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar";
import { WorkspaceManagementSection } from "./components/WorkspaceManagementSection";
import { SnapshotCatalogSection } from "./components/SnapshotCatalogSection";
import { OperationsAndAuditSection } from "./components/OperationsAndAuditSection";
import { useWorkspaceData } from "./hooks/useWorkspaceData";
import { useSnapshotExplorer } from "./hooks/useSnapshotExplorer";

export function App() {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspaceData = useWorkspaceData({ setBusyMessage, setError });
  const snapshotExplorer = useSnapshotExplorer(workspaceData.selectedWorkspaceId, workspaceData.snapshots, { setBusyMessage, setError });

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Architecture browser workspace</h1>
        <p className="lead">
          Step 9 extends the snapshot browser with entry-point and data/integration views so architects can inspect endpoints, startup points, data stores, channels,
          and external systems with scope filters, detail panels, and cross-links back to owners and source context.
        </p>
      </section>

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div><dt>Status</dt><dd>{workspaceData.health.status}</dd></div>
            <div><dt>Service</dt><dd>{workspaceData.health.service}</dd></div>
            <div><dt>Version</dt><dd>{workspaceData.health.version}</dd></div>
            <div><dt>Time</dt><dd>{workspaceData.health.time || "—"}</dd></div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <h2>Create workspace</h2>
          <form className="form" onSubmit={workspaceData.handleCreateWorkspace}>
            <label>
              <span>Workspace key</span>
              <input value={workspaceData.workspaceForm.workspaceKey} onChange={(event) => workspaceData.setWorkspaceForm((current) => ({ ...current, workspaceKey: event.target.value }))} placeholder="customs-core" />
            </label>
            <label>
              <span>Name</span>
              <input value={workspaceData.workspaceForm.name} onChange={(event) => workspaceData.setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Swedish Customs Core" />
            </label>
            <label>
              <span>Description</span>
              <textarea value={workspaceData.workspaceForm.description} onChange={(event) => workspaceData.setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Architecture review workspace for initial MVP repositories." />
            </label>
            <button type="submit">Create workspace</button>
          </form>
        </article>
      </section>

      <section className="workspace-layout">
        <WorkspaceSidebar
          workspaces={workspaceData.workspaces}
          selectedWorkspaceId={workspaceData.selectedWorkspaceId}
          setSelectedWorkspaceId={workspaceData.setSelectedWorkspaceId}
        />

        <div className="content-stack">
          <WorkspaceManagementSection
            selectedWorkspace={workspaceData.selectedWorkspace}
            workspaceEditor={workspaceData.workspaceEditor}
            setWorkspaceEditor={workspaceData.setWorkspaceEditor}
            handleUpdateWorkspace={workspaceData.handleUpdateWorkspace}
            handleArchiveWorkspace={workspaceData.handleArchiveWorkspace}
            repositories={workspaceData.repositories}
            repositoryForm={workspaceData.repositoryForm}
            setRepositoryForm={workspaceData.setRepositoryForm}
            handleCreateRepository={workspaceData.handleCreateRepository}
            repositoryEditor={workspaceData.repositoryEditor}
            setRepositoryEditor={workspaceData.setRepositoryEditor}
            handleUpdateRepository={workspaceData.handleUpdateRepository}
            runRequestForm={workspaceData.runRequestForm}
            setRunRequestForm={workspaceData.setRunRequestForm}
            latestRunByRepository={workspaceData.latestRunByRepository}
            selectRepositoryForEdit={workspaceData.selectRepositoryForEdit}
            handleRequestRun={workspaceData.handleRequestRun}
            handleArchiveRepository={workspaceData.handleArchiveRepository}
          />

          <SnapshotCatalogSection
            snapshots={workspaceData.snapshots}
            selectedWorkspace={workspaceData.selectedWorkspace}
            selectedSnapshotId={snapshotExplorer.selectedSnapshotId}
            setSelectedSnapshotId={snapshotExplorer.setSelectedSnapshotId}
            selectedSnapshot={snapshotExplorer.selectedSnapshot}
            snapshotOverview={snapshotExplorer.snapshotOverview}
            flattenedLayoutNodes={snapshotExplorer.flattenedLayoutNodes}
            selectedLayoutScopeId={snapshotExplorer.selectedLayoutScopeId}
            setSelectedLayoutScopeId={snapshotExplorer.setSelectedLayoutScopeId}
            layoutTree={snapshotExplorer.layoutTree}
            layoutScopeDetail={snapshotExplorer.layoutScopeDetail}
            selectedDependencyScopeId={snapshotExplorer.selectedDependencyScopeId}
            setSelectedDependencyScopeId={snapshotExplorer.setSelectedDependencyScopeId}
            dependencyDirection={snapshotExplorer.dependencyDirection}
            setDependencyDirection={snapshotExplorer.setDependencyDirection}
            dependencyView={snapshotExplorer.dependencyView}
            dependencyEntityOptions={snapshotExplorer.dependencyEntityOptions}
            focusedDependencyEntityId={snapshotExplorer.focusedDependencyEntityId}
            setFocusedDependencyEntityId={snapshotExplorer.setFocusedDependencyEntityId}
            selectedEntryPointScopeId={snapshotExplorer.selectedEntryPointScopeId}
            setSelectedEntryPointScopeId={snapshotExplorer.setSelectedEntryPointScopeId}
            entryCategory={snapshotExplorer.entryCategory}
            setEntryCategory={snapshotExplorer.setEntryCategory}
            entryPointView={snapshotExplorer.entryPointView}
            entryPointOptions={snapshotExplorer.entryPointOptions}
            focusedEntryPointId={snapshotExplorer.focusedEntryPointId}
            setFocusedEntryPointId={snapshotExplorer.setFocusedEntryPointId}
            selectedSearchScopeId={snapshotExplorer.selectedSearchScopeId}
            setSelectedSearchScopeId={snapshotExplorer.setSelectedSearchScopeId}
            searchQuery={snapshotExplorer.searchQuery}
            setSearchQuery={snapshotExplorer.setSearchQuery}
            searchView={snapshotExplorer.searchView}
            searchResultOptions={snapshotExplorer.searchResultOptions}
            selectedSearchEntityId={snapshotExplorer.selectedSearchEntityId}
            setSelectedSearchEntityId={snapshotExplorer.setSelectedSearchEntityId}
            entityDetail={snapshotExplorer.entityDetail}
            customizationOverview={snapshotExplorer.customizationOverview}
            overlayName={snapshotExplorer.overlayName}
            setOverlayName={snapshotExplorer.setOverlayName}
            overlayKind={snapshotExplorer.overlayKind}
            setOverlayKind={snapshotExplorer.setOverlayKind}
            overlayNote={snapshotExplorer.overlayNote}
            setOverlayNote={snapshotExplorer.setOverlayNote}
            handleCreateOverlay={snapshotExplorer.handleCreateOverlay}
            selectedOverlayId={snapshotExplorer.selectedOverlayId}
            setSelectedOverlayId={snapshotExplorer.setSelectedOverlayId}
            handleDeleteOverlay={snapshotExplorer.handleDeleteOverlay}
            savedViewName={snapshotExplorer.savedViewName}
            setSavedViewName={snapshotExplorer.setSavedViewName}
            handleSaveCurrentView={snapshotExplorer.handleSaveCurrentView}
            selectedSavedViewId={snapshotExplorer.selectedSavedViewId}
            handleApplySavedView={snapshotExplorer.handleApplySavedView}
            handleDuplicateSavedView={snapshotExplorer.handleDuplicateSavedView}
            handleDeleteSavedView={snapshotExplorer.handleDeleteSavedView}
            comparisonSnapshotId={snapshotExplorer.comparisonSnapshotId}
            setComparisonSnapshotId={snapshotExplorer.setComparisonSnapshotId}
            comparisonOptions={snapshotExplorer.comparisonOptions}
            snapshotComparison={snapshotExplorer.snapshotComparison}
          />

          <OperationsAndAuditSection
            recentRuns={workspaceData.recentRuns}
            selectedWorkspace={workspaceData.selectedWorkspace}
            operationsOverview={workspaceData.operationsOverview}
            retentionForm={workspaceData.retentionForm}
            setRetentionForm={workspaceData.setRetentionForm}
            handlePreviewRetention={workspaceData.handlePreviewRetention}
            handleApplyRetention={workspaceData.handleApplyRetention}
            retentionPreview={workspaceData.retentionPreview}
            auditEvents={workspaceData.auditEvents}
          />
        </div>
      </section>
    </main>
  );
}
