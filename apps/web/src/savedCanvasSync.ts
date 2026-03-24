import type { SavedCanvasLocalRecord, SavedCanvasLocalStore } from './savedCanvasLocalStore';
import type { SavedCanvasRemoteRecord, SavedCanvasRemoteStore } from './savedCanvasRemoteStore';
import type { SavedCanvasDocument, SavedCanvasSyncState } from './savedCanvasModel';
import { HttpError } from './httpClient';

export type SavedCanvasSyncFilter = {
  workspaceId?: string | null;
  repositoryRegistrationId?: string | null;
  snapshotId?: string | null;
};

export type SavedCanvasSyncResult = {
  uploadedCount: number;
  deletedCount: number;
  skippedCount: number;
  failedCount: number;
  conflictCount: number;
  syncedCanvasIds: string[];
  failedCanvasIds: string[];
  conflictedCanvasIds: string[];
  replacedCanvasIds: Array<{ previousCanvasId: string; currentCanvasId: string }>;
};

export interface SavedCanvasSyncService {
  markCanvasPendingSync(document: SavedCanvasDocument, now?: string): Promise<SavedCanvasLocalRecord>;
  markCanvasDeletedPendingSync(record: SavedCanvasLocalRecord, now?: string): Promise<void>;
  syncPendingCanvases(filter?: SavedCanvasSyncFilter): Promise<SavedCanvasSyncResult>;
}

const PENDING_SYNC_STATES: SavedCanvasSyncState[] = [
  'LOCAL_ONLY',
  'LOCALLY_MODIFIED',
  'PENDING_SYNC',
  'DELETED_LOCALLY_PENDING_SYNC',
];

export function markSavedCanvasPendingSync(document: SavedCanvasDocument, now = new Date().toISOString()): SavedCanvasDocument {
  return {
    ...document,
    sync: {
      ...document.sync,
      state: 'PENDING_SYNC',
      lastModifiedAt: now,
      lastSyncError: null,
      conflict: null,
    },
    metadata: {
      ...document.metadata,
      updatedAt: now,
    },
  };
}

export function markSavedCanvasDeletedPendingSync(document: SavedCanvasDocument, now = new Date().toISOString()): SavedCanvasDocument {
  return {
    ...document,
    sync: {
      ...document.sync,
      state: 'DELETED_LOCALLY_PENDING_SYNC',
      lastModifiedAt: now,
      lastSyncError: null,
      conflict: null,
    },
    metadata: {
      ...document.metadata,
      updatedAt: now,
    },
  };
}

export function markSavedCanvasSynchronized(document: SavedCanvasDocument, options: {
  canvasId?: string;
  name?: string;
  backendVersion: string | null;
  syncedAt?: string;
}): SavedCanvasDocument {
  const syncedAt = options.syncedAt ?? new Date().toISOString();
  return {
    ...document,
    canvasId: options.canvasId ?? document.canvasId,
    name: options.name ?? document.name,
    sync: {
      ...document.sync,
      state: 'SYNCHRONIZED',
      backendVersion: options.backendVersion,
      lastSyncedAt: syncedAt,
      lastSyncError: null,
      conflict: null,
    },
  };
}

export function markSavedCanvasSyncFailed(document: SavedCanvasDocument, message: string, now = new Date().toISOString()): SavedCanvasDocument {
  return {
    ...document,
    sync: {
      ...document.sync,
      state: document.sync.state === 'DELETED_LOCALLY_PENDING_SYNC' ? 'DELETED_LOCALLY_PENDING_SYNC' : 'PENDING_SYNC',
      lastModifiedAt: document.sync.lastModifiedAt ?? now,
      lastSyncError: message,
    },
    metadata: {
      ...document.metadata,
      updatedAt: document.metadata.updatedAt ?? now,
    },
  };
}

export function markSavedCanvasConflicted(document: SavedCanvasDocument, options: {
  backendVersion: string | null;
  message: string;
  detectedAt?: string;
}): SavedCanvasDocument {
  const detectedAt = options.detectedAt ?? new Date().toISOString();
  return {
    ...document,
    sync: {
      ...document.sync,
      state: 'CONFLICTED',
      backendVersion: options.backendVersion,
      lastSyncError: options.message,
      conflict: {
        detectedAt,
        backendVersion: options.backendVersion,
        message: options.message,
      },
    },
    metadata: {
      ...document.metadata,
      updatedAt: detectedAt,
    },
  };
}

function shouldAttemptSync(record: SavedCanvasLocalRecord) {
  return PENDING_SYNC_STATES.includes(record.syncState);
}

function getRemoteLocation(record: SavedCanvasLocalRecord) {
  const snapshotRef = record.document.bindings.currentTargetSnapshot ?? record.document.bindings.originSnapshot;
  return {
    workspaceId: snapshotRef.workspaceId,
    snapshotId: snapshotRef.snapshotId,
  };
}

function isConflictError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 409;
}

function buildConflictMessage(record: SavedCanvasLocalRecord, remoteRecord: SavedCanvasRemoteRecord | null): string {
  const remoteVersion = remoteRecord?.backendVersion ?? null;
  const base = remoteVersion
    ? `Saved canvas conflict detected. Backend version ${remoteVersion} differs from local expected version ${record.document.sync.backendVersion ?? 'none'}.`
    : 'Saved canvas conflict detected because the backend copy changed.';
  if (remoteRecord?.updatedAt) {
    return `${base} Remote copy was updated at ${remoteRecord.updatedAt}.`;
  }
  return base;
}

export function createSavedCanvasSyncService(localStore: SavedCanvasLocalStore, remoteStore: SavedCanvasRemoteStore): SavedCanvasSyncService {
  return {
    async markCanvasPendingSync(document, now) {
      return localStore.putCanvas(markSavedCanvasPendingSync(document, now));
    },
    async markCanvasDeletedPendingSync(record, now) {
      if (!record.document.sync.backendVersion) {
        await localStore.deleteCanvas(record.canvasId);
        return;
      }
      await localStore.putCanvas(markSavedCanvasDeletedPendingSync(record.document, now));
    },
    async syncPendingCanvases(filter) {
      const records = await localStore.listCanvases({ ...filter, includeDeletedPendingSync: true });
      const result: SavedCanvasSyncResult = {
        uploadedCount: 0,
        deletedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        syncedCanvasIds: [],
        failedCanvasIds: [],
        conflictedCanvasIds: [],
        replacedCanvasIds: [],
      };

      for (const record of records) {
        if (!shouldAttemptSync(record)) {
          result.skippedCount += 1;
          continue;
        }

        try {
          const location = getRemoteLocation(record);
          if (record.syncState === 'DELETED_LOCALLY_PENDING_SYNC') {
            if (record.document.sync.backendVersion) {
              await remoteStore.deleteCanvas(location.workspaceId, location.snapshotId, record.canvasId, record.document.sync.backendVersion);
            }
            await localStore.deleteCanvas(record.canvasId);
            result.deletedCount += 1;
            result.syncedCanvasIds.push(record.canvasId);
            continue;
          }

          let synchronized = record.document;
          if (record.document.sync.backendVersion) {
            const updated = await remoteStore.updateCanvas(location.workspaceId, location.snapshotId, {
              ...record.document,
              canvasId: record.canvasId,
            }, record.document.sync.backendVersion);
            synchronized = markSavedCanvasSynchronized({
              ...record.document,
              canvasId: record.canvasId,
            }, {
              canvasId: updated.canvasId,
              name: updated.name,
              backendVersion: updated.backendVersion,
            });
          } else {
            const created = await remoteStore.createCanvas(location.workspaceId, location.snapshotId, record.document);
            synchronized = markSavedCanvasSynchronized(record.document, {
              canvasId: created.canvasId,
              name: created.name,
              backendVersion: created.backendVersion,
            });
          }

          if (synchronized.canvasId !== record.canvasId) {
            await localStore.deleteCanvas(record.canvasId);
            result.replacedCanvasIds.push({ previousCanvasId: record.canvasId, currentCanvasId: synchronized.canvasId });
          }
          await localStore.putCanvas(synchronized);
          result.uploadedCount += 1;
          result.syncedCanvasIds.push(synchronized.canvasId);
        } catch (error) {
          if (isConflictError(error)) {
            const location = getRemoteLocation(record);
            let remoteRecord: SavedCanvasRemoteRecord | null = null;
            try {
              remoteRecord = await remoteStore.getCanvas(location.workspaceId, location.snapshotId, record.canvasId);
            } catch {
              remoteRecord = null;
            }
            const conflicted = markSavedCanvasConflicted(record.document, {
              backendVersion: remoteRecord?.backendVersion ?? null,
              message: buildConflictMessage(record, remoteRecord),
            });
            await localStore.putCanvas(conflicted);
            result.conflictCount += 1;
            result.conflictedCanvasIds.push(record.canvasId);
            continue;
          }

          const message = error instanceof Error ? error.message : 'Saved canvas sync failed.';
          await localStore.putCanvas(markSavedCanvasSyncFailed(record.document, message));
          result.failedCount += 1;
          result.failedCanvasIds.push(record.canvasId);
        }
      }

      return result;
    },
  };
}
