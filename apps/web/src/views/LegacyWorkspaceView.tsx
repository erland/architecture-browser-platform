import { useState } from 'react';
import { SnapshotCatalogSection } from '../components/SnapshotCatalogSection';
import { OperationsAndAuditSection } from '../components/OperationsAndAuditSection';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useSnapshotExplorer } from '../hooks/useSnapshotExplorer';

type LegacyWorkspaceViewProps = {
  onOpenWorkspaces: () => void;
  onOpenRepositories: () => void;
  onOpenSnapshots: () => void;
};

export function LegacyWorkspaceView({ onOpenWorkspaces, onOpenRepositories, onOpenSnapshots }: LegacyWorkspaceViewProps) {
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selection = useAppSelectionContext();

  const workspaceData = useWorkspaceData({
    selectedWorkspaceId: selection.selectedWorkspaceId,
    setSelectedWorkspaceId: selection.setSelectedWorkspaceId,
    selectedRepositoryId: selection.selectedRepositoryId,
    setSelectedRepositoryId: selection.setSelectedRepositoryId,
    setBusyMessage,
    setError,
  });
  const snapshotExplorer = useSnapshotExplorer(
    workspaceData.selectedWorkspaceId,
    workspaceData.snapshots,
    selection.selectedSnapshotId,
    selection.setSelectedSnapshotId,
    { setBusyMessage, setError },
  );

  return (
    <div className="content-stack">
      <section className="card section-intro">
        <p className="eyebrow">Current workspace</p>
        <h2>Snapshot and operations flow</h2>
        <p className="lead">
          Workspace lifecycle management now lives in Workspaces, repository registration plus run requests now live in Repositories, and snapshot selection now lives in Snapshots. This temporary screen is reduced to detailed snapshot exploration and operations for the currently selected snapshot until the Browser and Operations routes are implemented.
        </p>
        <div className="actions">
          <button type="button" className="button-secondary" onClick={onOpenWorkspaces}>Open Workspaces view</button>
          <button type="button" className="button-secondary" onClick={onOpenRepositories}>Open Repositories view</button>
          <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Open Snapshots view</button>
        </div>
      </section>

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div><dt>Status</dt><dd>{workspaceData.health.status}</dd></div>
            <div><dt>Service</dt><dd>{workspaceData.health.service}</dd></div>
            <div><dt>Version</dt><dd>{workspaceData.health.version}</dd></div>
            <div><dt>Time</dt><dd>{workspaceData.health.time || '—'}</dd></div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <div className="section-heading">
            <h2>Active workspace context</h2>
            <span className="badge">Shared selection</span>
          </div>
          {workspaceData.selectedWorkspace ? (
            <dl className="kv kv--compact">
              <div><dt>Name</dt><dd>{workspaceData.selectedWorkspace.name}</dd></div>
              <div><dt>Key</dt><dd>{workspaceData.selectedWorkspace.workspaceKey}</dd></div>
              <div><dt>Status</dt><dd>{workspaceData.selectedWorkspace.status}</dd></div>
            </dl>
          ) : (
            <p className="muted">No workspace selected yet. Use the dedicated Workspaces view to create or select one before working with repositories and snapshots.</p>
          )}
          <div className="actions">
            <button type="button" onClick={onOpenWorkspaces}>Manage workspaces</button>
            <button type="button" className="button-secondary" onClick={onOpenRepositories}>Manage repositories and runs</button>
            <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Choose snapshot</button>
          </div>
        </article>
      </section>

      {workspaceData.selectedWorkspace ? (
        <>

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
            showCatalogList={false}
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
        </>
      ) : (
        <article className="card empty-state-card">
          <h2>No workspace selected</h2>
          <p className="muted">Choose a workspace in the Workspaces view to continue with repository registration, snapshots, and operations.</p>
          <div className="actions">
            <button type="button" onClick={onOpenWorkspaces}>Go to Workspaces</button>
          </div>
        </article>
      )}
    </div>
  );
}
