import type { SnapshotSummary } from '../appModel.api';

export type SnapshotSourceRef = {
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  snippet: string | null;
  metadata: Record<string, unknown>;
};

export type FullSnapshotViewpointAvailability = 'available' | 'partial' | 'unavailable';

export type SnapshotPayloadSource = {
  repositoryId: string | null;
  acquisitionType: string | null;
  path: string | null;
  remoteUrl: string | null;
  branch: string | null;
  revision: string | null;
  acquiredAt: string | null;
};

export type SnapshotPayloadRun = {
  startedAt: string | null;
  completedAt: string | null;
  outcome: string | null;
  detectedTechnologies: string[];
};

export type SnapshotPayloadCompleteness = {
  status: string | null;
  indexedFileCount: number;
  totalFileCount: number;
  degradedFileCount: number;
  omittedPaths: string[];
  notes: string[];
};

export type SnapshotMetadataEnvelope = {
  metadata: Record<string, unknown>;
};

export type SnapshotBackedLayout = {
  snapshot: SnapshotSummary;
};
