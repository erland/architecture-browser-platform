import { useCallback } from "react";
import { platformApi } from "../../platformApi";
import { type ApiHealth, type Repository, type RunRecord, type SnapshotSummary, type Workspace } from "../../appModel";
import { emptyRepositoryEditor, emptyWorkspaceEditor, toErrorMessage } from "./workspaceData.helpers";
import type { UseWorkspaceDataArgs, WorkspaceDataLoaders, WorkspaceDataState } from "./workspaceData.types";

export function useWorkspaceDataLoaders(args: UseWorkspaceDataArgs, state: WorkspaceDataState): WorkspaceDataLoaders {
  const {
    setSelectedWorkspaceId,
    setSelectedRepositoryId,
    setError,
  } = args;

  const {
    setHealth,
    setWorkspaces,
    setRepositories,
    setRecentRuns,
    setSnapshots,
    setRepositoryEditor,
    setWorkspacesLoaded,
    setWorkspaceDetailLoadedFor,
    setWorkspaceEditor,
  } = state;

  const resetWorkspaceDetail = useCallback(() => {
    setRepositories([]);
    setRecentRuns([]);
    setSnapshots([]);
    setWorkspaceEditor(emptyWorkspaceEditor());
    setRepositoryEditor(emptyRepositoryEditor());
    setWorkspaceDetailLoadedFor(null);
  }, [
    setRecentRuns,
    setRepositories,
    setRepositoryEditor,
    setSnapshots,
    setWorkspaceDetailLoadedFor,
    setWorkspaceEditor,
  ]);

  const loadHealth = useCallback(async () => {
    try {
      const payload = await platformApi.getHealth<ApiHealth>();
      setHealth(payload);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }, [setError, setHealth]);

  const loadWorkspaces = useCallback(async () => {
    try {
      const payload = await platformApi.listWorkspaces<Workspace[]>();
      setWorkspaces(payload);
      setWorkspacesLoaded(true);
      setSelectedWorkspaceId((current) => {
        const activeWorkspaces = payload.filter((item) => item.status !== 'ARCHIVED');
        const availableWorkspaces = activeWorkspaces.length ? activeWorkspaces : payload;
        if (current && availableWorkspaces.some((item) => item.id === current)) {
          return current;
        }
        return availableWorkspaces[0]?.id ?? null;
      });
      setError(null);
    } catch (caught) {
      setWorkspacesLoaded(true);
      setError(toErrorMessage(caught));
    }
  }, [setError, setSelectedWorkspaceId, setWorkspaces, setWorkspacesLoaded]);

  const loadWorkspaceDetail = useCallback(async (workspaceId: string) => {
    try {
      const [repositoryPayload, runPayload, snapshotPayload] = await Promise.all([
        platformApi.getWorkspaceRepositories<Repository[]>(workspaceId),
        platformApi.getWorkspaceRuns<RunRecord[]>(workspaceId),
        platformApi.getWorkspaceSnapshots<SnapshotSummary[]>(workspaceId),
      ]);
      setRepositories(repositoryPayload);
      setRecentRuns(runPayload);
      setSnapshots(snapshotPayload);
      setWorkspaceDetailLoadedFor(workspaceId);
      setSelectedRepositoryId((current) => current && repositoryPayload.some((item) => item.id === current) ? current : null);
      setError(null);
      return {
        repositoryPayload,
        runPayload,
        snapshotPayload,
      };
    } catch (caught) {
      setError(toErrorMessage(caught));
      return null;
    }
  }, [
    setError,
    setRecentRuns,
    setRepositories,
    setSelectedRepositoryId,
    setSnapshots,
    setWorkspaceDetailLoadedFor,
  ]);

  return {
    loadHealth,
    loadWorkspaces,
    loadWorkspaceDetail,
    resetWorkspaceDetail,
  };
}
