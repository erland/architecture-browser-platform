import type { SnapshotCachePutInput, SnapshotCacheRecord } from './types';
import type { SnapshotSummary } from '../../app-model';

export function nowIsoString() {
  return new Date().toISOString();
}

export function buildSnapshotCacheVersion(snapshot: Pick<SnapshotSummary, 'importedAt' | 'sourceRevision' | 'schemaVersion' | 'indexerVersion'>) {
  return [
    snapshot.importedAt || '',
    snapshot.sourceRevision || '',
    snapshot.schemaVersion || '',
    snapshot.indexerVersion || '',
  ].join('|');
}

export function normalizeSnapshotCacheRecord(snapshotId: string, input: SnapshotCachePutInput): SnapshotCacheRecord {
  return {
    snapshotId,
    workspaceId: input.workspaceId,
    repositoryId: input.repositoryId,
    snapshotKey: input.snapshotKey,
    cacheVersion: input.cacheVersion,
    cachedAt: input.cachedAt ?? nowIsoString(),
    lastAccessedAt: input.lastAccessedAt ?? nowIsoString(),
    payload: input.payload,
  };
}
