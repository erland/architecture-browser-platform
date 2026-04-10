/**
 * Narrow lifecycle entrypoint for browser-session consumers.
 */

export { openSnapshotSession } from './lifecycle/lifecycle';
export {
  readPersistedBrowserSession,
  persistBrowserSession,
} from './lifecycle/persistence';
