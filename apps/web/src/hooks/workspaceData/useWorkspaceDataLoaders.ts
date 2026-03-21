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
  }, [
    setAuditEvents,
    setOperationsOverview,
    setRecentRuns,
    setRepositories,
    setRepositoryEditor,
    setRetentionForm,
    setRetentionPreview,
    setSnapshots,
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
      setSelectedWorkspaceId((current) => {
        if (current && payload.some((item) => item.id === current)) {
          return current;
        }
        return payload[0]?.id ?? null;
      });
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }, [setError, setSelectedWorkspaceId, setWorkspaces]);

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
  ]);

  return {
    loadHealth,
    loadWorkspaces,
    loadWorkspaceDetail,
    resetWorkspaceDetail,
  };
}
