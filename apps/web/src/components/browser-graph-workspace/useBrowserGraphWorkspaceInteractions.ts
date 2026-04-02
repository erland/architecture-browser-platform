import { useEffect, useRef, useState } from 'react';
import type { BrowserWorkspaceNodeModel } from '../../browser-graph';
import {
  computeDraggedCanvasNodePosition,
  computeFitViewCanvasViewport,
  computePannedCanvasViewport,
  computeZoomedCanvasViewportAroundPointer,
} from '../../browser-graph';
import type { BrowserSessionState } from '../../browser-session';
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

const DRAG_THRESHOLD_PX = 6;
const PAN_THRESHOLD_PX = 3;

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
  const latestZoomRef = useRef(state.canvasViewport.zoom);
  const latestViewportRef = useRef(state.canvasViewport);
  const onMoveCanvasNodeRef = useRef(onMoveCanvasNode);
  const onSetCanvasViewportRef = useRef(onSetCanvasViewport);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    latestZoomRef.current = state.canvasViewport.zoom;
    latestViewportRef.current = state.canvasViewport;
    onMoveCanvasNodeRef.current = onMoveCanvasNode;
    onSetCanvasViewportRef.current = onSetCanvasViewport;
  }, [onMoveCanvasNode, onSetCanvasViewport, state.canvasViewport]);

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
    if (typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (dragState) {
        const deltaX = event.clientX - dragState.startClientX;
        const deltaY = event.clientY - dragState.startClientY;
        const movedDistance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
        if (movedDistance <= DRAG_THRESHOLD_PX) {
          return;
        }
        event.preventDefault();
        if (draggingNodeId !== dragState.node.id) {
          setDraggingNodeId(dragState.node.id);
        }
        const nextPosition = computeDraggedCanvasNodePosition({
          x: dragState.startX,
          y: dragState.startY,
        }, {
          x: deltaX,
          y: deltaY,
        }, latestZoomRef.current);
        dragDistanceRef.current = Math.max(
          dragDistanceRef.current,
          Math.abs(nextPosition.x - dragState.startX),
          Math.abs(nextPosition.y - dragState.startY),
        );
        suppressClickRef.current = true;
        onMoveCanvasNodeRef.current(dragState.node, nextPosition);
        return;
      }

      const panState = panStateRef.current;
      if (!panState) {
        return;
      }
      event.preventDefault();
      const deltaX = event.clientX - panState.startClientX;
      const deltaY = event.clientY - panState.startClientY;
      const movedDistance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      if (movedDistance > PAN_THRESHOLD_PX) {
        setIsPanning(true);
      }
      panDistanceRef.current = Math.max(panDistanceRef.current, Math.abs(deltaX), Math.abs(deltaY));
      onSetCanvasViewportRef.current(computePannedCanvasViewport({
        zoom: latestViewportRef.current.zoom,
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
      setDraggingNodeId(null);
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
  }, [draggingNodeId]);

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
    if (event.button !== 0) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest('.browser-canvas__node, .browser-canvas__edge-hitbox')) {
      return;
    }
    panStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: latestViewportRef.current.offsetX,
      startOffsetY: latestViewportRef.current.offsetY,
    };
    panDistanceRef.current = 0;
    suppressClickRef.current = false;
    setIsPanning(false);
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      onSetCanvasViewport(computePannedCanvasViewport(latestViewportRef.current, {
        x: -event.deltaX,
        y: -event.deltaY,
      }));
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
    onSetCanvasViewport(computeZoomedCanvasViewportAroundPointer(latestViewportRef.current, {
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
    draggingNodeId,
    isPanning,
  };
}
