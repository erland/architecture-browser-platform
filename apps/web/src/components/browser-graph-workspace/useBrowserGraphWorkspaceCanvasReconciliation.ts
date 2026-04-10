import { useEffect, useRef } from 'react';
import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserSessionState } from '../../browser-session/types';
import { logRenderedBrowserLayoutDiagnostics, reconcileRenderedBrowserNodeClearance } from './browserLayoutDiagnostics';

type Args = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onReconcileCanvasNodePositions: (updates: Array<{ kind: 'scope' | 'entity'; id: string; x?: number; y?: number }>) => void;
};

export function useBrowserGraphWorkspaceCanvasReconciliation({
  model,
  state,
  viewportRef,
  onReconcileCanvasNodePositions,
}: Args) {
  const lastReconciledRef = useRef<string | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || model.nodes.length === 0) {
      return;
    }
    const surface = viewport.querySelector<HTMLElement>('.browser-canvas__surface');
    if (!surface) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      logRenderedBrowserLayoutDiagnostics(surface, model.nodes, state);
      const updates = reconcileRenderedBrowserNodeClearance(surface, model.nodes, state);
      const signature = updates.map((update) => `${update.kind}:${update.id}:${String(update.x ?? '')}:${String(update.y ?? '')}`).join('|');
      if (updates.length === 0) {
        lastReconciledRef.current = null;
        return;
      }
      if (lastReconciledRef.current === signature) {
        return;
      }
      lastReconciledRef.current = signature;
      onReconcileCanvasNodePositions(updates);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [model.nodes, onReconcileCanvasNodePositions, state, viewportRef]);
}
