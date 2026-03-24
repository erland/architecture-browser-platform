import { useEffect } from "react";
import { emptyRepositoryEditor, isEmptyRepositoryEditor, sameRepositoryEditor, toRepositoryEditor } from "./workspaceData.helpers";
import type { UseWorkspaceDataArgs, WorkspaceDataLoaders, WorkspaceDataState } from "./workspaceData.types";

export function useWorkspaceDataSelectionSync(
  args: UseWorkspaceDataArgs,
  state: WorkspaceDataState,
  loaders: WorkspaceDataLoaders,
) {
  const {
    selectedRepositoryId,
    setSelectedRepositoryId,
    selectedSnapshotId,
  } = args;
  const {
    selectedWorkspace,
    repositories,
    snapshots,
    workspaceDetailLoadedFor,
    setWorkspaceEditor,
    repositoryEditor,
    setRepositoryEditor,
  } = state;
  const {
    loadHealth,
    loadWorkspaces,
    loadWorkspaceDetail,
    resetWorkspaceDetail,
  } = loaders;

  useEffect(() => {
    void loadHealth();
    void loadWorkspaces();
  }, [loadHealth, loadWorkspaces]);

  useEffect(() => {
    if (selectedWorkspace) {
      setWorkspaceEditor({
        name: selectedWorkspace.name,
        description: selectedWorkspace.description ?? "",
      });
      void loadWorkspaceDetail(selectedWorkspace.id);
      return;
    }

    resetWorkspaceDetail();
  }, [loadWorkspaceDetail, resetWorkspaceDetail, selectedWorkspace, setWorkspaceEditor]);

  useEffect(() => {
    const selectedWorkspaceId = selectedWorkspace?.id ?? null;
    const isWorkspaceDetailLoading = selectedWorkspaceId !== null && workspaceDetailLoadedFor !== selectedWorkspaceId;
    if (!repositories.length) {
      if (isWorkspaceDetailLoading) {
        return;
      }
      if (selectedRepositoryId !== null) {
        setSelectedRepositoryId(null);
      }
      setRepositoryEditor((current) => (isEmptyRepositoryEditor(current) ? current : emptyRepositoryEditor()));
      return;
    }

    const selectedRepository = repositories.find((repository) => repository.id === selectedRepositoryId) ?? null;
    if (selectedRepository) {
      setRepositoryEditor((current) => {
        const next = toRepositoryEditor(selectedRepository);
        return sameRepositoryEditor(current, next) ? current : next;
      });
      return;
    }

    const snapshotMatchedRepositoryId = selectedSnapshotId
      ? snapshots.find((snapshot) => snapshot.id === selectedSnapshotId)?.repositoryRegistrationId ?? null
      : null;
    const fallbackRepositoryId = snapshotMatchedRepositoryId
      ?? repositories.find((repository) => repository.status !== 'ARCHIVED')?.id
      ?? repositories[0]?.id
      ?? null;
    if (fallbackRepositoryId !== selectedRepositoryId) {
      setSelectedRepositoryId(fallbackRepositoryId);
      return;
    }

    const fallbackRepository = repositories.find((repository) => repository.id === fallbackRepositoryId) ?? null;
    if (fallbackRepository) {
      setRepositoryEditor((current) => {
        const next = toRepositoryEditor(fallbackRepository);
        return sameRepositoryEditor(current, next) ? current : next;
      });
      return;
    }

    if (!isEmptyRepositoryEditor(repositoryEditor)) {
      setRepositoryEditor(emptyRepositoryEditor());
    }
  }, [repositories, repositoryEditor, selectedRepositoryId, selectedSnapshotId, selectedWorkspace, setRepositoryEditor, setSelectedRepositoryId, snapshots, workspaceDetailLoadedFor]);
}
