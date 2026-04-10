import type { SnapshotCachePutInput } from '../../../api/snapshot-cache/types';
import type { FullSnapshotPayload, SnapshotSummary } from '../../../app-model';

export type PreparedSnapshotCacheRecord = {
  snapshotId: string;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshotKey: string | null;
  cacheVersion: string;
  cachedAt: string;
  lastAccessedAt: string;
  payload: FullSnapshotPayload;
};

export interface PreparedSnapshotCacheReadPort {
  getSnapshot(snapshotId: string): Promise<PreparedSnapshotCacheRecord | null>;
  isSnapshotCurrent(
    snapshot: Pick<SnapshotSummary, 'id' | 'importedAt' | 'sourceRevision' | 'schemaVersion' | 'indexerVersion'>,
    record: Pick<PreparedSnapshotCacheRecord, 'cacheVersion'> | null,
  ): boolean;
}

export interface PreparedSnapshotCachePort extends PreparedSnapshotCacheReadPort {
  putSnapshot(input: SnapshotCachePutInput): Promise<PreparedSnapshotCacheRecord>;
  buildCacheVersion(snapshot: Pick<SnapshotSummary, 'importedAt' | 'sourceRevision' | 'schemaVersion' | 'indexerVersion'>): string;
}
