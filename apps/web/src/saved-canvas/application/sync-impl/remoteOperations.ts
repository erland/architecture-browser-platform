import type { SavedCanvasLocalRecord, SavedCanvasRemoteStore } from '../ports/storage';
import type { SavedCanvasDocument } from '../../domain/model/document';
import { markSavedCanvasSynchronized, type SavedCanvasSyncResult } from './model';
import {
  getRemoteLocation,
  isNotFoundError,
  toRecoveryMessage,
  withSingleRetry,
} from './helpers';

export type SavedCanvasSyncAccumulator = SavedCanvasSyncResult;
export type SavedCanvasSyncMutation = (result: SavedCanvasSyncAccumulator) => void;

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
