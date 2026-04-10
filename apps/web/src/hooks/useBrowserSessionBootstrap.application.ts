import { hydrateBrowserSessionState } from '../browser-session/state';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import type { PreparedSnapshotCacheRecord } from '../browser-snapshot';
import type { SnapshotSummary } from '../app-model';
import type { BrowserSessionBootstrapOutcome, BrowserSessionBootstrapReplaceState } from './useBrowserSessionBootstrap.types';
import { buildBrowserSessionReadyMessage } from './useBrowserSessionBootstrap.messages';

export function resetBrowserSessionForBootstrap(replaceState: BrowserSessionBootstrapReplaceState) {
  replaceState(hydrateBrowserSessionState());
}

export function applyPreparedSnapshotBootstrapFailure(options: {
  snapshot: SnapshotSummary;
  message: string;
  shouldClearStaleSession: boolean;
  clearSnapshotSession?: () => void;
}): BrowserSessionBootstrapOutcome {
  const { message, shouldClearStaleSession, clearSnapshotSession } = options;
  if (clearSnapshotSession && shouldClearStaleSession) {
    clearSnapshotSession();
  }

  return {
    status: 'failed',
    message,
    opened: false,
  };
}

export function applyPreparedSnapshotToBrowserSession(options: {
  workspaceId: string;
  repositoryId: string | null;
  snapshot: SnapshotSummary;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot'>;
  record: PreparedSnapshotCacheRecord;
  openSnapshotSession: BrowserSessionContextValue['lifecycle']['openSnapshotSession'];
}): BrowserSessionBootstrapOutcome {
  const { workspaceId, repositoryId, snapshot, currentState, record, openSnapshotSession } = options;

  openSnapshotSession({
    workspaceId,
    repositoryId,
    payload: record.payload,
    preparedAt: record.cachedAt,
    keepViewState: currentState.activeSnapshot?.snapshotId === snapshot.id,
  });

  return {
    status: 'ready',
    message: buildBrowserSessionReadyMessage(snapshot.snapshotKey),
    opened: true,
  };
}
