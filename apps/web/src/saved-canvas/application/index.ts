export { getBrowserSavedCanvasSnapshotCache } from './runtime';
/**
 * Canonical application-layer public entrypoint for the saved-canvas subsystem.
 *
 * Application exports compose domain rules into browser workflows without
 * owning concrete persistence implementations.
 */
export {
  buildSavedCanvasDocumentForSave,
  createSavedCanvasId,
  defaultSavedCanvasName,
} from './browser-state/document';
export {
  buildSavedCanvasTrackedDocument,
  hasSavedCanvasTrackedContentEdits,
  hasSavedCanvasTrackedNameEdit,
} from './browser-state/editTracking';
export {
  createSavedCanvasDocumentFromBrowserSession,
  restoreSavedCanvasToBrowserSession,
} from './browser-state/sessionMapping';
export type {
  CreateSavedCanvasFromBrowserSessionOptions,
  RestoreSavedCanvasToBrowserSessionOptions,
  RestoreSavedCanvasToBrowserSessionResult,
} from './browser-state/sessionMapping';
export {
  buildSavedCanvasOfflineUnavailableMessage,
  getSavedCanvasOfflineAvailability,
} from './opening-impl/availability';
export type {
  SavedCanvasOfflineAvailabilitySummary,
  SavedCanvasSnapshotOfflineStatus,
} from './opening-impl/availability';
export {
  loadSavedCanvasSnapshotForOpen,
  loadSelectedTargetSnapshotForSavedCanvasOpen,
} from './opening-impl/load';
export type {
  SavedCanvasOpenMode,
  SavedCanvasOpenSnapshotResult,
} from './opening-impl/load';
export {
  createSavedCanvasSyncService,
  markSavedCanvasConflicted,
  markSavedCanvasDeletedPendingSync,
  markSavedCanvasPendingSync,
  markSavedCanvasSyncFailed,
  markSavedCanvasSynchronized,
} from './sync-impl/service';
export type {
  SavedCanvasSyncFilter,
  SavedCanvasSyncResult,
  SavedCanvasSyncService,
} from './sync-impl/service';
export { createEmptySavedCanvasSyncResult } from './sync-impl/model';
export type {
  SavedCanvasSnapshotCachePort,
  SavedCanvasSnapshotCacheRecord,
  SavedCanvasSnapshotSummary,
} from './ports/snapshotCache';
export type {
  SavedCanvasLocalListFilter,
  SavedCanvasLocalRecord,
  SavedCanvasLocalStorage,
  SavedCanvasLocalStore,
  SavedCanvasRemoteRecord,
  SavedCanvasRemoteStore,
} from './ports/storage';
export type {
  SavedCanvasBrowserCanvasEdge,
  SavedCanvasBrowserCanvasLayoutMode,
  SavedCanvasBrowserCanvasNode,
  SavedCanvasBrowserCanvasViewport,
  SavedCanvasBrowserSessionLifecyclePort,
  SavedCanvasBrowserSessionSnapshot,
  SavedCanvasBrowserSessionState,
  SavedCanvasBrowserViewpointSelection,
  SavedCanvasOpenBrowserSessionOptions,
} from './browser-state/browserSessionPort';
