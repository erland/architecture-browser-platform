import { useRef } from 'react';
import type { BrowserSessionState } from '../../browser-session';
import type { ViewportEventHandlers } from './BrowserGraphWorkspace.types';
import { useBrowserGraphWorkspaceFitView } from './useBrowserGraphWorkspaceFitView';
import { useBrowserGraphWorkspaceNodeDrag } from './useBrowserGraphWorkspaceNodeDrag';
import { useBrowserGraphWorkspaceViewport } from './useBrowserGraphWorkspaceViewport';

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
  const suppressClickRef = useRef(false);
  const { beginNodeDrag, draggingNodeId } = useBrowserGraphWorkspaceNodeDrag({
    zoom: state.canvasViewport.zoom,
    canvasNodes: state.canvasNodes,
    selectedEntityIds: state.selectedEntityIds,
    onMoveCanvasNode,
    suppressClickRef,
  });
  const { viewportRef, beginViewportPan, handleViewportWheel, isPanning } = useBrowserGraphWorkspaceViewport({
    canvasViewport: state.canvasViewport,
    onSetCanvasViewport,
    suppressClickRef,
  });

  useBrowserGraphWorkspaceFitView({
    fitViewRequestedAt: state.fitViewRequestedAt,
    modelSize,
    viewportRef,
    onSetCanvasViewport,
  });

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
