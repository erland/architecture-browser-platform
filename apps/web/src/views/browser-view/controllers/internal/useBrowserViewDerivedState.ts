import { useMemo } from 'react';
import { deriveBrowserViewState } from './browserViewDerivedStatePolicy';

type WorkspaceDataLike = {
  repositories: import('../../../../app-model').Repository[];
  snapshots: import('../../../../app-model').SnapshotSummary[];
};

type SelectionLike = {
  selectedRepositoryId: string | null;
  selectedSnapshotId: string | null;
};

type BrowserSessionLike = {
  state: {
    index: {
      scopePathById: Map<string, string>;
    } | null;
    selectedScopeId: string | null;
    activeSnapshot: {
      snapshotId: string;
      snapshotKey?: string | null;
    } | null;
    appliedViewpoint: {
      viewpoint: {
        id: string;
        title?: string | null;
      };
    } | null;
    viewpointSelection: {
      viewpointId: string | null;
    };
  };
};

type BrowserLayoutLike = {
  activeTab: string;
};

export function useBrowserViewDerivedState({
  selection,
  workspaceData,
  browserSession,
  browserLayout,
}: {
  selection: SelectionLike;
  workspaceData: WorkspaceDataLike;
  browserSession: BrowserSessionLike;
  browserLayout: BrowserLayoutLike;
}) {
  return useMemo(() => deriveBrowserViewState({
    selection,
    workspaceData,
    browserSession,
    browserLayout,
  }), [
    selection.selectedRepositoryId,
    selection.selectedSnapshotId,
    workspaceData.repositories,
    workspaceData.snapshots,
    browserSession.state.index,
    browserSession.state.selectedScopeId,
    browserSession.state.activeSnapshot?.snapshotId,
    browserSession.state.activeSnapshot?.snapshotKey,
    browserSession.state.appliedViewpoint?.viewpoint.id,
    browserSession.state.appliedViewpoint?.viewpoint.title,
    browserSession.state.viewpointSelection.viewpointId,
    browserLayout.activeTab,
  ]);
}
