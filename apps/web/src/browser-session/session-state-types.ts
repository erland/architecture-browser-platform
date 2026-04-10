/**
 * Narrow session-state type entrypoint for browser-session consumers.
 *
 * Prefer this file when a consumer only needs the top-level session state
 * shapes rather than the broader browser-session type surface.
 */

export type {
  BrowserSessionSnapshot,
  BrowserSessionState,
  PersistedBrowserSessionState,
} from './model/types';
