import type { BrowserSessionState } from '../../browser-session/types';
import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserGraphWorkspaceInteractionHandlers, ViewportEventHandlers } from './BrowserGraphWorkspace.types';
import { BrowserGraphWorkspaceEmptyState } from './BrowserGraphWorkspace.emptyState';
import { BrowserGraphWorkspaceLayers } from './BrowserGraphWorkspace.layers';
import type { BrowserGraphWorkspaceToolbarProps } from './BrowserGraphWorkspace.toolbar';
import { BrowserGraphWorkspaceViewport } from './BrowserGraphWorkspace.viewport';
import { useBrowserGraphWorkspaceCanvasReconciliation } from './useBrowserGraphWorkspaceCanvasReconciliation';

export { resolveRenderedEdgeGeometry, buildSvgPolylinePath, buildFallbackEdgePath } from './BrowserGraphWorkspace.edgeGeometry';
export { BrowserGraphWorkspaceToolbar } from './BrowserGraphWorkspace.toolbar';

type CanvasProps = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  viewportHandlers: ViewportEventHandlers;
  suppressClickRef: React.MutableRefObject<boolean>;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  interactionHandlers: BrowserGraphWorkspaceInteractionHandlers;
  onReconcileCanvasNodePositions: (updates: Array<{ kind: 'scope' | 'entity'; id: string; x?: number; y?: number }>) => void;
  onClearSelection?: () => void;
  onReceiveTreeEntitiesDrop?: (entityIds: string[]) => void;
};

export type { BrowserGraphWorkspaceToolbarProps };

export function BrowserGraphWorkspaceCanvas({
  model,
  state,
  viewportHandlers,
  suppressClickRef,
  viewportRef,
  interactionHandlers,
  onReconcileCanvasNodePositions,
  onClearSelection,
  onReceiveTreeEntitiesDrop,
}: CanvasProps) {
  useBrowserGraphWorkspaceCanvasReconciliation({
    model,
    state,
    viewportRef,
    onReconcileCanvasNodePositions,
  });

  if (model.nodes.length === 0) {
    return <BrowserGraphWorkspaceEmptyState />;
  }

  return (
    <BrowserGraphWorkspaceViewport
      model={model}
      state={state}
      viewportHandlers={viewportHandlers}
      viewportRef={viewportRef}
      onReceiveTreeEntitiesDrop={onReceiveTreeEntitiesDrop}
      onClearSelection={onClearSelection}
    >
      <BrowserGraphWorkspaceLayers
        model={model}
        suppressClickRef={suppressClickRef}
        viewportHandlers={viewportHandlers}
        interactionHandlers={interactionHandlers}
        onClearSelection={onClearSelection}
      />
    </BrowserGraphWorkspaceViewport>
  );
}
