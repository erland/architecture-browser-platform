import { useMemo, useState } from "react";
import {
  type ApiHealth,
  type Repository,
  type RunRecord,
  type SnapshotSummary,
  type Workspace,
  emptyRepositoryForm,
  emptyWorkspaceForm,
  initialHealth,
  initialRunRequest,
} from "../../app-model";
import { emptyRepositoryEditor, emptyWorkspaceEditor } from "./workspaceData.helpers";
import type { WorkspaceDataState } from "./workspaceData.types";

export function useWorkspaceDataState(selectedWorkspaceId: string | null): WorkspaceDataState {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [workspaceForm, setWorkspaceForm] = useState(emptyWorkspaceForm);
  const [workspaceEditor, setWorkspaceEditor] = useState(emptyWorkspaceEditor);
  const [repositoryForm, setRepositoryForm] = useState(emptyRepositoryForm);
  const [repositoryEditor, setRepositoryEditor] = useState(emptyRepositoryEditor);
  const [runRequestForm, setRunRequestForm] = useState(initialRunRequest);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);
  const [workspaceDetailLoadedFor, setWorkspaceDetailLoadedFor] = useState<string | null>(null);

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
    recentRuns,
    setRecentRuns,
    snapshots,
    setSnapshots,
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
    workspacesLoaded,
    setWorkspacesLoaded,
    workspaceDetailLoadedFor,
    setWorkspaceDetailLoadedFor,
  };
}
