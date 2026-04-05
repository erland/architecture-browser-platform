/**
 * Thin hook shell plus legacy compatibility export surface.
 *
 * Keep bootstrap policy, planning, acquisition, execution, and application logic
 * in the focused `useBrowserSessionBootstrap.*` modules rather than re-growing
 * this file.
 */
import { useEffect, useRef, useState } from 'react';
import { useBrowserSession } from '../contexts/BrowserSessionContext';
import { orchestrateBrowserSessionBootstrap } from './useBrowserSessionBootstrap.orchestration';
import type { BrowserSessionBootstrapStatus } from './useBrowserSessionBootstrap.types';

export { bootstrapPreparedBrowserSession } from './useBrowserSessionBootstrap.bootstrapPrepared';

export function useBrowserSessionBootstrap(options: {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: import('../app-model').SnapshotSummary | null;
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
  const completedBootstrapKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void orchestrateBrowserSessionBootstrap({
      workspaceId: options.workspaceId,
      repositoryId: options.repositoryId,
      snapshot: options.snapshot,
      currentState: currentStateRef.current,
      activeSnapshotId,
      hasIndex,
      hasPayload,
      completedBootstrapKey: completedBootstrapKeyRef.current,
      openSnapshotSession: openSnapshotSessionRef.current,
      replaceState: replaceStateRef.current,
      applyRenderState: (nextStatus, nextMessage) => {
        if (cancelled) {
          return;
        }
        setStatus(nextStatus);
        setMessage(nextMessage);
      },
      updateCompletedBootstrapKey: (nextCompletedBootstrapKey) => {
        completedBootstrapKeyRef.current = nextCompletedBootstrapKey;
      },
    });

    return () => {
      cancelled = true;
    };
  }, [activeSnapshotId, hasIndex, hasPayload, options.repositoryId, options.workspaceId, snapshotId, snapshotKey]);

  return {
    status,
    message,
    isReady: status === 'ready',
  };
}
