/**
 * Legacy compatibility facade.
 *
 * Prefer importing browser-state workflows from `saved-canvas/application`.
 */
export * from './application/browserState';
export type {
  SavedCanvasBrowserSessionState,
  SavedCanvasBrowserSessionLifecyclePort,
} from './ports/browserSession';
export { browserSessionLifecycleAdapter } from './ports/browserSessionAdapter';
