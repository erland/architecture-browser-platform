import type { SavedCanvasLocalRecord, SavedCanvasLocalStore } from '../storage/localStore';
import type { SavedCanvasRemoteStore } from '../storage/remoteStore';
import type { SavedCanvasDocument } from '../model/document';
import {
  applyConflictToLocalRecord,
  applyFailedSyncToLocalRecord,
  applySynchronizedCanvasRecord,
  isConflictError,
  syncDeletedCanvasRecord,
  syncUpsertCanvasRecord,
} from './handlers';
import {
  createEmptySavedCanvasSyncResult,
  markSavedCanvasDeletedPendingSync,
  markSavedCanvasPendingSync,
  PENDING_SYNC_STATES,
  type SavedCanvasSyncFilter,
  type SavedCanvasSyncResult,
} from './model';

export type { SavedCanvasSyncFilter, SavedCanvasSyncResult } from './model';
export {
  markSavedCanvasPendingSync,
  markSavedCanvasDeletedPendingSync,
  markSavedCanvasSynchronized,
  markSavedCanvasSyncFailed,
  markSavedCanvasConflicted,
} from './model';

export interface SavedCanvasSyncService {
  markCanvasPendingSync(document: SavedCanvasDocument, now?: string): Promise<SavedCanvasLocalRecord>;
  markCanvasDeletedPendingSync(record: SavedCanvasLocalRecord, now?: string): Promise<void>;
  syncPendingCanvases(filter?: SavedCanvasSyncFilter): Promise<SavedCanvasSyncResult>;
}

function shouldAttemptSync(record: SavedCanvasLocalRecord) {
  return PENDING_SYNC_STATES.includes(record.syncState);
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
      const result = createEmptySavedCanvasSyncResult();

      for (const record of records) {
        if (!shouldAttemptSync(record)) {
          result.skippedCount += 1;
          continue;
        }

        try {
          if (record.syncState === 'DELETED_LOCALLY_PENDING_SYNC') {
            const mutation = await syncDeletedCanvasRecord(record, remoteStore);
            await localStore.deleteCanvas(record.canvasId);
            mutation(result);
            continue;
          }

          const { synchronized, mutateResult } = await syncUpsertCanvasRecord(record, remoteStore);
          const persistMutation = await applySynchronizedCanvasRecord(localStore, record, synchronized);
          mutateResult(result);
          persistMutation(result);
        } catch (error) {
          if (isConflictError(error)) {
            const mutation = await applyConflictToLocalRecord(localStore, remoteStore, record);
            mutation(result);
            continue;
          }

          const mutation = await applyFailedSyncToLocalRecord(localStore, record, error);
          mutation(result);
        }
      }

      return result;
    },
  };
}
