import {
  createEmptyBrowserSessionState,
  openSnapshotSession,
  type BrowserSessionState,
} from '../../../browser-session';
import type {
  SavedCanvasBrowserSessionLifecyclePort,
  SavedCanvasBrowserSessionState,
  SavedCanvasOpenBrowserSessionOptions,
} from '../../application/browser-state/browserSessionPort';

/**
 * Concrete adapter from saved-canvas browser-session ports to the current
 * browser-session implementation.
 */
export const browserSessionLifecycleAdapter: SavedCanvasBrowserSessionLifecyclePort = {
  createEmptyState() {
    return createEmptyBrowserSessionState() as SavedCanvasBrowserSessionState;
  },
  openSnapshotSession(state, options) {
    return openSnapshotSession(state as BrowserSessionState, options as SavedCanvasOpenBrowserSessionOptions) as SavedCanvasBrowserSessionState;
  },
};
