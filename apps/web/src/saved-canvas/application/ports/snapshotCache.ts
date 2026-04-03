import type { SnapshotCachePutInput } from '../../../api/snapshotCache';
import type { SnapshotSummary } from '../../../app-model';
import type { PreparedSnapshotCacheReadPort, PreparedSnapshotCacheRecord } from '../../../browser-snapshot';

export interface SavedCanvasSnapshotCachePort extends PreparedSnapshotCacheReadPort {
  hasSnapshot(snapshotId: string): Promise<boolean>;
  putSnapshot(input: SnapshotCachePutInput): Promise<PreparedSnapshotCacheRecord>;
  buildCacheVersion(snapshot: Pick<SnapshotSummary, 'importedAt' | 'sourceRevision' | 'schemaVersion' | 'indexerVersion'>): string;
}

export type { PreparedSnapshotCacheRecord as SavedCanvasSnapshotCacheRecord };
export type SavedCanvasSnapshotSummary = Pick<SnapshotSummary, 'id' | 'workspaceId' | 'repositoryRegistrationId' | 'snapshotKey' | 'importedAt' | 'sourceRevision' | 'schemaVersion' | 'indexerVersion'>;
