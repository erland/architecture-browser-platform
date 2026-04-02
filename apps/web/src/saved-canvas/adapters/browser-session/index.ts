/**
 * Adapter-layer browser-session surface for saved-canvas workflows.
 */
export type {
  SavedCanvasBrowserSessionLifecyclePort,
  SavedCanvasBrowserSessionState,
  SavedCanvasOpenBrowserSessionOptions,
} from '../../ports/browserSession';
export { browserSessionLifecycleAdapter } from '../../ports/browserSessionAdapter';
