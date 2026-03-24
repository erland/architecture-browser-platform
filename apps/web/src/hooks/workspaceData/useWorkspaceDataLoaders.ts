import { useCallback } from "react";
import { platformApi } from "../../platformApi";
import { type ApiHealth, type AuditEvent, type OperationsOverview, type Repository, type RunRecord, type SnapshotSummary, type Workspace } from "../../appModel";
import { emptyRepositoryEditor, emptyWorkspaceEditor, initialRetentionForm, toErrorMessage } from "./workspaceData.helpers";
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
    setAuditEvents,
    setRecentRuns,
    setSnapshots,
    setOperationsOverview,
    setRetentionPreview,
    setRetentionForm,
    setWorkspaceEditor,
    setRepositoryEditor,
    setWorkspacesLoaded,
    setWorkspaceDetailLoadedFor,
  } = state;

  const resetWorkspaceDetail = useCallback(() => {
    setRepositories([]);
    setAuditEvents([]);
    setRecentRuns([]);
    setSnapshots([]);
    setOperationsOverview(null);
    setRetentionPreview(null);
    setRetentionForm(initialRetentionForm);
    setWorkspaceEditor(emptyWorkspaceEditor());
    setRepositoryEditor(emptyRepositoryEditor());
    setWorkspaceDetailLoadedFor(null);
  }, [
    setAuditEvents,
    setOperationsOverview,
    setRecentRuns,
    setRepositories,
    setRepositoryEditor,
    setRetentionForm,
    setRetentionPreview,
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
        if (current && payload.some((item) => item.id === current)) {
          return current;
        }
        return payload[0]?.id ?? null;
      });
      setError(null);
    } catch (caught) {
      setWorkspacesLoaded(true);
      setError(toErrorMessage(caught));
    }
  }, [setError, setSelectedWorkspaceId, setWorkspaces, setWorkspacesLoaded]);

  const loadWorkspaceDetail = useCallback(async (workspaceId: string) => {
    try {
      const [repositoryPayload, auditPayload, runPayload, snapshotPayload, operationsPayload] = await Promise.all([
        platformApi.getWorkspaceRepositories<Repository[]>(workspaceId),
        platformApi.getWorkspaceAuditEvents<AuditEvent[]>(workspaceId),
        platformApi.getWorkspaceRuns<RunRecord[]>(workspaceId),
        platformApi.getWorkspaceSnapshots<SnapshotSummary[]>(workspaceId),
        platformApi.getOperationsOverview<OperationsOverview>(workspaceId),
      ]);
      setRepositories(repositoryPayload);
      setAuditEvents(auditPayload);
      setRecentRuns(runPayload);
      setSnapshots(snapshotPayload);
      setOperationsOverview(operationsPayload);
      setRetentionForm({
        keepSnapshotsPerRepository: `${operationsPayload.retentionDefaults.keepSnapshotsPerRepository}`,
        keepRunsPerRepository: `${operationsPayload.retentionDefaults.keepRunsPerRepository}`,
      });
      setWorkspaceDetailLoadedFor(workspaceId);
      setSelectedRepositoryId((current) => current && repositoryPayload.some((item) => item.id === current) ? current : null);
      setError(null);
      return {
        repositoryPayload,
        auditPayload,
        runPayload,
        snapshotPayload,
        operationsPayload,
      };
    } catch (caught) {
      setError(toErrorMessage(caught));
      return null;
    }
  }, [
    setAuditEvents,
    setError,
    setOperationsOverview,
    setRecentRuns,
    setRepositories,
    setRetentionForm,
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
