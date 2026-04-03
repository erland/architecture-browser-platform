import { useEffect, useRef } from 'react';
import { computeFitViewCanvasViewport } from '../../browser-graph/workspace';

type UseBrowserGraphWorkspaceFitViewArgs = {
  fitViewRequestedAt?: string | null;
  modelSize: { width: number; height: number; nodeCount: number };
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
};

export function useBrowserGraphWorkspaceFitView({
  fitViewRequestedAt,
  modelSize,
  viewportRef,
  onSetCanvasViewport,
}: UseBrowserGraphWorkspaceFitViewArgs): void {
  const handledFitViewRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fitViewRequestedAt || modelSize.nodeCount === 0) {
      return;
    }
    if (handledFitViewRequestRef.current === fitViewRequestedAt) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    handledFitViewRequestRef.current = fitViewRequestedAt;
    onSetCanvasViewport(computeFitViewCanvasViewport({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    }, {
      width: modelSize.width,
      height: modelSize.height,
    }));
  }, [fitViewRequestedAt, modelSize.height, modelSize.nodeCount, modelSize.width, onSetCanvasViewport, viewportRef]);
}
