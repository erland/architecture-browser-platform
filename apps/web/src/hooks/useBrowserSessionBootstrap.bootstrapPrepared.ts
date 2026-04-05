/**
 * Canonical prepared-browser-session bootstrap implementation.
 *
 * Internal code should import this module directly rather than routing through
 * the legacy re-export on `useBrowserSessionBootstrap.ts`.
 */
import type { SnapshotSummary } from '../app-model';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { PreparedSnapshotCachePort } from '../browser-snapshot';
import { acquirePreparedSnapshotForBrowserSession } from './useBrowserSessionBootstrap.preparedSnapshot';
import {
  applyPreparedSnapshotBootstrapFailure,
  applyPreparedSnapshotToBrowserSession,
} from './useBrowserSessionBootstrap.application';
import type { BrowserSessionBootstrapOutcome } from './useBrowserSessionBootstrap.types';
import { buildBrowserSessionReadyMessage } from './useBrowserSessionBootstrap.messages';

export async function bootstrapPreparedBrowserSession(options: {
  cache: PreparedSnapshotCachePort;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  openSnapshotSession: BrowserSessionContextValue['lifecycle']['openSnapshotSession'];
  clearSnapshotSession?: () => void;
  fetchFullSnapshotPayload?: (workspaceId: string, snapshotId: string) => Promise<import('../app-model').FullSnapshotPayload>;
}): Promise<BrowserSessionBootstrapOutcome> {
  const { cache, workspaceId, repositoryId, snapshot, currentState, openSnapshotSession, clearSnapshotSession, fetchFullSnapshotPayload } = options;

  if (!workspaceId || !snapshot) {
    return {
      status: 'idle',
      message: null,
      opened: false,
    };
  }

  const alreadyOpen = currentState.activeSnapshot?.snapshotId === snapshot.id && currentState.index && currentState.payload;
  if (alreadyOpen) {
    return {
      status: 'ready',
      message: buildBrowserSessionReadyMessage(snapshot.snapshotKey),
      opened: false,
    };
  }

  const acquisition = await acquirePreparedSnapshotForBrowserSession({
    cache,
    workspaceId,
    repositoryId,
    snapshot,
    currentState,
    fetchFullSnapshotPayload,
  });

  if (acquisition.status === 'failed') {
    return applyPreparedSnapshotBootstrapFailure({
      snapshot,
      message: acquisition.message,
      shouldClearStaleSession: acquisition.shouldClearStaleSession,
      clearSnapshotSession,
    });
  }

  return applyPreparedSnapshotToBrowserSession({
    workspaceId,
    repositoryId,
    snapshot,
    currentState,
    record: acquisition.record,
    openSnapshotSession,
  });
}
