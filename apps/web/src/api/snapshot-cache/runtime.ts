import { createSnapshotCache } from './factory';
import { IndexedDbSnapshotCacheStorage } from './storage/indexedDb';
import { InMemorySnapshotCacheStorage } from './storage/inMemory';
import type { SnapshotCache } from './types';

let browserSnapshotCacheSingleton: SnapshotCache | null = null;

export function canUseIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

export function getBrowserSnapshotCache() {
  if (!browserSnapshotCacheSingleton) {
    browserSnapshotCacheSingleton = createSnapshotCache(
      canUseIndexedDb()
        ? new IndexedDbSnapshotCacheStorage()
        : new InMemorySnapshotCacheStorage(),
    );
  }
  return browserSnapshotCacheSingleton;
}
