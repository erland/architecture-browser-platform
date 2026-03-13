import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { getOrBuildBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { platformApi } from '../platformApi';
import { getBrowserSnapshotCache } from '../snapshotCache';

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

export type BrowserSnapshotPreparationStatus =
  | 'idle'
  | 'not-downloaded'
  | 'downloading'
  | 'cached'
  | 'preparing'
  | 'ready'
  | 'failed';

export type BrowserSnapshotPreparationResult = {
  status: BrowserSnapshotPreparationStatus;
  message: string | null;
  prepareSnapshot: (options?: { forceRefresh?: boolean }) => Promise<boolean>;
  isReady: boolean;
  canOpenBrowser: boolean;
};

type UseBrowserSnapshotPreparationOptions = {
  workspaceId: string | null;
  snapshot: SnapshotSummary | null;
  autoPrepare?: boolean;
};

export function useBrowserSnapshotPreparation({
  workspaceId,
  snapshot,
  autoPrepare = true,
}: UseBrowserSnapshotPreparationOptions): BrowserSnapshotPreparationResult {
  const [status, setStatus] = useState<BrowserSnapshotPreparationStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const prepareSnapshot = useCallback(async (options?: { forceRefresh?: boolean }) => {
    if (!workspaceId || !snapshot) {
      setStatus('idle');
      setMessage(null);
      return false;
    }

    const sequence = ++requestSequence.current;
    const updateState = (nextStatus: BrowserSnapshotPreparationStatus, nextMessage: string | null) => {
      if (sequence !== requestSequence.current) {
        return;
      }
      setStatus(nextStatus);
      setMessage(nextMessage);
    };

    const cache = getBrowserSnapshotCache();
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      const cachedRecord = await cache.getSnapshot(snapshot.id);
      const isCurrent = !forceRefresh && cache.isSnapshotCurrent(snapshot, cachedRecord);

      if (isCurrent && cachedRecord) {
        updateState('cached', `Snapshot ${snapshot.snapshotKey} is cached locally. Preparing Browser indexes…`);
        updateState('preparing', `Snapshot ${snapshot.snapshotKey} is cached locally. Preparing Browser indexes…`);
        getOrBuildBrowserSnapshotIndex(cachedRecord.payload);
        updateState('ready', `Snapshot ${snapshot.snapshotKey} is ready to open in Browser.`);
        return true;
      }

      updateState(
        cachedRecord ? 'downloading' : 'not-downloaded',
        cachedRecord
          ? `Refreshing local Browser data for snapshot ${snapshot.snapshotKey}…`
          : `Downloading snapshot ${snapshot.snapshotKey} for local Browser use…`,
      );

      updateState('downloading', cachedRecord
        ? `Refreshing local Browser data for snapshot ${snapshot.snapshotKey}…`
        : `Downloading snapshot ${snapshot.snapshotKey} for local Browser use…`);
      const payload = await platformApi.getFullSnapshotPayload<FullSnapshotPayload>(workspaceId, snapshot.id);
      const stored = await cache.putSnapshot({
        workspaceId,
        repositoryId: snapshot.repositoryRegistrationId,
        snapshotKey: snapshot.snapshotKey,
        cacheVersion: cache.buildCacheVersion(snapshot),
        payload,
      });

      updateState('cached', `Snapshot ${snapshot.snapshotKey} is cached locally. Preparing Browser indexes…`);
      updateState('preparing', `Snapshot ${snapshot.snapshotKey} is cached locally. Preparing Browser indexes…`);
      getOrBuildBrowserSnapshotIndex(stored.payload);
      updateState('ready', `Snapshot ${snapshot.snapshotKey} is ready to open in Browser.`);
      return true;
    } catch (caught) {
      updateState('failed', `Browser preparation failed: ${toErrorMessage(caught)}`);
      return false;
    }
  }, [snapshot, workspaceId]);

  useEffect(() => {
    let cancelled = false;

    async function inspectSelection() {
      if (!workspaceId || !snapshot) {
        if (!cancelled) {
          setStatus('idle');
          setMessage(null);
        }
        return;
      }

      try {
        const cache = getBrowserSnapshotCache();
        const cachedRecord = await cache.getSnapshot(snapshot.id);
        const isCurrent = cache.isSnapshotCurrent(snapshot, cachedRecord);
        if (cancelled) {
          return;
        }

        if (!cachedRecord || !isCurrent) {
          setStatus('not-downloaded');
          setMessage(`Snapshot ${snapshot.snapshotKey} has not been prepared for Browser yet.`);
          if (autoPrepare) {
            void prepareSnapshot();
          }
          return;
        }

        setStatus('cached');
        setMessage(`Snapshot ${snapshot.snapshotKey} is cached locally and ready for Browser preparation.`);
        if (autoPrepare) {
          void prepareSnapshot();
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus('failed');
          setMessage(`Browser preparation failed: ${toErrorMessage(caught)}`);
        }
      }
    }

    void inspectSelection();

    return () => {
      cancelled = true;
    };
  }, [autoPrepare, prepareSnapshot, snapshot, workspaceId]);

  return useMemo(() => ({
    status,
    message,
    prepareSnapshot,
    isReady: status === 'ready',
    canOpenBrowser: status === 'ready' || status === 'cached',
  }), [message, prepareSnapshot, status]);
}
