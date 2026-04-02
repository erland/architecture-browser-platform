import type { BrowserSessionContextValue } from '../../contexts/BrowserSessionContext';
import type { BrowserSessionState } from '../browserSessionStore.types';

/**
 * Explicit browser-session port consumed by saved-canvas controller workflows.
 *
 * Important boundary rule:
 * - browser-session must not import saved-canvas browser-state types
 * - saved-canvas may depend on this narrowed browser-session surface
 *
 * Using the native BrowserSessionState here removes the remaining
 * browser-session -> saved-canvas type dependency and turns the relationship
 * into a one-way integration seam.
 */
export type BrowserSessionSavedCanvasPort = {
  state: BrowserSessionState;
  lifecycle: {
    replaceState: (state: BrowserSessionState) => void;
  };
};

export function createBrowserSessionSavedCanvasPort(
  browserSession: BrowserSessionContextValue,
): BrowserSessionSavedCanvasPort {
  return {
    state: browserSession.state,
    lifecycle: {
      replaceState: (state) => browserSession.lifecycle.replaceState(state),
    },
  };
}
