import { useCallback } from 'react';
import { emptyRepositoryForm, type Repository, type RepositoryUpdateRequest, type Workspace } from '../../app-model';
import { platformApi } from '../../api/platformApi';

type SelectionLike = {
  selectedWorkspaceId: string | null;
  selectedRepositoryId: string | null;
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
  setSelectedRepositoryId: (repositoryId: string | null) => void;
  setSelectedSnapshotId: (snapshotId: string | null) => void;
};

type WorkspaceDataLike = {
  selectedWorkspace: { id: string } | null;
  loadWorkspaces: () => Promise<unknown>;
  loadWorkspaceDetail: (workspaceId: string) => Promise<unknown>;
  handleRequestRun: (repository: Repository, expectedOutcome: 'SUCCESS') => Promise<{ id: string } | null>;
  handleArchiveRepository: (repositoryId: string) => Promise<unknown>;
};

export function useBrowserViewRepositoryActions({
  selection,
  workspaceData,
  setBusyMessage,
  setError,
}: {
  selection: SelectionLike;
  workspaceData: WorkspaceDataLike;
  setBusyMessage: (message: string | null) => void;
  setError: (message: string | null) => void;
}) {
  const handleInitializeImplicitWorkspace = useCallback(async () => {
    setBusyMessage('Initializing source tree catalog…');
    try {
      const created = await platformApi.createWorkspace<Workspace>({
        workspaceKey: 'default',
        name: 'Default source trees',
        description: 'Implicit Browser workspace for source tree registrations.',
      });
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(created.id);
      selection.setSelectedWorkspaceId(created.id);
      selection.setSelectedRepositoryId(null);
      selection.setSelectedSnapshotId(null);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  }, [selection, setBusyMessage, setError, workspaceData]);

  const handleCreateRepositoryFromDialog = useCallback(async (payload: typeof emptyRepositoryForm) => {
    const workspaceId = workspaceData.selectedWorkspace?.id ?? selection.selectedWorkspaceId;
    if (!workspaceId) {
      return;
    }
    setBusyMessage(`Creating source tree ${payload.name || payload.repositoryKey}…`);
    try {
      const created = await platformApi.createRepository<Repository>(workspaceId, payload);
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(workspaceId);
      selection.setSelectedWorkspaceId(workspaceId);
      selection.setSelectedRepositoryId(created.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  }, [selection, setBusyMessage, setError, workspaceData]);

  const handleRequestReindexFromDialog = useCallback(async (repository: Repository) => {
    const latestSnapshot = await workspaceData.handleRequestRun(repository, 'SUCCESS');
    selection.setSelectedWorkspaceId(repository.workspaceId);
    selection.setSelectedRepositoryId(repository.id);
    selection.setSelectedSnapshotId(latestSnapshot?.id ?? null);
  }, [selection, workspaceData]);

  const handleArchiveRepositoryFromDialog = useCallback(async (repository: Repository) => {
    await workspaceData.handleArchiveRepository(repository.id);
    if (selection.selectedRepositoryId === repository.id) {
      selection.setSelectedRepositoryId(null);
      selection.setSelectedSnapshotId(null);
    }
  }, [selection, workspaceData]);

  const handleUpdateRepositoryFromDialog = useCallback(async (repository: Repository, payload: RepositoryUpdateRequest) => {
    setBusyMessage(`Updating source tree ${payload.name || repository.name}…`);
    try {
      await platformApi.updateRepository<Repository>(repository.workspaceId, repository.id, payload);
      await workspaceData.loadWorkspaces();
      await workspaceData.loadWorkspaceDetail(repository.workspaceId);
      selection.setSelectedWorkspaceId(repository.workspaceId);
      selection.setSelectedRepositoryId(repository.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
      throw caught;
    } finally {
      setBusyMessage(null);
    }
  }, [selection, setBusyMessage, setError, workspaceData]);

  return {
    handleInitializeImplicitWorkspace,
    handleCreateRepositoryFromDialog,
    handleRequestReindexFromDialog,
    handleArchiveRepositoryFromDialog,
    handleUpdateRepositoryFromDialog,
  };
}
