import { useCallback, useMemo, useState } from 'react';
import type { Repository, SnapshotSummary, Workspace } from '../../app-model';
import { buildSourceTreeLauncherItems, type SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';
import { getBrowserSnapshotCache } from '../../api/snapshotCache';

type SelectionContextLike = {
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
  setSelectedRepositoryId: (repositoryId: string | null) => void;
  setSelectedSnapshotId: (snapshotId: string | null) => void;
};

type WorkspaceDataLike = {
  selectedWorkspaceId: string | null;
  selectedWorkspace: Workspace | null;
  repositories: Repository[];
  snapshots: SnapshotSummary[];
  loadWorkspaceDetail: (workspaceId: string) => Promise<{ snapshotPayload?: SnapshotSummary[] } | null | undefined>;
};

export function useBrowserViewSourceTreeController({
  selection,
  workspaceData,
}: {
  selection: SelectionContextLike;
  workspaceData: WorkspaceDataLike;
}) {
  const [isSourceTreeSwitcherOpen, setIsSourceTreeSwitcherOpen] = useState(false);

  const sourceTreeLauncherItems = useMemo(() => buildSourceTreeLauncherItems({
    workspace: workspaceData.selectedWorkspace,
    repositories: workspaceData.repositories,
    snapshots: workspaceData.snapshots,
  }), [workspaceData.selectedWorkspace, workspaceData.repositories, workspaceData.snapshots]);

  const handleSelectSourceTree = useCallback(async (item: SourceTreeLauncherItem) => {
    const cache = getBrowserSnapshotCache();
    selection.setSelectedWorkspaceId(item.workspaceId);

    const detail = workspaceData.selectedWorkspaceId === item.workspaceId
      ? { snapshotPayload: workspaceData.snapshots }
      : await workspaceData.loadWorkspaceDetail(item.workspaceId);

    const repositorySnapshots = (detail?.snapshotPayload ?? workspaceData.snapshots)
      .filter((snapshot) => snapshot.repositoryRegistrationId === item.repositoryId)
      .sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt));

    let preferredSnapshotId = item.latestSnapshotId;
    for (const snapshot of repositorySnapshots) {
      const record = await cache.getSnapshot(snapshot.id);
      if (cache.isSnapshotCurrent(snapshot, record)) {
        preferredSnapshotId = snapshot.id;
        break;
      }
    }

    selection.setSelectedRepositoryId(item.repositoryId);
    selection.setSelectedSnapshotId(preferredSnapshotId);
    setIsSourceTreeSwitcherOpen(false);
  }, [selection, workspaceData]);

  const handleOpenSourceTreeDialog = useCallback(() => setIsSourceTreeSwitcherOpen(true), []);

  return {
    sourceTreeLauncherItems,
    isSourceTreeSwitcherOpen,
    setIsSourceTreeSwitcherOpen,
    handleOpenSourceTreeDialog,
    handleSelectSourceTree,
  };
}
