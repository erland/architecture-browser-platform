import type { SavedCanvasDocument, SavedCanvasSyncState } from './savedCanvasModel';

const DB_NAME = 'architecture-browser-platform-saved-canvases';
const STORE_NAME = 'saved-canvases';
const DB_VERSION = 1;

export type SavedCanvasLocalRecord = {
  canvasId: string;
  name: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  originSnapshotId: string;
  currentTargetSnapshotId: string | null;
  snapshotKey: string;
  syncState: SavedCanvasSyncState;
  localVersion: number;
  updatedAt: string;
  lastModifiedAt: string;
  document: SavedCanvasDocument;
};

export interface SavedCanvasLocalStorage {
  get(canvasId: string): Promise<SavedCanvasLocalRecord | null>;
  put(document: SavedCanvasDocument): Promise<SavedCanvasLocalRecord>;
  has(canvasId: string): Promise<boolean>;
  remove(canvasId: string): Promise<void>;
  clear(): Promise<void>;
  list(): Promise<SavedCanvasLocalRecord[]>;
}

export interface SavedCanvasLocalStore {
  getCanvas(canvasId: string): Promise<SavedCanvasLocalRecord | null>;
  putCanvas(document: SavedCanvasDocument): Promise<SavedCanvasLocalRecord>;
  hasCanvas(canvasId: string): Promise<boolean>;
  deleteCanvas(canvasId: string): Promise<void>;
  clearAll(): Promise<void>;
  listCanvases(filter?: {
    workspaceId?: string | null;
    repositoryRegistrationId?: string | null;
    snapshotId?: string | null;
  }): Promise<SavedCanvasLocalRecord[]>;
}

function normalizeSavedCanvasLocalRecord(document: SavedCanvasDocument): SavedCanvasLocalRecord {
  return {
    canvasId: document.canvasId,
    name: document.name,
    workspaceId: document.bindings.originSnapshot.workspaceId,
    repositoryRegistrationId: document.bindings.originSnapshot.repositoryRegistrationId,
    originSnapshotId: document.bindings.originSnapshot.snapshotId,
    currentTargetSnapshotId: document.bindings.currentTargetSnapshot?.snapshotId ?? null,
    snapshotKey: document.bindings.originSnapshot.snapshotKey,
    syncState: document.sync.state,
    localVersion: document.sync.localVersion,
    updatedAt: document.metadata.updatedAt,
    lastModifiedAt: document.sync.lastModifiedAt,
    document: structuredClone(document),
  };
}

function sortRecordsDescending(records: SavedCanvasLocalRecord[]): SavedCanvasLocalRecord[] {
  return [...records].sort((left, right) => {
    const rightKey = right.lastModifiedAt || right.updatedAt || '';
    const leftKey = left.lastModifiedAt || left.updatedAt || '';
    return rightKey.localeCompare(leftKey);
  });
}

export class InMemorySavedCanvasLocalStorage implements SavedCanvasLocalStorage {
  private readonly records = new Map<string, SavedCanvasLocalRecord>();

  async get(canvasId: string) {
    const record = this.records.get(canvasId);
    return record ? structuredClone(record) : null;
  }

  async put(document: SavedCanvasDocument) {
    const normalized = normalizeSavedCanvasLocalRecord(document);
    this.records.set(normalized.canvasId, structuredClone(normalized));
    return structuredClone(normalized);
  }

  async has(canvasId: string) {
    return this.records.has(canvasId);
  }

  async remove(canvasId: string) {
    this.records.delete(canvasId);
  }

  async clear() {
    this.records.clear();
  }

  async list() {
    return sortRecordsDescending([...this.records.values()].map((record) => structuredClone(record)));
  }
}

class IndexedDbSavedCanvasLocalStorage implements SavedCanvasLocalStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDatabase() {
    if (!this.dbPromise) {
      this.dbPromise = openSavedCanvasDatabase();
    }
    return this.dbPromise;
  }

  async get(canvasId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const record = await readRequest<SavedCanvasLocalRecord | undefined>(transaction.objectStore(STORE_NAME).get(canvasId));
    await awaitTransaction(transaction);
    return record ? structuredClone(record) : null;
  }

  async put(document: SavedCanvasDocument) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const record = normalizeSavedCanvasLocalRecord(document);
    transaction.objectStore(STORE_NAME).put(record);
    await awaitTransaction(transaction);
    return structuredClone(record);
  }

  async has(canvasId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const key = await readRequest<IDBValidKey | undefined>(transaction.objectStore(STORE_NAME).getKey(canvasId));
    await awaitTransaction(transaction);
    return key !== undefined;
  }

  async remove(canvasId: string) {
    const db = await this.getDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(canvasId);
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
    const records = await readRequest<SavedCanvasLocalRecord[]>(transaction.objectStore(STORE_NAME).getAll());
    await awaitTransaction(transaction);
    return sortRecordsDescending(records.map((record) => structuredClone(record)));
  }
}

function openSavedCanvasDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'canvasId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB saved canvas database.'));
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

export function createSavedCanvasLocalStore(storage: SavedCanvasLocalStorage): SavedCanvasLocalStore {
  return {
    async getCanvas(canvasId) {
      return storage.get(canvasId);
    },
    async putCanvas(document) {
      return storage.put(document);
    },
    async hasCanvas(canvasId) {
      return storage.has(canvasId);
    },
    async deleteCanvas(canvasId) {
      await storage.remove(canvasId);
    },
    async clearAll() {
      await storage.clear();
    },
    async listCanvases(filter) {
      const records = await storage.list();
      return records.filter((record) => {
        if (filter?.workspaceId && record.workspaceId !== filter.workspaceId) {
          return false;
        }
        if (filter?.repositoryRegistrationId && record.repositoryRegistrationId !== filter.repositoryRegistrationId) {
          return false;
        }
        if (filter?.snapshotId && record.originSnapshotId !== filter.snapshotId && record.currentTargetSnapshotId !== filter.snapshotId) {
          return false;
        }
        return true;
      });
    },
  };
}

let browserSavedCanvasLocalStoreSingleton: SavedCanvasLocalStore | null = null;

function canUseIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

export function getBrowserSavedCanvasLocalStore() {
  if (!browserSavedCanvasLocalStoreSingleton) {
    browserSavedCanvasLocalStoreSingleton = createSavedCanvasLocalStore(
      canUseIndexedDb()
        ? new IndexedDbSavedCanvasLocalStorage()
        : new InMemorySavedCanvasLocalStorage(),
    );
  }
  return browserSavedCanvasLocalStoreSingleton;
}
