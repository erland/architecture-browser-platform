import type { ReactNode } from 'react';
import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserSessionState } from '../../browser-session/types';
import type { ViewportEventHandlers } from './BrowserGraphWorkspace.types';

export const TREE_DRAG_MIME_TYPE = 'application/x-architecture-browser-entities';

type ViewportProps = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  viewportHandlers: ViewportEventHandlers;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onReceiveTreeEntitiesDrop?: (entityIds: string[]) => void;
  onClearSelection?: () => void;
  children: ReactNode;
};

export function BrowserGraphWorkspaceViewport({ model, state, viewportHandlers, viewportRef, onReceiveTreeEntitiesDrop, onClearSelection, children }: ViewportProps) {
  return (
    <div
      ref={viewportRef}
      className={[
        'browser-canvas__viewport',
        viewportHandlers.isPanning ? 'browser-canvas__viewport--panning' : '',
      ].filter(Boolean).join(' ')}
      onMouseDown={viewportHandlers.beginViewportPan}
      onWheel={viewportHandlers.handleViewportWheel}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(TREE_DRAG_MIME_TYPE)) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (viewportHandlers.isPanning || viewportHandlers.draggingNodeId) {
          return;
        }
        onClearSelection?.();
      }}
      onDrop={(event) => {
        const payload = event.dataTransfer.getData(TREE_DRAG_MIME_TYPE);
        if (!payload || !onReceiveTreeEntitiesDrop) {
          return;
        }
        try {
          const parsed = JSON.parse(payload) as { entityIds?: string[] };
          const entityIds = Array.isArray(parsed.entityIds) ? parsed.entityIds.filter((entityId): entityId is string => typeof entityId === 'string') : [];
          if (entityIds.length === 0) {
            return;
          }
          event.preventDefault();
          onReceiveTreeEntitiesDrop(entityIds);
        } catch {
          // Ignore malformed drag payloads.
        }
      }}
    >
      <div
        className="browser-canvas__surface"
        onClick={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          if (viewportHandlers.isPanning || viewportHandlers.draggingNodeId) {
            return;
          }
          onClearSelection?.();
        }}
        style={{
          width: model.width,
          height: model.height,
          transform: `translate(${state.canvasViewport.offsetX}px, ${state.canvasViewport.offsetY}px) scale(${state.canvasViewport.zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
