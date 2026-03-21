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
  } = args;
  const {
    selectedWorkspace,
    repositories,
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
    if (!repositories.length) {
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

    const fallbackRepositoryId = repositories[0]?.id ?? null;
    if (fallbackRepositoryId !== selectedRepositoryId) {
      setSelectedRepositoryId(fallbackRepositoryId);
      return;
    }

    if (!isEmptyRepositoryEditor(repositoryEditor)) {
      setRepositoryEditor(emptyRepositoryEditor());
    }
  }, [repositories, repositoryEditor, selectedRepositoryId, setRepositoryEditor, setSelectedRepositoryId]);
}
