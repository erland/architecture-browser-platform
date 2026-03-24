import { useEffect, useRef } from 'react';
import type { BrowserWorkspaceNodeModel } from '../browserGraphWorkspaceModel';
import {
  computeDraggedCanvasNodePosition,
  computeFitViewCanvasViewport,
  computePannedCanvasViewport,
  computeZoomedCanvasViewportAroundPointer,
} from '../browserCanvasViewport';
import type { BrowserSessionState } from '../browserSessionStore';
import type { DragState, PanState, ViewportEventHandlers } from './BrowserGraphWorkspace.types';

type UseBrowserGraphWorkspaceInteractionsArgs = {
  state: BrowserSessionState;
  modelSize: { width: number; height: number; nodeCount: number };
  onMoveCanvasNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
};

type UseBrowserGraphWorkspaceInteractionsResult = ViewportEventHandlers & {
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  suppressClickRef: React.MutableRefObject<boolean>;
};

export function useBrowserGraphWorkspaceInteractions({
  state,
  modelSize,
  onMoveCanvasNode,
  onSetCanvasViewport,
}: UseBrowserGraphWorkspaceInteractionsArgs): UseBrowserGraphWorkspaceInteractionsResult {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const dragDistanceRef = useRef(0);
  const panDistanceRef = useRef(0);
  const suppressClickRef = useRef(false);
  const handledFitViewRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state.fitViewRequestedAt || modelSize.nodeCount === 0) {
      return;
    }
    if (handledFitViewRequestRef.current === state.fitViewRequestedAt) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    handledFitViewRequestRef.current = state.fitViewRequestedAt;
    onSetCanvasViewport(computeFitViewCanvasViewport({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    }, {
      width: modelSize.width,
      height: modelSize.height,
    }));
  }, [modelSize.height, modelSize.nodeCount, modelSize.width, onSetCanvasViewport, state.fitViewRequestedAt]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (dragState) {
        event.preventDefault();
        const deltaX = event.clientX - dragState.startClientX;
        const deltaY = event.clientY - dragState.startClientY;
        const nextPosition = computeDraggedCanvasNodePosition({
          x: dragState.startX,
          y: dragState.startY,
        }, {
          x: deltaX,
          y: deltaY,
        }, state.canvasViewport.zoom);
        dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(nextPosition.x - dragState.startX), Math.abs(nextPosition.y - dragState.startY));
        suppressClickRef.current = dragDistanceRef.current > 4;
        onMoveCanvasNode(dragState.node, nextPosition);
        return;
      }
      const panState = panStateRef.current;
      if (!panState) {
        return;
      }
      event.preventDefault();
      const deltaX = event.clientX - panState.startClientX;
      const deltaY = event.clientY - panState.startClientY;
      panDistanceRef.current = Math.max(panDistanceRef.current, Math.abs(deltaX), Math.abs(deltaY));
      onSetCanvasViewport(computePannedCanvasViewport({
        zoom: state.canvasViewport.zoom,
        offsetX: panState.startOffsetX,
        offsetY: panState.startOffsetY,
      }, {
        x: deltaX,
        y: deltaY,
      }));
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      panStateRef.current = null;
      dragDistanceRef.current = 0;
      panDistanceRef.current = 0;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    if (typeof window === 'undefined') {
      return;
    }

    if (dragStateRef.current || panStateRef.current) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMoveCanvasNode, onSetCanvasViewport, state.canvasViewport.zoom]);

  const beginNodeDrag = (event: React.MouseEvent<HTMLElement>, node: BrowserWorkspaceNodeModel) => {
    if (event.button !== 0) {
      return;
    }
    dragStateRef.current = {
      node: { kind: node.kind === 'scope' ? 'scope' : 'entity', id: node.id },
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
    };
    dragDistanceRef.current = 0;
    suppressClickRef.current = false;
  };

  const beginViewportPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }
    panStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: state.canvasViewport.offsetX,
      startOffsetY: state.canvasViewport.offsetY,
    };
    panDistanceRef.current = 0;
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    onSetCanvasViewport(computeZoomedCanvasViewportAroundPointer(state.canvasViewport, {
      x: pointerX,
      y: pointerY,
    }, event.deltaY));
  };

  return {
    viewportRef,
    suppressClickRef,
    beginNodeDrag,
    beginViewportPan,
    handleViewportWheel,
  };
}
