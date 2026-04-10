import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserGraphWorkspaceInteractionHandlers, ViewportEventHandlers } from './BrowserGraphWorkspace.types';
import { BrowserGraphWorkspaceEdgeLayer } from './BrowserGraphWorkspaceEdgeLayer';
import { BrowserGraphWorkspaceNodeLayer } from './BrowserGraphWorkspaceNodeLayer';

type LayersProps = {
  model: BrowserGraphWorkspaceModel;
  suppressClickRef: React.MutableRefObject<boolean>;
  viewportHandlers: ViewportEventHandlers;
  interactionHandlers: BrowserGraphWorkspaceInteractionHandlers;
  onClearSelection?: () => void;
};

export function BrowserGraphWorkspaceLayers({ model, suppressClickRef, viewportHandlers, interactionHandlers, onClearSelection }: LayersProps) {
  return (
    <>
      <svg
        className="browser-canvas__edges"
        width={model.width}
        height={model.height}
        viewBox={`0 0 ${model.width} ${model.height}`}
        aria-hidden="true"
        onClick={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          if (viewportHandlers.isPanning || viewportHandlers.draggingNodeId) {
            return;
          }
          onClearSelection?.();
        }}
      >
        <defs>
          <marker id="browser-canvas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="browser-canvas__arrow" />
          </marker>
        </defs>
        <g key={model.routingRevision} data-routing-revision={model.routingRevision}>
          <BrowserGraphWorkspaceEdgeLayer
            edges={model.edges}
            onActivateRelationship={interactionHandlers.onActivateRelationship}
          />
        </g>
      </svg>

      <BrowserGraphWorkspaceNodeLayer
        nodes={model.nodes}
        suppressClickRef={suppressClickRef}
        beginNodeDrag={viewportHandlers.beginNodeDrag}
        draggingNodeId={viewportHandlers.draggingNodeId}
        interactionHandlers={interactionHandlers}
      />
    </>
  );
}
