import type { Repository, SnapshotSummary, Workspace } from './appModel.api';

export type SourceTreeLauncherItem = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  repositoryId: string;
  sourceTreeLabel: string;
  sourceTreeKey: string;
  sourceSummary: string;
  indexedVersionLabel: string;
  latestSnapshotId: string | null;
  latestSnapshotKey: string | null;
  latestImportedAt: string | null;
  status: 'ready' | 'empty';
  latestRunStatusLabel: string;
  latestIndexedAtLabel: string;
  searchText: string;
};

export type SelectedSourceTreeSummary = {
  sourceTreeId: string | null;
  sourceTreeLabel: string;
  indexedVersionLabel: string;
  workspaceContextLabel: string;
};

export function buildSelectedSourceTreeSummary(selection: {
  selectedWorkspaceId: string | null;
  selectedRepositoryId: string | null;
  selectedSnapshotId: string | null;
}): SelectedSourceTreeSummary {
  const sourceTreeId = selection.selectedWorkspaceId && selection.selectedRepositoryId
    ? buildSourceTreeId(selection.selectedWorkspaceId, selection.selectedRepositoryId)
    : null;

  const sourceTreeLabel = selection.selectedRepositoryId
    ? `Selected source tree: ${selection.selectedRepositoryId}`
    : 'No source tree selected';

  const indexedVersionLabel = selection.selectedSnapshotId
    ? `Indexed version: ${selection.selectedSnapshotId}`
    : 'Indexed version: none selected';

  const workspaceContextLabel = selection.selectedWorkspaceId
    ? `Source tree catalog: ${selection.selectedWorkspaceId}`
    : 'Source tree catalog: not initialized';

  return {
    sourceTreeId,
    sourceTreeLabel,
    indexedVersionLabel,
    workspaceContextLabel,
  };
}

export function buildSourceTreeLauncherItems(args: {
  workspace: Workspace | null;
  repositories: Repository[];
  snapshots: SnapshotSummary[];
}): SourceTreeLauncherItem[] {
  const { workspace, repositories, snapshots } = args;
  if (!workspace) {
    return [];
  }

  const latestSnapshotsByRepositoryId = new Map<string, SnapshotSummary>();
  for (const snapshot of snapshots) {
    const current = latestSnapshotsByRepositoryId.get(snapshot.repositoryRegistrationId);
    if (!current || Date.parse(snapshot.importedAt) > Date.parse(current.importedAt)) {
      latestSnapshotsByRepositoryId.set(snapshot.repositoryRegistrationId, snapshot);
    }
  }

  return [...repositories]
    .filter((repository) => repository.status !== 'ARCHIVED')
    .map((repository) => {
      const latestSnapshot = latestSnapshotsByRepositoryId.get(repository.id) ?? null;
      const sourceTreeLabel = repository.name.trim() || repository.repositoryKey.trim() || repository.id;
      const sourceTreeKey = repository.repositoryKey.trim() || repository.id;
      const sourceSummary = [
        repository.sourceType === 'LOCAL_PATH' ? repository.localPath : repository.remoteUrl,
        repository.defaultBranch,
      ].filter(Boolean).join(' · ') || 'Source path not configured';

      const latestRunStatusLabel = latestSnapshot
        ? (latestSnapshot.derivedRunOutcome === 'FAILED' ? 'Failure' : latestSnapshot.derivedRunOutcome === 'PARTIAL' ? 'Partial' : 'Success')
        : 'Not indexed';
      const latestIndexedAtLabel = latestSnapshot?.importedAt ?? null;

      return {
        id: buildSourceTreeId(workspace.id, repository.id),
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        repositoryId: repository.id,
        sourceTreeLabel,
        sourceTreeKey,
        sourceSummary,
        indexedVersionLabel: latestSnapshot
          ? `${latestSnapshot.snapshotKey} · ${latestSnapshot.completenessStatus}`
          : 'Not indexed yet',
        latestSnapshotId: latestSnapshot?.id ?? null,
        latestSnapshotKey: latestSnapshot?.snapshotKey ?? null,
        latestImportedAt: latestSnapshot?.importedAt ?? null,
        status: latestSnapshot ? 'ready' : 'empty',
        latestRunStatusLabel,
        latestIndexedAtLabel: latestIndexedAtLabel ?? 'Never indexed',
        searchText: [
          workspace.name,
          sourceTreeLabel,
          sourceTreeKey,
          repository.localPath,
          repository.remoteUrl,
          repository.defaultBranch,
          latestSnapshot?.snapshotKey,
        ].filter(Boolean).join(' '),
      } satisfies SourceTreeLauncherItem;
    })
    .sort(compareSourceTreeLauncherItems);
}

export function buildSourceTreeId(workspaceId: string, repositoryId: string): string {
  return `${workspaceId}::${repositoryId}`;
}

function compareSourceTreeLauncherItems(left: SourceTreeLauncherItem, right: SourceTreeLauncherItem) {
  const leftTime = left.latestImportedAt ? Date.parse(left.latestImportedAt) : Number.NEGATIVE_INFINITY;
  const rightTime = right.latestImportedAt ? Date.parse(right.latestImportedAt) : Number.NEGATIVE_INFINITY;
  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }
  return left.sourceTreeLabel.localeCompare(right.sourceTreeLabel);
}
