import type { SavedCanvasLocalRecord, SavedCanvasLocalStore, SavedCanvasRemoteRecord, SavedCanvasRemoteStore } from '../ports/storage';
import type { SavedCanvasDocument } from '../../domain/model/document';
import { markSavedCanvasConflicted, markSavedCanvasSyncFailed } from './model';
import type { SavedCanvasSyncMutation } from './remoteOperations';
import { buildConflictMessage, getRemoteLocation } from './helpers';

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

async function loadRemoteCanvasForConflict(
  remoteStore: SavedCanvasRemoteStore,
  record: SavedCanvasLocalRecord,
): Promise<SavedCanvasRemoteRecord | null> {
  const location = getRemoteLocation(record);
  try {
    return await remoteStore.getCanvas(location.workspaceId, location.snapshotId, record.canvasId);
  } catch {
    return null;
  }
}

export async function applyConflictToLocalRecord(
  localStore: SavedCanvasLocalStore,
  remoteStore: SavedCanvasRemoteStore,
  record: SavedCanvasLocalRecord,
): Promise<SavedCanvasSyncMutation> {
  const remoteRecord = await loadRemoteCanvasForConflict(remoteStore, record);
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
