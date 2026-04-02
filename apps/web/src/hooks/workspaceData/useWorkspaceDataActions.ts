import type { FormEvent } from "react";
import { platformApi } from "../../api/platformApi";
import { type Repository, type RunRecord, type SnapshotSummary, type StubRunResult, type Workspace, emptyRepositoryForm, emptyWorkspaceForm } from "../../app-model";
import { toErrorMessage } from "./workspaceData.helpers";
import type { UseWorkspaceDataArgs, WorkspaceDataActions, WorkspaceDataLoaders, WorkspaceDataState } from "./workspaceData.types";

export function useWorkspaceDataActions(
  args: UseWorkspaceDataArgs,
  state: WorkspaceDataState,
  loaders: WorkspaceDataLoaders,
): WorkspaceDataActions {
  const {
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    setSelectedRepositoryId,
    setBusyMessage,
    setError,
  } = args;

  const {
    workspaceForm,
    setWorkspaceForm,
    workspaceEditor,
    setWorkspaces,
    repositoryForm,
    setRepositoryForm,
    repositoryEditor,
    runRequestForm,
  } = state;

  const {
    loadWorkspaces,
    loadWorkspaceDetail,
  } = loaders;

  async function handleCreateWorkspace(event: FormEvent) {
    event.preventDefault();
    setBusyMessage("Creating workspace…");
    try {
      const created = await platformApi.createWorkspace<Workspace>(workspaceForm);
      setWorkspaceForm(emptyWorkspaceForm);
      await loadWorkspaces();
      setSelectedWorkspaceId(created.id);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) return;
    setBusyMessage("Updating workspace…");
    try {
      const updated = await platformApi.updateWorkspace<Workspace>(selectedWorkspaceId, workspaceEditor);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
      await loadWorkspaceDetail(selectedWorkspaceId);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveWorkspace() {
    if (!selectedWorkspaceId) return;
    setBusyMessage("Archiving workspace…");
    try {
      const updated = await platformApi.archiveWorkspace<Workspace>(selectedWorkspaceId);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) return;
    setBusyMessage("Creating repository registration…");
    try {
      const created = await platformApi.createRepository<Repository>(selectedWorkspaceId, repositoryForm);
      setRepositoryForm(emptyRepositoryForm);
      await loadWorkspaces();
      await loadWorkspaceDetail(selectedWorkspaceId);
      setSelectedRepositoryId(created.id);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !repositoryEditor.id) return;
    setBusyMessage("Updating repository registration…");
    try {
      const updated = await platformApi.updateRepository<Repository>(selectedWorkspaceId, repositoryEditor.id, {
        name: repositoryEditor.name,
        localPath: repositoryEditor.localPath,
        remoteUrl: repositoryEditor.remoteUrl,
        defaultBranch: repositoryEditor.defaultBranch,
        metadataJson: repositoryEditor.metadataJson,
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setSelectedRepositoryId(updated.id);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveRepository(repositoryId: string) {
    if (!selectedWorkspaceId) return;
    setBusyMessage("Archiving repository registration…");
    try {
      await platformApi.archiveRepository<Repository>(selectedWorkspaceId, repositoryId);
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setSelectedRepositoryId((current) => (current === repositoryId ? null : current));
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleRequestRun(repository: Repository, requestedResult: StubRunResult): Promise<SnapshotSummary | null> {
    if (!selectedWorkspaceId) return null;
    setBusyMessage(`Requesting ${requestedResult.toLowerCase()} run for ${repository.name}…`);
    try {
      await platformApi.requestRun<RunRecord>(selectedWorkspaceId, repository.id, {
        ...runRequestForm,
        requestedResult,
      });
      setSelectedRepositoryId(repository.id);
      const detail = await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
      const latestSnapshot = detail?.snapshotPayload
        .filter((snapshot) => snapshot.repositoryRegistrationId === repository.id)
        .sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt))[0] ?? null;
      return latestSnapshot;
    } catch (caught) {
      setError(toErrorMessage(caught));
      return null;
    } finally {
      setBusyMessage(null);
    }
  }

  function selectRepositoryForEdit(repository: Repository) {
    setSelectedRepositoryId(repository.id);
  }

  return {
    handleCreateWorkspace,
    handleUpdateWorkspace,
    handleArchiveWorkspace,
    handleCreateRepository,
    handleUpdateRepository,
    handleArchiveRepository,
    handleRequestRun,
    selectRepositoryForEdit,
  };
}
