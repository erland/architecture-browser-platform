import { useEffect, useRef, useState } from 'react';
import { computePannedCanvasViewport, computeZoomedCanvasViewportAroundPointer } from '../../browser-graph/workspace';
import type { BrowserSessionState } from '../../browser-session/session-state-types';
import type { PanState } from './BrowserGraphWorkspace.types';
import { hasExceededPanThreshold, isPrimaryPointerButton, shouldIgnoreViewportPanTarget, shouldWheelPan } from './browserGraphWorkspaceInteractionPolicy';

type UseBrowserGraphWorkspaceViewportArgs = {
  canvasViewport: BrowserSessionState['canvasViewport'];
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
};

type UseBrowserGraphWorkspaceViewportResult = {
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  beginViewportPan: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleViewportWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  isPanning: boolean;
};

export function useBrowserGraphWorkspaceViewport({
  canvasViewport,
  onSetCanvasViewport,
  suppressClickRef,
}: UseBrowserGraphWorkspaceViewportArgs): UseBrowserGraphWorkspaceViewportResult {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const latestViewportRef = useRef(canvasViewport);
  const onSetCanvasViewportRef = useRef(onSetCanvasViewport);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    latestViewportRef.current = canvasViewport;
    onSetCanvasViewportRef.current = onSetCanvasViewport;
  }, [canvasViewport, onSetCanvasViewport]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const panState = panStateRef.current;
      if (!panState) {
        return;
      }
      event.preventDefault();
      if (hasExceededPanThreshold(panState, event.clientX, event.clientY)) {
        setIsPanning(true);
      }
      onSetCanvasViewportRef.current(computePannedCanvasViewport({
        zoom: latestViewportRef.current.zoom,
        offsetX: panState.startOffsetX,
        offsetY: panState.startOffsetY,
      }, {
        x: event.clientX - panState.startClientX,
        y: event.clientY - panState.startClientY,
      }));
    };

    const handleMouseUp = () => {
      panStateRef.current = null;
      setIsPanning(false);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [suppressClickRef]);

  const beginViewportPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPrimaryPointerButton(event.button) || shouldIgnoreViewportPanTarget(event.target)) {
      return;
    }
    panStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: latestViewportRef.current.offsetX,
      startOffsetY: latestViewportRef.current.offsetY,
    };
    suppressClickRef.current = false;
    setIsPanning(false);
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (shouldWheelPan(event)) {
      onSetCanvasViewport(computePannedCanvasViewport(latestViewportRef.current, {
        x: -event.deltaX,
        y: -event.deltaY,
      }));
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const rect = viewport.getBoundingClientRect();
    onSetCanvasViewport(computeZoomedCanvasViewportAroundPointer(latestViewportRef.current, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }, event.deltaY));
  };

  return {
    viewportRef,
    beginViewportPan,
    handleViewportWheel,
    isPanning,
  };
}
