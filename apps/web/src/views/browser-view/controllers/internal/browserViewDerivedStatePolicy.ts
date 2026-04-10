import type { Repository, SnapshotSummary } from '../../../../app-model';
import { browserTabs } from '../../../../routing/browserTabs';

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

export function resolveBrowserViewSelectedSnapshot({
  selection,
  workspaceData,
  browserSession,
}: {
  selection: SelectionLike;
  workspaceData: WorkspaceDataLike;
  browserSession: BrowserSessionLike;
}) {
  if (selection.selectedSnapshotId) {
    return workspaceData.snapshots.find((snapshot) => snapshot.id === selection.selectedSnapshotId) ?? null;
  }

  const sessionSnapshotId = browserSession.state.activeSnapshot?.snapshotId;
  if (!sessionSnapshotId) {
    return null;
  }

  const sessionSnapshot = workspaceData.snapshots.find((snapshot) => snapshot.id === sessionSnapshotId) ?? null;
  if (!sessionSnapshot) {
    return null;
  }

  if (selection.selectedRepositoryId && sessionSnapshot.repositoryRegistrationId !== selection.selectedRepositoryId) {
    return null;
  }

  return sessionSnapshot;
}

export function resolveBrowserViewSelectedRepository({
  repositories,
  selectedRepositoryId,
  selectedSnapshot,
}: {
  repositories: Repository[];
  selectedRepositoryId: string | null;
  selectedSnapshot: SnapshotSummary | null;
}) {
  const bySelection = repositories.find((repository) => repository.id === selectedRepositoryId);
  if (bySelection) {
    return bySelection;
  }
  if (!selectedSnapshot) {
    return null;
  }
  return repositories.find((repository) => repository.id === selectedSnapshot.repositoryRegistrationId) ?? null;
}

export function resolveBrowserViewActiveTabMeta(activeTab: string) {
  return browserTabs.find((tab) => tab.key === activeTab) ?? browserTabs[0];
}

export function resolveBrowserViewRepositoryLabel({
  selectedRepository,
  selectedSnapshot,
}: {
  selectedRepository: Repository | null;
  selectedSnapshot: SnapshotSummary | null;
}) {
  return selectedRepository?.name
    ?? selectedSnapshot?.repositoryName
    ?? selectedSnapshot?.repositoryKey
    ?? selectedSnapshot?.repositoryRegistrationId
    ?? '—';
}

export function resolveBrowserViewSelectedScopeLabel(browserSession: BrowserSessionLike) {
  if (!browserSession.state.index || !browserSession.state.selectedScopeId) {
    return null;
  }
  return browserSession.state.index.scopePathById.get(browserSession.state.selectedScopeId)
    ?? browserSession.state.selectedScopeId
    ?? null;
}

export function resolveBrowserViewSelectedSnapshotLabel({
  selectedSnapshot,
  browserSession,
}: {
  selectedSnapshot: SnapshotSummary | null;
  browserSession: BrowserSessionLike;
}) {
  return selectedSnapshot?.snapshotKey
    ?? browserSession.state.activeSnapshot?.snapshotKey
    ?? '—';
}

export function resolveBrowserViewActiveViewpointLabel(browserSession: BrowserSessionLike) {
  return browserSession.state.appliedViewpoint?.viewpoint.title
    ?? browserSession.state.appliedViewpoint?.viewpoint.id
    ?? (browserSession.state.viewpointSelection.viewpointId
      ? `Viewpoint ${browserSession.state.viewpointSelection.viewpointId}`
      : 'Manual canvas');
}

export function deriveBrowserViewState({
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
  const selectedSnapshot = resolveBrowserViewSelectedSnapshot({
    selection,
    workspaceData,
    browserSession,
  });
  const selectedRepository = resolveBrowserViewSelectedRepository({
    repositories: workspaceData.repositories,
    selectedRepositoryId: selection.selectedRepositoryId,
    selectedSnapshot,
  });

  return {
    selectedSnapshot,
    selectedRepository,
    activeTabMeta: resolveBrowserViewActiveTabMeta(browserLayout.activeTab),
    repositoryLabel: resolveBrowserViewRepositoryLabel({ selectedRepository, selectedSnapshot }),
    selectedScopeLabel: resolveBrowserViewSelectedScopeLabel(browserSession),
    selectedSnapshotLabel: resolveBrowserViewSelectedSnapshotLabel({ selectedSnapshot, browserSession }),
    activeViewpointLabel: resolveBrowserViewActiveViewpointLabel(browserSession),
  };
}
