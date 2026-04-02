/**
 * Application-layer sync workflows.
 *
 * This layer owns saved-canvas synchronization use-cases and sync-state helper
 * transitions while leaving persistence details to adapter implementations.
 */
export {
  createSavedCanvasSyncService,
  markSavedCanvasConflicted,
  markSavedCanvasDeletedPendingSync,
  markSavedCanvasPendingSync,
  markSavedCanvasSyncFailed,
  markSavedCanvasSynchronized,
} from '../sync/service';
export type {
  SavedCanvasSyncFilter,
  SavedCanvasSyncResult,
  SavedCanvasSyncService,
} from '../sync/service';
export { createEmptySavedCanvasSyncResult } from '../sync/model';
