import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  emptyRepositoryForm,
  emptyWorkspaceForm,
  initialRunRequest,
} from "../../appModel";
import type {
  ApiHealth,
  AuditEvent,
  OperationsOverview,
  Repository,
  RetentionPreview,
  RunRecord,
  SnapshotSummary,
  StubRunResult,
  Workspace,
} from "../../appModel";

export type WorkspaceEditor = { name: string; description: string };
export type RepositoryEditor = {
  id: string | null;
  name: string;
  localPath: string;
  remoteUrl: string;
  defaultBranch: string;
  metadataJson: string;
};
export type RetentionForm = { keepSnapshotsPerRepository: string; keepRunsPerRepository: string };

export type UseWorkspaceDataArgs = {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  selectedRepositoryId: string | null;
  setSelectedRepositoryId: Dispatch<SetStateAction<string | null>>;
  selectedSnapshotId?: string | null;
  setBusyMessage: (value: string | null) => void;
  setError: (value: string | null) => void;
};

export type WorkspaceDetailPayload = {
  repositoryPayload: Repository[];
  auditPayload: AuditEvent[];
  runPayload: RunRecord[];
  snapshotPayload: SnapshotSummary[];
  operationsPayload: OperationsOverview;
};

export type WorkspaceDataState = {
  health: ApiHealth;
  setHealth: Dispatch<SetStateAction<ApiHealth>>;
  workspaces: Workspace[];
  setWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
  repositories: Repository[];
  setRepositories: Dispatch<SetStateAction<Repository[]>>;
  auditEvents: AuditEvent[];
  setAuditEvents: Dispatch<SetStateAction<AuditEvent[]>>;
  recentRuns: RunRecord[];
  setRecentRuns: Dispatch<SetStateAction<RunRecord[]>>;
  snapshots: SnapshotSummary[];
  setSnapshots: Dispatch<SetStateAction<SnapshotSummary[]>>;
  operationsOverview: OperationsOverview | null;
  setOperationsOverview: Dispatch<SetStateAction<OperationsOverview | null>>;
  retentionPreview: RetentionPreview | null;
  setRetentionPreview: Dispatch<SetStateAction<RetentionPreview | null>>;
  retentionForm: RetentionForm;
  setRetentionForm: Dispatch<SetStateAction<RetentionForm>>;
  workspaceForm: typeof emptyWorkspaceForm;
  setWorkspaceForm: Dispatch<SetStateAction<typeof emptyWorkspaceForm>>;
  workspaceEditor: WorkspaceEditor;
  setWorkspaceEditor: Dispatch<SetStateAction<WorkspaceEditor>>;
  repositoryForm: typeof emptyRepositoryForm;
  setRepositoryForm: Dispatch<SetStateAction<typeof emptyRepositoryForm>>;
  repositoryEditor: RepositoryEditor;
  setRepositoryEditor: Dispatch<SetStateAction<RepositoryEditor>>;
  runRequestForm: typeof initialRunRequest;
  setRunRequestForm: Dispatch<SetStateAction<typeof initialRunRequest>>;
  selectedWorkspace: Workspace | null;
  latestRunByRepository: Map<string, RunRecord>;
  workspacesLoaded: boolean;
  setWorkspacesLoaded: Dispatch<SetStateAction<boolean>>;
  workspaceDetailLoadedFor: string | null;
  setWorkspaceDetailLoadedFor: Dispatch<SetStateAction<string | null>>;
};

export type WorkspaceDataLoaders = {
  loadHealth: () => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  loadWorkspaceDetail: (workspaceId: string) => Promise<WorkspaceDetailPayload | null>;
  resetWorkspaceDetail: () => void;
};

export type WorkspaceDataActions = {
  handlePreviewRetention: (event: FormEvent) => Promise<void>;
  handleApplyRetention: () => Promise<void>;
  handleCreateWorkspace: (event: FormEvent) => Promise<void>;
  handleUpdateWorkspace: (event: FormEvent) => Promise<void>;
  handleArchiveWorkspace: () => Promise<void>;
  handleCreateRepository: (event: FormEvent) => Promise<void>;
  handleUpdateRepository: (event: FormEvent) => Promise<void>;
  handleArchiveRepository: (repositoryId: string) => Promise<void>;
  handleRequestRun: (repository: Repository, requestedResult: StubRunResult) => Promise<SnapshotSummary | null>;
  selectRepositoryForEdit: (repository: Repository) => void;
};
