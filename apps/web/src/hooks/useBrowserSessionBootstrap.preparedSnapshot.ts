import type { FullSnapshotPayload, SnapshotSummary } from '../app-model';
import {
  loadPreparedSnapshotRecordForSummary,
  type PreparedSnapshotCachePort,
  type PreparedSnapshotCacheRecord,
} from '../browser-snapshot';
import { shouldClearStaleBrowserSession } from './useBrowserSessionBootstrap.stalePolicy';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import {
  buildPreparedSnapshotFetchFailureMessage,
  buildPreparedSnapshotUnavailableMessage,
} from './useBrowserSessionBootstrap.messages';
import { fetchAndCachePreparedSnapshotRecord } from './useBrowserSessionBootstrap.preparedSnapshot.fetch';

function isOfflineEnvironment() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export type BrowserSessionPreparedSnapshotAcquisitionInput = {
  cache: PreparedSnapshotCachePort;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  fetchFullSnapshotPayload?: (workspaceId: string, snapshotId: string) => Promise<FullSnapshotPayload>;
};

export type BrowserSessionPreparedSnapshotAcquisitionOutcome =
  | {
      status: 'ready';
      record: PreparedSnapshotCacheRecord;
      opened: false;
      message: null;
      shouldClearStaleSession: false;
      source: 'cache' | 'fetched';
    }
  | {
      status: 'failed';
      record: null;
      opened: false;
      message: string;
      shouldClearStaleSession: boolean;
      source: 'unavailable' | 'fetch-error';
    };

export async function acquirePreparedSnapshotForBrowserSession(
  options: BrowserSessionPreparedSnapshotAcquisitionInput,
): Promise<BrowserSessionPreparedSnapshotAcquisitionOutcome> {
  const { cache, workspaceId, repositoryId, snapshot, currentState, fetchFullSnapshotPayload } = options;

  const staleSessionInput = {
    workspaceId,
    repositoryId,
    snapshot,
    currentState,
  };

  const cachedRecord = await loadPreparedSnapshotRecordForSummary(cache, snapshot);
  if (cachedRecord) {
    return {
      status: 'ready',
      record: cachedRecord,
      opened: false,
      message: null,
      shouldClearStaleSession: false,
      source: 'cache',
    };
  }

  if (isOfflineEnvironment()) {
    return {
      status: 'failed',
      record: null,
      opened: false,
      message: buildPreparedSnapshotUnavailableMessage(snapshot.snapshotKey),
      shouldClearStaleSession: shouldClearStaleBrowserSession(staleSessionInput),
      source: 'unavailable',
    };
  }

  try {
    const fetchedRecord = await fetchAndCachePreparedSnapshotRecord({
      cache,
      snapshot,
      fetchFullSnapshotPayload,
    });
    return {
      status: 'ready',
      record: fetchedRecord,
      opened: false,
      message: null,
      shouldClearStaleSession: false,
      source: 'fetched',
    };
  } catch (caught) {
    return {
      status: 'failed',
      record: null,
      opened: false,
      message: buildPreparedSnapshotFetchFailureMessage(snapshot.snapshotKey, caught),
      shouldClearStaleSession: shouldClearStaleBrowserSession(staleSessionInput),
      source: 'fetch-error',
    };
  }
}
