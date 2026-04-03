import { useEffect, useRef, useState } from 'react';
import type { FullSnapshotPayload, SnapshotSummary } from '../app-model';
import { platformApi } from '../api/platformApi';
import { hydrateBrowserSessionState } from '../browser-session';
import { useBrowserSession, type BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { getBrowserPreparedSnapshotCache, loadPreparedSnapshotRecordForSummary, type PreparedSnapshotCachePort } from '../browser-snapshot';

export type BrowserSessionBootstrapStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type BrowserSessionBootstrapOutcome = {
  status: BrowserSessionBootstrapStatus;
  message: string | null;
  opened: boolean;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

function isOfflineEnvironment() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function shouldClearStaleBrowserSession(options: {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot'>;
}) {
  const activeSnapshot = options.currentState.activeSnapshot;
  if (!activeSnapshot) {
    return false;
  }

  if (!options.workspaceId) {
    return false;
  }

  if (activeSnapshot.workspaceId != options.workspaceId) {
    return true;
  }

  if (options.repositoryId && activeSnapshot.repositoryId !== options.repositoryId) {
    return true;
  }

  if (options.snapshot && activeSnapshot.snapshotId !== options.snapshot.id) {
    return true;
  }

  if (!options.snapshot && options.repositoryId && activeSnapshot.repositoryId === options.repositoryId) {
    return false;
  }

  return false;
}

async function fetchAndCachePreparedSnapshotRecord(options: {
  cache: PreparedSnapshotCachePort;
  snapshot: SnapshotSummary;
  fetchFullSnapshotPayload?: (workspaceId: string, snapshotId: string) => Promise<FullSnapshotPayload>;
}) {
  const { cache, snapshot, fetchFullSnapshotPayload } = options;
  const fetchPayload = fetchFullSnapshotPayload ?? ((workspaceId: string, snapshotId: string) =>
    platformApi.getFullSnapshotPayload<FullSnapshotPayload>(workspaceId, snapshotId));

  const payload = await fetchPayload(snapshot.workspaceId, snapshot.id);
  return cache.putSnapshot({
    workspaceId: snapshot.workspaceId,
    repositoryId: snapshot.repositoryRegistrationId,
    snapshotKey: snapshot.snapshotKey,
    cacheVersion: cache.buildCacheVersion(payload.snapshot),
    payload,
  });
}

function buildPreparedSnapshotUnavailableMessage(snapshot: SnapshotSummary) {
  return `Snapshot ${snapshot.snapshotKey} is not available locally and cannot be prepared right now.`;
}

export async function bootstrapPreparedBrowserSession(options: {
  cache: PreparedSnapshotCachePort;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  openSnapshotSession: BrowserSessionContextValue['lifecycle']['openSnapshotSession'];
  clearSnapshotSession?: () => void;
  fetchFullSnapshotPayload?: (workspaceId: string, snapshotId: string) => Promise<FullSnapshotPayload>;
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
      message: `Browser session ready for snapshot ${snapshot.snapshotKey}.`,
      opened: false,
    };
  }

  let cachedRecord = await loadPreparedSnapshotRecordForSummary(cache, snapshot);
  if (!cachedRecord) {
    if (isOfflineEnvironment()) {
      if (clearSnapshotSession && shouldClearStaleBrowserSession({ workspaceId, repositoryId, snapshot, currentState })) {
        clearSnapshotSession();
      }
      return {
        status: 'failed',
        message: buildPreparedSnapshotUnavailableMessage(snapshot),
        opened: false,
      };
    }

    try {
      cachedRecord = await fetchAndCachePreparedSnapshotRecord({
        cache,
        snapshot,
        fetchFullSnapshotPayload,
      });
    } catch (caught) {
      if (clearSnapshotSession && shouldClearStaleBrowserSession({ workspaceId, repositoryId, snapshot, currentState })) {
        clearSnapshotSession();
      }
      const message = toErrorMessage(caught);
      return {
        status: 'failed',
        message: `Failed to prepare snapshot ${snapshot.snapshotKey} for Browser use. ${message}`,
        opened: false,
      };
    }
  }

  openSnapshotSession({
    workspaceId,
    repositoryId,
    payload: cachedRecord.payload,
    preparedAt: cachedRecord.cachedAt,
    keepViewState: currentState.activeSnapshot?.snapshotId === snapshot.id,
  });

  return {
    status: 'ready',
    message: `Browser session ready for snapshot ${snapshot.snapshotKey}.`,
    opened: true,
  };
}

export function useBrowserSessionBootstrap(options: {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
}) {
  const browserSession = useBrowserSession();
  const [status, setStatus] = useState<BrowserSessionBootstrapStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const currentStateRef = useRef(browserSession.state);
  const openSnapshotSessionRef = useRef(browserSession.lifecycle.openSnapshotSession);
  const replaceStateRef = useRef(browserSession.lifecycle.replaceState);
  currentStateRef.current = browserSession.state;
  openSnapshotSessionRef.current = browserSession.lifecycle.openSnapshotSession;
  replaceStateRef.current = browserSession.lifecycle.replaceState;

  const activeSnapshotId = browserSession.state.activeSnapshot?.snapshotId ?? null;
  const hasIndex = Boolean(browserSession.state.index);
  const hasPayload = Boolean(browserSession.state.payload);
  const snapshotId = options.snapshot?.id ?? null;
  const snapshotKey = options.snapshot?.snapshotKey ?? null;
  const bootstrapTargetKey = snapshotId && options.workspaceId ? `${options.workspaceId}:${snapshotId}` : null;
  const completedBootstrapKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!options.workspaceId || !options.snapshot) {
        completedBootstrapKeyRef.current = null;
        if (shouldClearStaleBrowserSession({
          workspaceId: options.workspaceId,
          repositoryId: options.repositoryId,
          snapshot: options.snapshot,
          currentState: currentStateRef.current,
        })) {
          replaceStateRef.current(hydrateBrowserSessionState());
        }
        if (!cancelled) {
          setStatus('idle');
          setMessage(null);
        }
        return;
      }

      if (
        bootstrapTargetKey &&
        completedBootstrapKeyRef.current === bootstrapTargetKey &&
        activeSnapshotId === snapshotId &&
        hasIndex &&
        hasPayload
      ) {
        if (!cancelled) {
          setStatus('ready');
          setMessage(`Browser session ready for snapshot ${options.snapshot.snapshotKey}.`);
        }
        return;
      }

      if (!cancelled) {
        setStatus('loading');
        setMessage(`Loading prepared Browser session for snapshot ${options.snapshot.snapshotKey}…`);
      }

      try {
        const outcome = await bootstrapPreparedBrowserSession({
          cache: getBrowserPreparedSnapshotCache(),
          workspaceId: options.workspaceId,
          repositoryId: options.repositoryId,
          snapshot: options.snapshot,
          currentState: currentStateRef.current,
          openSnapshotSession: openSnapshotSessionRef.current,
          clearSnapshotSession: () => replaceStateRef.current(hydrateBrowserSessionState()),
        });
        if (outcome.status === 'ready' && bootstrapTargetKey) {
          completedBootstrapKeyRef.current = bootstrapTargetKey;
        }
        if (!cancelled) {
          setStatus(outcome.status);
          setMessage(outcome.message);
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus('failed');
          setMessage(`Browser session bootstrap failed: ${toErrorMessage(caught)}`);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [activeSnapshotId, hasIndex, hasPayload, options.repositoryId, options.workspaceId, snapshotId, snapshotKey, bootstrapTargetKey]);

  return {
    status,
    message,
    isReady: status === 'ready',
  };
}
