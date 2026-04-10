import { buildSnapshotCacheVersion } from './cacheVersion';
import type { SnapshotCache, SnapshotCacheStorage } from './types';

export function createSnapshotCache(storage: SnapshotCacheStorage): SnapshotCache {
  return {
    async getSnapshot(snapshotId) {
      return storage.get(snapshotId);
    },
    async putSnapshot(input) {
      return storage.put(input.payload.snapshot.id, input);
    },
    async hasSnapshot(snapshotId) {
      return storage.has(snapshotId);
    },
    async removeSnapshot(snapshotId) {
      await storage.remove(snapshotId);
    },
    async clearObsoleteSnapshots(activeSnapshotIds) {
      const activeSet = new Set(activeSnapshotIds);
      const records = await storage.list();
      const obsolete = records.filter((record) => !activeSet.has(record.snapshotId));
      await Promise.all(obsolete.map((record) => storage.remove(record.snapshotId)));
      return obsolete.length;
    },
    isSnapshotCurrent(snapshot, record) {
      if (!record) {
        return false;
      }
      return record.cacheVersion === buildSnapshotCacheVersion(snapshot);
    },
    buildCacheVersion(snapshot) {
      return buildSnapshotCacheVersion(snapshot);
    },
  };
}
