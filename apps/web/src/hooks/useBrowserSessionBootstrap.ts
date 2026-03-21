import { useEffect, useRef, useState } from 'react';
import type { SnapshotSummary } from '../appModel';
import type { SnapshotCache } from '../snapshotCache';
import { useBrowserSession, type BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { getBrowserSnapshotCache } from '../snapshotCache';

export type BrowserSessionBootstrapStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type BrowserSessionBootstrapOutcome = {
  status: BrowserSessionBootstrapStatus;
  message: string | null;
  opened: boolean;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

export async function bootstrapPreparedBrowserSession(options: {
  cache: Pick<SnapshotCache, 'getSnapshot' | 'isSnapshotCurrent'>;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  openSnapshotSession: BrowserSessionContextValue['openSnapshotSession'];
}): Promise<BrowserSessionBootstrapOutcome> {
  const { cache, workspaceId, repositoryId, snapshot, currentState, openSnapshotSession } = options;

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

  const cachedRecord = await cache.getSnapshot(snapshot.id);
  if (!cachedRecord || !cache.isSnapshotCurrent(snapshot, cachedRecord)) {
    return {
      status: 'failed',
      message: `Snapshot ${snapshot.snapshotKey} is not prepared locally yet. Return to Snapshots and prepare Browser data first.`,
      opened: false,
    };
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
  const openSnapshotSessionRef = useRef(browserSession.openSnapshotSession);
  currentStateRef.current = browserSession.state;
  openSnapshotSessionRef.current = browserSession.openSnapshotSession;

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
          cache: getBrowserSnapshotCache(),
          workspaceId: options.workspaceId,
          repositoryId: options.repositoryId,
          snapshot: options.snapshot,
          currentState: currentStateRef.current,
          openSnapshotSession: openSnapshotSessionRef.current,
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
