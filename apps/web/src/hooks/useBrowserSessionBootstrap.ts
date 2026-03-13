import { useEffect, useState } from 'react';
import type { SnapshotSummary } from '../appModel';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
import { getBrowserSnapshotCache } from '../snapshotCache';

export type BrowserSessionBootstrapStatus = 'idle' | 'loading' | 'ready' | 'failed';

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

export function useBrowserSessionBootstrap(options: {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
}) {
  const { state, openSnapshotSession } = useBrowserSession();
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

      const alreadyOpen = state.activeSnapshot?.snapshotId === options.snapshot.id && state.index && state.payload;
      if (alreadyOpen) {
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
        const cache = getBrowserSnapshotCache();
        const cachedRecord = await cache.getSnapshot(options.snapshot.id);
        if (!cachedRecord || !cache.isSnapshotCurrent(options.snapshot, cachedRecord)) {
          if (!cancelled) {
            setStatus('failed');
            setMessage(`Snapshot ${options.snapshot.snapshotKey} is not prepared locally yet. Return to Snapshots and prepare Browser data first.`);
          }
          return;
        }

        if (!cancelled) {
          openSnapshotSession({
            workspaceId: options.workspaceId,
            repositoryId: options.repositoryId,
            payload: cachedRecord.payload,
            preparedAt: cachedRecord.cachedAt,
            keepViewState: state.activeSnapshot?.snapshotId === options.snapshot.id,
          });
          setStatus('ready');
          setMessage(`Browser session ready for snapshot ${options.snapshot.snapshotKey}.`);
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
  }, [openSnapshotSession, options.repositoryId, options.snapshot, options.workspaceId, state.activeSnapshot?.snapshotId, state.index, state.payload]);

  return {
    status,
    message,
    isReady: status === 'ready',
  };
}
