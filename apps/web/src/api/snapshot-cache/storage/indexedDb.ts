import { normalizeSnapshotCacheRecord, nowIsoString } from '../cacheVersion';
import type { SnapshotCacheRecord, SnapshotCacheStorage } from '../types';

const DB_NAME = 'architecture-browser-platform';
const STORE_NAME = 'snapshot-cache';
const DB_VERSION = 1;

export class IndexedDbSnapshotCacheStorage implements SnapshotCacheStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDatabase() {
    if (!this.dbPromise) {
      this.dbPromise = openSnapshotCacheDatabase();
    }
    return this.dbPromise;
  }

  async get(snapshotId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
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

  async put(snapshotId: string, input: Parameters<SnapshotCacheStorage['put']>[1]) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const record = normalizeSnapshotCacheRecord(snapshotId, input);
    store.put(record);
    await awaitTransaction(transaction);
    return record;
  }

  async has(snapshotId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const key = await readRequest<IDBValidKey | undefined>(store.getKey(snapshotId));
    await awaitTransaction(transaction);
    return key !== undefined;
  }

  async remove(snapshotId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(snapshotId);
    await awaitTransaction(transaction);
  }

  async clear() {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
    await awaitTransaction(transaction);
  }

  async list() {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
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
        db.createObjectStore(STORE_NAME, { keyPath: 'snapshotId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB snapshot cache.'));
  });
}

function readRequest<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function awaitTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}
