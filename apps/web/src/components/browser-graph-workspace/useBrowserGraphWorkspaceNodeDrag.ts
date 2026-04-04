import { useEffect, useRef, useState } from 'react';
import { computeDraggedCanvasNodePosition } from '../../browser-graph/workspace';
import type { BrowserWorkspaceNodeModel } from '../../browser-graph/workspace';
import type { DragState, DragStateNode } from './BrowserGraphWorkspace.types';
import { hasExceededDragThreshold, isPrimaryPointerButton } from './browserGraphWorkspaceInteractionPolicy';

type UseBrowserGraphWorkspaceNodeDragArgs = {
  zoom: number;
  canvasNodes: Array<{ kind: 'scope' | 'entity'; id: string; x: number; y: number }>;
  selectedEntityIds: string[];
  onMoveCanvasNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
};

type UseBrowserGraphWorkspaceNodeDragResult = {
  beginNodeDrag: (event: React.MouseEvent<HTMLElement>, node: BrowserWorkspaceNodeModel) => void;
  draggingNodeId: string | null;
};

export function useBrowserGraphWorkspaceNodeDrag({
  zoom,
  canvasNodes,
  selectedEntityIds,
  onMoveCanvasNode,
  suppressClickRef,
}: UseBrowserGraphWorkspaceNodeDragArgs): UseBrowserGraphWorkspaceNodeDragResult {
  const dragStateRef = useRef<DragState | null>(null);
  const onMoveCanvasNodeRef = useRef(onMoveCanvasNode);
  const latestZoomRef = useRef(zoom);
  const latestCanvasNodesRef = useRef(canvasNodes);
  const latestSelectedEntityIdsRef = useRef(selectedEntityIds);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    onMoveCanvasNodeRef.current = onMoveCanvasNode;
    latestZoomRef.current = zoom;
    latestCanvasNodesRef.current = canvasNodes;
    latestSelectedEntityIdsRef.current = selectedEntityIds;
  }, [canvasNodes, onMoveCanvasNode, selectedEntityIds, zoom]);

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
      const pointerDelta = {
        x: event.clientX - dragState.startClientX,
        y: event.clientY - dragState.startClientY,
      };
      suppressClickRef.current = true;
      for (const draggedNode of dragState.nodes) {
        const nextPosition = computeDraggedCanvasNodePosition({
          x: draggedNode.startX,
          y: draggedNode.startY,
        }, pointerDelta, latestZoomRef.current);
        onMoveCanvasNodeRef.current(draggedNode.node, nextPosition);
      }
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
    const dragNode: DragStateNode['node'] = { kind: node.kind === 'scope' ? 'scope' : 'entity', id: node.id };
    const selectedEntityIdsSet = new Set(latestSelectedEntityIdsRef.current);
    const groupNodes: DragStateNode[] = dragNode.kind === 'entity' && selectedEntityIdsSet.has(dragNode.id)
      ? latestCanvasNodesRef.current
        .filter((canvasNode) => canvasNode.kind === 'entity' && selectedEntityIdsSet.has(canvasNode.id))
        .map((canvasNode) => ({
          node: { kind: 'entity' as const, id: canvasNode.id },
          startX: canvasNode.x,
          startY: canvasNode.y,
        }))
      : [];
    const draggedNodes: DragStateNode[] = groupNodes.length > 1
      ? groupNodes
      : [{
          node: dragNode,
          startX: node.x,
          startY: node.y,
        }];
    dragStateRef.current = {
      node: dragNode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
      nodes: draggedNodes,
    };
    suppressClickRef.current = false;
  };

  return {
    beginNodeDrag,
    draggingNodeId,
  };
}
