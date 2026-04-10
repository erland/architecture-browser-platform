import type { FullSnapshotPayload, SnapshotSummary } from "../../app-model";

export type SnapshotCacheRecord = {
  snapshotId: string;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshotKey: string | null;
  cacheVersion: string;
  cachedAt: string;
  lastAccessedAt: string;
  payload: FullSnapshotPayload;
};

export type SnapshotCachePutInput = {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshotKey: string | null;
  cacheVersion: string;
  payload: FullSnapshotPayload;
  cachedAt?: string;
  lastAccessedAt?: string;
};

export interface SnapshotCacheStorage {
  get(snapshotId: string): Promise<SnapshotCacheRecord | null>;
  put(snapshotId: string, input: SnapshotCachePutInput): Promise<SnapshotCacheRecord>;
  has(snapshotId: string): Promise<boolean>;
  remove(snapshotId: string): Promise<void>;
  clear(): Promise<void>;
  list(): Promise<SnapshotCacheRecord[]>;
}

export interface SnapshotCache {
  getSnapshot(snapshotId: string): Promise<SnapshotCacheRecord | null>;
  putSnapshot(input: SnapshotCachePutInput): Promise<SnapshotCacheRecord>;
  hasSnapshot(snapshotId: string): Promise<boolean>;
  removeSnapshot(snapshotId: string): Promise<void>;
  clearObsoleteSnapshots(activeSnapshotIds: string[]): Promise<number>;
  isSnapshotCurrent(snapshot: Pick<SnapshotSummary, "id" | "importedAt" | "sourceRevision" | "schemaVersion" | "indexerVersion">, record: Pick<SnapshotCacheRecord, "cacheVersion"> | null): boolean;
  buildCacheVersion(snapshot: Pick<SnapshotSummary, "importedAt" | "sourceRevision" | "schemaVersion" | "indexerVersion">): string;
}
