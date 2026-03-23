import { useState } from 'react';
import { SnapshotCatalogSection } from '../components/SnapshotCatalogSection';
import { useAppSelectionContext } from '../contexts/AppSelectionContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useSnapshotExplorer } from '../hooks/useSnapshotExplorer';

type LegacyWorkspaceViewProps = {
  onOpenWorkspaces: () => void;
  onOpenRepositories: () => void;
  onOpenSnapshots: () => void;
  onOpenOperations: () => void;
};

export function LegacyWorkspaceView({ onOpenWorkspaces, onOpenRepositories, onOpenSnapshots, onOpenOperations }: LegacyWorkspaceViewProps) {
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
        <p className="eyebrow">Legacy view</p>
        <h2>Older indexed-version and operations flow</h2>
        <p className="lead">
          Workspace lifecycle management now lives in Workspace context, source tree registration and indexing live in Manage sources, and indexed-version selection lives there as well. This temporary screen is reduced to detailed indexed-version exploration only. Operations and audit now live in their own dedicated route.
        </p>
        <div className="actions">
          <button type="button" className="button-secondary" onClick={onOpenWorkspaces}>Open workspace context</button>
          <button type="button" className="button-secondary" onClick={onOpenRepositories}>Open Manage sources</button>
          <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Open indexed versions</button>
          <button type="button" className="button-secondary" onClick={onOpenOperations}>Open Operations view</button>
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
            <p className="muted">No workspace selected yet. Use Workspace context to create or select one before working with source trees and indexed versions.</p>
          )}
          <div className="actions">
            <button type="button" onClick={onOpenWorkspaces}>Manage workspaces</button>
            <button type="button" className="button-secondary" onClick={onOpenRepositories}>Manage source trees and runs</button>
            <button type="button" className="button-secondary" onClick={onOpenSnapshots}>Choose indexed version</button>
            <button type="button" className="button-secondary" onClick={onOpenOperations}>Open operations</button>
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


          <article className="card section-note">
            <div className="section-heading">
              <h2>What moved out</h2>
              <span className="badge">Step 10</span>
            </div>
            <p className="muted">
              Operations, retention, failed run review, problematic snapshot visibility, and the audit trail now live in the dedicated Operations route so this temporary screen can stay focused on detailed snapshot exploration.
            </p>
            <div className="actions">
              <button type="button" onClick={onOpenOperations}>Open Operations</button>
            </div>
          </article>
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
