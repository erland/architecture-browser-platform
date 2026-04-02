/**
 * Application-layer browser-state workflows.
 *
 * These exports translate between the live browser session and saved-canvas
 * documents while depending on explicit browser-session ports.
 */
export {
  buildSavedCanvasDocumentForSave,
  createSavedCanvasId,
  defaultSavedCanvasName,
} from '../browser-state/document';
export {
  buildSavedCanvasTrackedDocument,
  hasSavedCanvasTrackedContentEdits,
  hasSavedCanvasTrackedNameEdit,
} from '../browser-state/editTracking';
export {
  createSavedCanvasDocumentFromBrowserSession,
  restoreSavedCanvasToBrowserSession,
} from '../browser-state/sessionMapping';
export type {
  CreateSavedCanvasFromBrowserSessionOptions,
  RestoreSavedCanvasToBrowserSessionOptions,
  RestoreSavedCanvasToBrowserSessionResult,
} from '../browser-state/sessionMapping';
