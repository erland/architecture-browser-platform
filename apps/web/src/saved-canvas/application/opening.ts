/**
 * Application-layer saved-canvas opening workflows.
 *
 * These exports coordinate offline availability checks and snapshot loading for
 * opening saved canvases on original/current/selected snapshots.
 */
export {
  buildSavedCanvasOfflineUnavailableMessage,
  getSavedCanvasOfflineAvailability,
} from '../open/availability';
export type {
  SavedCanvasOfflineAvailabilitySummary,
  SavedCanvasSnapshotOfflineStatus,
} from '../open/availability';
export {
  loadSavedCanvasSnapshotForOpen,
  loadSelectedTargetSnapshotForSavedCanvasOpen,
} from '../open/load';
export type {
  SavedCanvasOpenMode,
  SavedCanvasOpenSnapshotResult,
} from '../open/load';
