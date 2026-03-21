import { useMemo, useState } from "react";
import {
  type ApiHealth,
  type AuditEvent,
  type OperationsOverview,
  type Repository,
  type RetentionPreview,
  type RunRecord,
  type SnapshotSummary,
  type Workspace,
  emptyRepositoryForm,
  emptyWorkspaceForm,
  initialHealth,
  initialOperationsOverview,
  initialRetentionPreview,
  initialRunRequest,
} from "../../appModel";
import { emptyRepositoryEditor, emptyWorkspaceEditor, initialRetentionForm } from "./workspaceData.helpers";
import type { WorkspaceDataState } from "./workspaceData.types";

export function useWorkspaceDataState(selectedWorkspaceId: string | null): WorkspaceDataState {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [operationsOverview, setOperationsOverview] = useState<OperationsOverview | null>(initialOperationsOverview);
  const [retentionPreview, setRetentionPreview] = useState<RetentionPreview | null>(initialRetentionPreview);
  const [retentionForm, setRetentionForm] = useState(initialRetentionForm);
  const [workspaceForm, setWorkspaceForm] = useState(emptyWorkspaceForm);
  const [workspaceEditor, setWorkspaceEditor] = useState(emptyWorkspaceEditor);
  const [repositoryForm, setRepositoryForm] = useState(emptyRepositoryForm);
  const [repositoryEditor, setRepositoryEditor] = useState(emptyRepositoryEditor);
  const [runRequestForm, setRunRequestForm] = useState(initialRunRequest);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const latestRunByRepository = useMemo(() => {
    const result = new Map<string, RunRecord>();
    for (const run of recentRuns) {
      if (!result.has(run.repositoryRegistrationId)) {
        result.set(run.repositoryRegistrationId, run);
      }
    }
    return result;
  }, [recentRuns]);

  return {
    health,
    setHealth,
    workspaces,
    setWorkspaces,
    repositories,
    setRepositories,
    auditEvents,
    setAuditEvents,
    recentRuns,
    setRecentRuns,
    snapshots,
    setSnapshots,
    operationsOverview,
    setOperationsOverview,
    retentionPreview,
    setRetentionPreview,
    retentionForm,
    setRetentionForm,
    workspaceForm,
    setWorkspaceForm,
    workspaceEditor,
    setWorkspaceEditor,
    repositoryForm,
    setRepositoryForm,
    repositoryEditor,
    setRepositoryEditor,
    runRequestForm,
    setRunRequestForm,
    selectedWorkspace,
    latestRunByRepository,
  };
}
