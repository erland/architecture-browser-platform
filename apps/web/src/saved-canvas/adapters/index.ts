/**
 * Canonical adapter-layer public entrypoint for the saved-canvas subsystem.
 *
 * Adapter exports own concrete storage and browser-session integration.
 */
export {
  createSavedCanvasLocalStore,
  getBrowserSavedCanvasLocalStore,
  InMemorySavedCanvasLocalStorage,
} from './storage-impl/localStore';
export type {
  SavedCanvasLocalListFilter,
  SavedCanvasLocalRecord,
  SavedCanvasLocalStorage,
  SavedCanvasLocalStore,
  SavedCanvasRemoteRecord,
  SavedCanvasRemoteStore,
} from '../application/ports/storage';
export { createSavedCanvasRemoteStore } from './storage-impl/remoteStore';
export type { SavedCanvasBackendResponseDto } from '../../app-model';
export type {
  SavedCanvasBrowserSessionLifecyclePort,
  SavedCanvasBrowserSessionState,
  SavedCanvasOpenBrowserSessionOptions,
} from './browser-session-impl/browserSession';
export { browserSessionLifecycleAdapter } from './browser-session-impl/browserSessionAdapter';
