export type ApiHealth = {
  status: string;
  service: string;
  version: string;
  time: string;
};

export const initialHealth: ApiHealth = {
  status: 'UNKNOWN',
  service: '',
  version: '',
  time: '',
};

export type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
export type RepositoryStatus = "ACTIVE" | "ARCHIVED";
export type RepositorySourceType = "LOCAL_PATH" | "GIT";
export type TriggerType = "MANUAL" | "SCHEDULED" | "IMPORT_ONLY" | "SYSTEM";
export type RunStatus = "REQUESTED" | "RUNNING" | "IMPORTING" | "COMPLETED" | "FAILED" | "CANCELED";
export type RunOutcome = "SUCCESS" | "PARTIAL" | "FAILED" | null;
export type StubRunResult = "SUCCESS" | "FAILURE";
export type SnapshotStatus = "READY" | "FAILED";
export type CompletenessStatus = "COMPLETE" | "PARTIAL" | "FAILED";

export type Workspace = {
  id: string;
  workspaceKey: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  repositoryCount: number;
};

export type Repository = {
  id: string;
  workspaceId: string;
  repositoryKey: string;
  name: string;
  sourceType: RepositorySourceType;
  localPath: string | null;
  remoteUrl: string | null;
  defaultBranch: string | null;
  status: RepositoryStatus;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RunRecord = {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  triggerType: TriggerType;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  schemaVersion: string | null;
  indexerVersion: string | null;
  errorSummary: string | null;
  metadataJson: string | null;
};

export type SnapshotSummary = {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  runId: string | null;
  snapshotKey: string;
  status: SnapshotStatus;
  completenessStatus: CompletenessStatus;
  derivedRunOutcome: Exclude<RunOutcome, null>;
  schemaVersion: string;
  indexerVersion: string;
  sourceRevision: string | null;
  sourceBranch: string | null;
  importedAt: string;
  scopeCount: number;
  entityCount: number;
  relationshipCount: number;
  diagnosticCount: number;
  indexedFileCount: number;
  totalFileCount: number;
  degradedFileCount: number;
};

export type KindCount = { key: string; count: number };
export type NameCount = { externalId: string; name: string; count: number };
export type DiagnosticSummary = {
  externalId: string;
  code: string;
  severity: string;
  message: string;
  filePath: string | null;
  entityId: string | null;
  scopeId: string | null;
};

export type SnapshotOverview = {
  snapshot: SnapshotSummary;
  source: {
    repositoryId: string | null;
    acquisitionType: string | null;
    path: string | null;
    remoteUrl: string | null;
    branch: string | null;
    revision: string | null;
    acquiredAt: string | null;
  };
  run: {
    startedAt: string | null;
    completedAt: string | null;
    outcome: string | null;
    detectedTechnologies: string[];
  };
  completeness: {
    status: string;
    indexedFileCount: number;
    totalFileCount: number;
    degradedFileCount: number;
    omittedPaths: string[];
    notes: string[];
  };
  scopeKinds: KindCount[];
  entityKinds: KindCount[];
  relationshipKinds: KindCount[];
  diagnosticCodes: KindCount[];
  topScopes: NameCount[];
  recentDiagnostics: DiagnosticSummary[];
  warnings: string[];
};


export type SourceViewSelectedObjectType = 'SCOPE' | 'ENTITY' | 'RELATIONSHIP' | 'DIAGNOSTIC';

export type SourceViewReadRequest = {
  snapshotId?: string;
  selectedObjectType?: SourceViewSelectedObjectType;
  selectedObjectId?: string;
  sourceRefIndex?: number | null;
  startLine?: number | null;
  endLine?: number | null;
};

export type SnapshotSourceFileReadRequest = {
  snapshotId: string;
  path: string;
  startLine?: number | null;
  endLine?: number | null;
};

export type SourceViewReadResponse = {
  path: string;
  language: string | null;
  totalLineCount: number;
  fileSizeBytes: number;
  requestedStartLine: number | null;
  requestedEndLine: number | null;
  sourceText: string;
};
