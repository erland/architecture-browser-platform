import { normalizeSnapshotCacheRecord } from '../cacheVersion';
import type { SnapshotCacheStorage } from '../types';

export class InMemorySnapshotCacheStorage implements SnapshotCacheStorage {
  private readonly records = new Map<string, ReturnType<typeof normalizeSnapshotCacheRecord>>();

  async get(snapshotId: string) {
    const record = this.records.get(snapshotId);
    return record ? structuredClone(record) : null;
  }

  async put(snapshotId: string, input: Parameters<SnapshotCacheStorage['put']>[1]) {
    const normalized = normalizeSnapshotCacheRecord(snapshotId, input);
    this.records.set(snapshotId, structuredClone(normalized));
    return structuredClone(normalized);
  }

  async has(snapshotId: string) {
    return this.records.has(snapshotId);
  }

  async remove(snapshotId: string) {
    this.records.delete(snapshotId);
  }

  async clear() {
    this.records.clear();
  }

  async list() {
    return [...this.records.values()].map((record) => structuredClone(record));
  }
}
