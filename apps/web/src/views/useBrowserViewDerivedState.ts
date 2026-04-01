import { useMemo } from 'react';
import type { Repository, SnapshotSummary } from '../appModel';
import { browserTabs } from '../routing/browserTabs';

type WorkspaceDataLike = {
  repositories: Repository[];
  snapshots: SnapshotSummary[];
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
  const selectedSnapshot = useMemo(() => {
    if (selection.selectedSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === selection.selectedSnapshotId) ?? null;
    }

    const sessionSnapshotId = browserSession.state.activeSnapshot?.snapshotId;
    if (sessionSnapshotId) {
      return workspaceData.snapshots.find((snapshot) => snapshot.id === sessionSnapshotId) ?? null;
    }

    return null;
  }, [selection.selectedSnapshotId, browserSession.state.activeSnapshot?.snapshotId, workspaceData.snapshots]);

  const selectedRepository = useMemo(() => {
    const bySelection = workspaceData.repositories.find((repository) => repository.id === selection.selectedRepositoryId);
    if (bySelection) {
      return bySelection;
    }
    if (!selectedSnapshot) {
      return null;
    }
    return workspaceData.repositories.find((repository) => repository.id === selectedSnapshot.repositoryRegistrationId) ?? null;
  }, [workspaceData.repositories, selection.selectedRepositoryId, selectedSnapshot]);

  const activeTabMeta = useMemo(
    () => browserTabs.find((tab) => tab.key === browserLayout.activeTab) ?? browserTabs[0],
    [browserLayout.activeTab],
  );

  const repositoryLabel = selectedRepository?.name
    ?? selectedSnapshot?.repositoryName
    ?? selectedSnapshot?.repositoryKey
    ?? selectedSnapshot?.repositoryRegistrationId
    ?? '—';

  const selectedScopeLabel = useMemo(() => {
    if (!browserSession.state.index || !browserSession.state.selectedScopeId) {
      return null;
    }
    return browserSession.state.index.scopePathById.get(browserSession.state.selectedScopeId)
      ?? browserSession.state.selectedScopeId
      ?? null;
  }, [browserSession.state.index, browserSession.state.selectedScopeId]);

  const selectedSnapshotLabel = selectedSnapshot?.snapshotKey
    ?? browserSession.state.activeSnapshot?.snapshotKey
    ?? '—';

  const activeViewpointLabel = browserSession.state.appliedViewpoint?.viewpoint.title
    ?? browserSession.state.appliedViewpoint?.viewpoint.id
    ?? (browserSession.state.viewpointSelection.viewpointId ? `Viewpoint ${browserSession.state.viewpointSelection.viewpointId}` : 'Manual canvas');

  return {
    selectedSnapshot,
    selectedRepository,
    activeTabMeta,
    repositoryLabel,
    selectedScopeLabel,
    selectedSnapshotLabel,
    activeViewpointLabel,
  };
}
