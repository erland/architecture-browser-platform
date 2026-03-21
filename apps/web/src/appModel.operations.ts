import type { ApiHealth, RepositoryStatus, RunOutcome, RunStatus, SnapshotStatus } from './appModel.api';

export type OperationsRepositoryRow = {
  id: string;
  repositoryKey: string;
  name: string;
  status: RepositoryStatus;
  snapshotCount: number;
  runCount: number;
  latestSnapshotId: string | null;
  latestSnapshotImportedAt: string | null;
  latestRunId: string | null;
  latestRunStatus: RunStatus | null;
  latestRunOutcome: RunOutcome;
  latestRunRequestedAt: string | null;
};

export type OperationsRunRow = {
  id: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  completedAt: string | null;
  errorSummary: string | null;
  retainedBySnapshot: boolean;
};

export type OperationsDiagnostic = {
  externalId: string;
  severity: string | null;
  phase: string | null;
  code: string;
  message: string;
  fatal: boolean;
  filePath: string | null;
  entityId: string | null;
  scopeId: string | null;
};

export type FailedSnapshotRow = {
  id: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  snapshotKey: string;
  status: SnapshotStatus;
  completenessStatus: string;
  importedAt: string;
  diagnosticCount: number;
  diagnostics: OperationsDiagnostic[];
  warnings: string[];
};

export type RetentionDefaults = {
  keepSnapshotsPerRepository: number;
  keepRunsPerRepository: number;
};

export type RetentionSnapshotCandidate = {
  snapshotId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  snapshotKey: string;
  importedAt: string;
  entityCount: number;
  relationshipCount: number;
  diagnosticCount: number;
};

export type RetentionRunCandidate = {
  runId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  retainedBySnapshot: boolean;
  errorSummary: string | null;
};

export type RetentionPreview = {
  workspaceId: string;
  keepSnapshotsPerRepository: number;
  keepRunsPerRepository: number;
  snapshotDeleteCount: number;
  runDeleteCount: number;
  snapshotsToDelete: RetentionSnapshotCandidate[];
  runsToDelete: RetentionRunCandidate[];
  generatedAt: string;
  dryRun: boolean;
};

export type OperationsOverview = {
  workspaceId: string;
  health: ApiHealth;
  summary: {
    repositoryCount: number;
    activeRepositoryCount: number;
    runCount: number;
    failedRunCount: number;
    snapshotCount: number;
    failedSnapshotCount: number;
    auditEventCount: number;
  };
  repositories: OperationsRepositoryRow[];
  recentRuns: OperationsRunRow[];
  failedRuns: OperationsRunRow[];
  failedSnapshots: FailedSnapshotRow[];
  retentionDefaults: RetentionDefaults;
  generatedAt: string;
};

export const initialOperationsOverview: OperationsOverview | null = null;
export const initialRetentionPreview: RetentionPreview | null = null;
export const initialHealth: ApiHealth = {
  status: 'unknown',
  service: 'architecture-browser-platform-api',
  version: '0.1.0',
  time: '',
};
