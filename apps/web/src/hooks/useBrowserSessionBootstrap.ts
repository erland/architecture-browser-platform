import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!options.workspaceId || !options.snapshot) {
        if (!cancelled) {
          setStatus('idle');
          setMessage(null);
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
          currentState: browserSession.state,
          openSnapshotSession: browserSession.openSnapshotSession,
        });
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
  }, [browserSession.openSnapshotSession, browserSession.state, options.repositoryId, options.snapshot, options.workspaceId]);

  return {
    status,
    message,
    isReady: status === 'ready',
  };
}
