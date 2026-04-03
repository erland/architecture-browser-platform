import { useEffect, useRef, useState } from 'react';
import { computeDraggedCanvasNodePosition } from '../../browser-graph/workspace';
import type { BrowserWorkspaceNodeModel } from '../../browser-graph/workspace';
import type { DragState } from './BrowserGraphWorkspace.types';
import { hasExceededDragThreshold, isPrimaryPointerButton } from './browserGraphWorkspaceInteractionPolicy';

type UseBrowserGraphWorkspaceNodeDragArgs = {
  zoom: number;
  onMoveCanvasNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
};

type UseBrowserGraphWorkspaceNodeDragResult = {
  beginNodeDrag: (event: React.MouseEvent<HTMLElement>, node: BrowserWorkspaceNodeModel) => void;
  draggingNodeId: string | null;
};

export function useBrowserGraphWorkspaceNodeDrag({
  zoom,
  onMoveCanvasNode,
  suppressClickRef,
}: UseBrowserGraphWorkspaceNodeDragArgs): UseBrowserGraphWorkspaceNodeDragResult {
  const dragStateRef = useRef<DragState | null>(null);
  const onMoveCanvasNodeRef = useRef(onMoveCanvasNode);
  const latestZoomRef = useRef(zoom);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    onMoveCanvasNodeRef.current = onMoveCanvasNode;
    latestZoomRef.current = zoom;
  }, [onMoveCanvasNode, zoom]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || !hasExceededDragThreshold(dragState, event.clientX, event.clientY)) {
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
        x: event.clientX - dragState.startClientX,
        y: event.clientY - dragState.startClientY,
      }, latestZoomRef.current);
      suppressClickRef.current = true;
      onMoveCanvasNodeRef.current(dragState.node, nextPosition);
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      setDraggingNodeId(null);
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
  }, [draggingNodeId, suppressClickRef]);

  const beginNodeDrag = (event: React.MouseEvent<HTMLElement>, node: BrowserWorkspaceNodeModel) => {
    if (!isPrimaryPointerButton(event.button)) {
      return;
    }
    dragStateRef.current = {
      node: { kind: node.kind === 'scope' ? 'scope' : 'entity', id: node.id },
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
    };
    suppressClickRef.current = false;
  };

  return {
    beginNodeDrag,
    draggingNodeId,
  };
}
