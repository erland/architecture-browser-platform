import type { SavedCanvasLocalRecord, SavedCanvasLocalStore } from '../storage/localStore';
import type { SavedCanvasRemoteRecord, SavedCanvasRemoteStore } from '../storage/remoteStore';
import type { SavedCanvasDocument } from '../model/document';
import { HttpError } from '../../httpClient';
import {
  markSavedCanvasConflicted,
  markSavedCanvasSyncFailed,
  markSavedCanvasSynchronized,
  type SavedCanvasSyncResult,
} from './model';

export type SavedCanvasRemoteLocation = {
  workspaceId: string;
  snapshotId: string;
};

export type SavedCanvasSyncAccumulator = SavedCanvasSyncResult;
export type SavedCanvasSyncMutation = (result: SavedCanvasSyncAccumulator) => void;

export function getRemoteLocation(record: SavedCanvasLocalRecord): SavedCanvasRemoteLocation {
  const snapshotRef = record.document.bindings.currentTargetSnapshot ?? record.document.bindings.originSnapshot;
  return {
    workspaceId: snapshotRef.workspaceId,
    snapshotId: snapshotRef.snapshotId,
  };
}

export function isConflictError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 409;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 429 || error.status >= 500;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes('offline')
    || message.includes('network')
    || message.includes('timeout')
    || message.includes('temporar')
    || message.includes('fetch failed');
}

function isNotFoundError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 404;
}

async function withSingleRetry<T>(operation: () => Promise<T>): Promise<{ value: T; retried: boolean }> {
  try {
    return { value: await operation(), retried: false };
  } catch (error) {
    if (!isRetryableError(error)) {
      throw error;
    }
    return { value: await operation(), retried: true };
  }
}

function toRecoveryMessage(record: SavedCanvasLocalRecord, error: unknown): string {
  const suffix = error instanceof Error ? error.message : 'remote copy no longer exists.';
  return `Saved canvas ${record.name} was recovered by creating a new backend copy because the previous remote record could not be updated (${suffix}).`;
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

export async function syncDeletedCanvasRecord(
  record: SavedCanvasLocalRecord,
  remoteStore: SavedCanvasRemoteStore,
): Promise<SavedCanvasSyncMutation> {
  const location = getRemoteLocation(record);

  if (record.document.sync.backendVersion) {
    try {
      const deleteResult = await withSingleRetry(() => remoteStore.deleteCanvas(
        location.workspaceId,
        location.snapshotId,
        record.canvasId,
        record.document.sync.backendVersion,
      ));
      return (result) => {
        if (deleteResult.retried) {
          result.retriedCount += 1;
        }
        result.deletedCount += 1;
        result.syncedCanvasIds.push(record.canvasId);
      };
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      return (result) => {
        result.recoveredCount += 1;
        result.recoveredCanvasIds.push(record.canvasId);
        result.deletedCount += 1;
        result.syncedCanvasIds.push(record.canvasId);
      };
    }
  }

  return (result) => {
    result.deletedCount += 1;
    result.syncedCanvasIds.push(record.canvasId);
  };
}

export async function syncUpsertCanvasRecord(
  record: SavedCanvasLocalRecord,
  remoteStore: SavedCanvasRemoteStore,
): Promise<{ synchronized: SavedCanvasDocument; mutateResult: SavedCanvasSyncMutation }> {
  const location = getRemoteLocation(record);

  if (record.document.sync.backendVersion) {
    try {
      const updateResult = await withSingleRetry(() => remoteStore.updateCanvas(location.workspaceId, location.snapshotId, {
        ...record.document,
        canvasId: record.canvasId,
      }, record.document.sync.backendVersion));
      const updated = updateResult.value;
      return {
        synchronized: markSavedCanvasSynchronized({
          ...record.document,
          canvasId: record.canvasId,
        }, {
          canvasId: updated.canvasId,
          name: updated.name,
          backendVersion: updated.backendVersion,
        }),
        mutateResult: (result) => {
          if (updateResult.retried) {
            result.retriedCount += 1;
          }
        },
      };
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      const createResult = await withSingleRetry(() => remoteStore.createCanvas(location.workspaceId, location.snapshotId, {
        ...record.document,
        canvasId: record.canvasId,
        sync: {
          ...record.document.sync,
          backendVersion: null,
          lastSyncError: toRecoveryMessage(record, error),
        },
      }));
      const created = createResult.value;
      return {
        synchronized: markSavedCanvasSynchronized({
          ...record.document,
          canvasId: record.canvasId,
        }, {
          canvasId: created.canvasId,
          name: created.name,
          backendVersion: created.backendVersion,
        }),
        mutateResult: (result) => {
          if (createResult.retried) {
            result.retriedCount += 1;
          }
          result.recoveredCount += 1;
          result.recoveredCanvasIds.push(created.canvasId);
        },
      };
    }
  }

  const createResult = await withSingleRetry(() => remoteStore.createCanvas(location.workspaceId, location.snapshotId, record.document));
  const created = createResult.value;
  return {
    synchronized: markSavedCanvasSynchronized(record.document, {
      canvasId: created.canvasId,
      name: created.name,
      backendVersion: created.backendVersion,
    }),
    mutateResult: (result) => {
      if (createResult.retried) {
        result.retriedCount += 1;
      }
    },
  };
}

export async function applySynchronizedCanvasRecord(
  localStore: SavedCanvasLocalStore,
  previousRecord: SavedCanvasLocalRecord,
  synchronized: SavedCanvasDocument,
): Promise<SavedCanvasSyncMutation> {
  if (synchronized.canvasId !== previousRecord.canvasId) {
    await localStore.deleteCanvas(previousRecord.canvasId);
  }
  await localStore.putCanvas(synchronized);

  return (result) => {
    if (synchronized.canvasId !== previousRecord.canvasId) {
      result.replacedCanvasIds.push({
        previousCanvasId: previousRecord.canvasId,
        currentCanvasId: synchronized.canvasId,
      });
    }
    result.uploadedCount += 1;
    result.syncedCanvasIds.push(synchronized.canvasId);
  };
}

export async function applyConflictToLocalRecord(
  localStore: SavedCanvasLocalStore,
  remoteStore: SavedCanvasRemoteStore,
  record: SavedCanvasLocalRecord,
): Promise<SavedCanvasSyncMutation> {
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
  return (result) => {
    result.conflictCount += 1;
    result.conflictedCanvasIds.push(record.canvasId);
  };
}

export async function applyFailedSyncToLocalRecord(
  localStore: SavedCanvasLocalStore,
  record: SavedCanvasLocalRecord,
  error: unknown,
): Promise<SavedCanvasSyncMutation> {
  const message = error instanceof Error ? error.message : 'Saved canvas sync failed.';
  await localStore.putCanvas(markSavedCanvasSyncFailed(record.document, message));
  return (result) => {
    result.failedCount += 1;
    result.failedCanvasIds.push(record.canvasId);
  };
}
