import type { SnapshotSummary } from '../../app-model';
import type { PreparedSnapshotCacheReadPort, PreparedSnapshotCacheRecord } from './ports/preparedSnapshotCache';

export async function loadPreparedSnapshotRecordForSummary(
  cache: PreparedSnapshotCacheReadPort,
  snapshot: SnapshotSummary,
): Promise<PreparedSnapshotCacheRecord | null> {
  const record = await cache.getSnapshot(snapshot.id);
  if (!record) {
    return null;
  }
  return cache.isSnapshotCurrent(snapshot, record) ? record : null;
}

export async function findPreferredPreparedSnapshotId(options: {
  cache: PreparedSnapshotCacheReadPort;
  snapshots: SnapshotSummary[];
  fallbackSnapshotId: string | null;
}): Promise<string | null> {
  const { cache, snapshots, fallbackSnapshotId } = options;
  for (const snapshot of [...snapshots].sort((left, right) => Date.parse(right.importedAt) - Date.parse(left.importedAt))) {
    const prepared = await loadPreparedSnapshotRecordForSummary(cache, snapshot);
    if (prepared) {
      return snapshot.id;
    }
  }
  return fallbackSnapshotId;
}
