import type { SavedCanvasDocument, SavedCanvasSyncState } from '../model/document';

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
  retriedCount: number;
  recoveredCount: number;
  syncedCanvasIds: string[];
  failedCanvasIds: string[];
  conflictedCanvasIds: string[];
  recoveredCanvasIds: string[];
  replacedCanvasIds: Array<{ previousCanvasId: string; currentCanvasId: string }>;
};

export const PENDING_SYNC_STATES: SavedCanvasSyncState[] = [
  'LOCAL_ONLY',
  'LOCALLY_MODIFIED',
  'PENDING_SYNC',
  'DELETED_LOCALLY_PENDING_SYNC',
];

export function createEmptySavedCanvasSyncResult(): SavedCanvasSyncResult {
  return {
    uploadedCount: 0,
    deletedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    retriedCount: 0,
    recoveredCount: 0,
    syncedCanvasIds: [],
    failedCanvasIds: [],
    conflictedCanvasIds: [],
    recoveredCanvasIds: [],
    replacedCanvasIds: [],
  };
}

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
