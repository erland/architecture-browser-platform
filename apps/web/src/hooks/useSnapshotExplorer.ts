import type { Dispatch, SetStateAction } from 'react';
import type { SnapshotSummary } from '../appModel';
import { useCompareExplorer } from './useCompareExplorer';
import { useBrowserExplorer } from './useBrowserExplorer';
import { buildSnapshotExplorerFacade } from './snapshotExplorer/useSnapshotExplorerFacade';
import { useSnapshotExplorerCustomization } from './snapshotExplorer/useSnapshotExplorerCustomization';
import type { FeedbackSetters } from './snapshotExplorer/useSnapshotExplorer.types';

export function useSnapshotExplorer(
  selectedWorkspaceId: string | null,
  snapshots: SnapshotSummary[],
  selectedSnapshotId: string | null,
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>,
  feedback: FeedbackSetters,
) {
  const browserExplorer = useBrowserExplorer({
    selectedWorkspaceId,
    snapshots,
    selectedSnapshotId,
    setSelectedSnapshotId,
    feedback: { setError: feedback.setError },
  });

  const customization = useSnapshotExplorerCustomization({
    selectedWorkspaceId,
    selectedSnapshotId,
    setSelectedSearchScopeId: browserExplorer.setSelectedSearchScopeId,
    setSearchQuery: browserExplorer.setSearchQuery,
    setSelectedSearchEntityId: browserExplorer.setSelectedSearchEntityId,
    setSelectedEntryPointScopeId: browserExplorer.setSelectedEntryPointScopeId,
    setEntryCategory: browserExplorer.setEntryCategory,
    setFocusedEntryPointId: browserExplorer.setFocusedEntryPointId,
    setSelectedLayoutScopeId: browserExplorer.setSelectedLayoutScopeId,
    setSelectedDependencyScopeId: browserExplorer.setSelectedDependencyScopeId,
    setDependencyDirection: browserExplorer.setDependencyDirection,
    setFocusedDependencyEntityId: browserExplorer.setFocusedDependencyEntityId,
    selectedSearchScopeId: browserExplorer.selectedSearchScopeId,
    searchQuery: browserExplorer.searchQuery,
    selectedSearchEntityId: browserExplorer.selectedSearchEntityId,
    selectedLayoutScopeId: browserExplorer.selectedLayoutScopeId,
    selectedDependencyScopeId: browserExplorer.selectedDependencyScopeId,
    dependencyDirection: browserExplorer.dependencyDirection,
    focusedDependencyEntityId: browserExplorer.focusedDependencyEntityId,
    selectedEntryPointScopeId: browserExplorer.selectedEntryPointScopeId,
    entryCategory: browserExplorer.entryCategory,
    focusedEntryPointId: browserExplorer.focusedEntryPointId,
  }, feedback);

  const compareExplorer = useCompareExplorer({
    selectedWorkspaceId,
    snapshots,
    selectedSnapshotId,
    setSelectedSnapshotId,
    feedback: { setError: feedback.setError },
  });

  return buildSnapshotExplorerFacade(
    browserExplorer,
    customization,
    compareExplorer,
    selectedSnapshotId,
    setSelectedSnapshotId,
  );
}
