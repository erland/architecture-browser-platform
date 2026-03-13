import type { FullSnapshotPayload, SnapshotSummary } from "./appModel";

const DB_NAME = "architecture-browser-platform";
const STORE_NAME = "snapshot-cache";
const DB_VERSION = 1;

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

function nowIsoString() {
  return new Date().toISOString();
}

export function buildSnapshotCacheVersion(snapshot: Pick<SnapshotSummary, "importedAt" | "sourceRevision" | "schemaVersion" | "indexerVersion">) {
  return [
    snapshot.importedAt || "",
    snapshot.sourceRevision || "",
    snapshot.schemaVersion || "",
    snapshot.indexerVersion || "",
  ].join("|");
}

function normalizeRecord(snapshotId: string, input: SnapshotCachePutInput): SnapshotCacheRecord {
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

export class InMemorySnapshotCacheStorage implements SnapshotCacheStorage {
  private readonly records = new Map<string, SnapshotCacheRecord>();

  async get(snapshotId: string) {
    const record = this.records.get(snapshotId);
    return record ? structuredClone(record) : null;
  }

  async put(snapshotId: string, input: SnapshotCachePutInput) {
    const normalized = normalizeRecord(snapshotId, input);
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

class IndexedDbSnapshotCacheStorage implements SnapshotCacheStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDatabase() {
    if (!this.dbPromise) {
      this.dbPromise = openSnapshotCacheDatabase();
    }
    return this.dbPromise;
  }

  async get(snapshotId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const current = await readRequest<SnapshotCacheRecord | undefined>(store.get(snapshotId));
    if (!current) {
      await awaitTransaction(transaction);
      return null;
    }
    const updated: SnapshotCacheRecord = {
      ...current,
      lastAccessedAt: nowIsoString(),
    };
    store.put(updated);
    await awaitTransaction(transaction);
    return updated;
  }

  async put(snapshotId: string, input: SnapshotCachePutInput) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const record = normalizeRecord(snapshotId, input);
    store.put(record);
    await awaitTransaction(transaction);
    return record;
  }

  async has(snapshotId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const key = await readRequest<IDBValidKey | undefined>(store.getKey(snapshotId));
    await awaitTransaction(transaction);
    return key !== undefined;
  }

  async remove(snapshotId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(snapshotId);
    await awaitTransaction(transaction);
  }

  async clear() {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    await awaitTransaction(transaction);
  }

  async list() {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const records = await readRequest<SnapshotCacheRecord[]>(transaction.objectStore(STORE_NAME).getAll());
    await awaitTransaction(transaction);
    return records;
  }
}

function openSnapshotCacheDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "snapshotId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB snapshot cache."));
  });
}

function readRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function awaitTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

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

let browserSnapshotCacheSingleton: SnapshotCache | null = null;

function canUseIndexedDb() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
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
