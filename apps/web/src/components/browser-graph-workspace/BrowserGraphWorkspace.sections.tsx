import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { FullSnapshotEntity } from '../../app-model';
import type { BrowserGraphWorkspaceModel } from '../../browser-graph/workspace';
import type { BrowserSessionState } from '../../browser-session';
import type { BrowserAutoLayoutMode } from '../../browser-auto-layout';
import type {
  BrowserEntitySelectionAction,
  BrowserGraphWorkspaceInteractionHandlers,
  ScopeAnalysisMode,
  ViewportEventHandlers,
} from './BrowserGraphWorkspace.types';
import { BrowserGraphWorkspaceEdgeLayer } from './BrowserGraphWorkspaceEdgeLayer';
import { closeOpenMenus } from './BrowserGraphWorkspaceMenu';
import { BrowserGraphWorkspaceNodeLayer } from './BrowserGraphWorkspaceNodeLayer';
import { BrowserGraphWorkspaceToolbarHeader } from './BrowserGraphWorkspaceToolbarHeader';
import { BrowserGraphWorkspaceToolbarMenus } from './BrowserGraphWorkspaceToolbarMenus';
import { useBrowserGraphWorkspaceCanvasReconciliation } from './useBrowserGraphWorkspaceCanvasReconciliation';

export { resolveRenderedEdgeGeometry, buildSvgPolylinePath, buildFallbackEdgePath } from './BrowserGraphWorkspace.edgeGeometry';

type ToolbarProps = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  activeModeLabel: string;
  scopeActionScopeId: string | null;
  scopePrimaryEntityCount: number;
  scopeDirectEntityCount: number;
  scopeSubtreeEntityCount: number;
  selectedEntityCount: number;
  pinnedNodeCount: number;
  focusedEntity: FullSnapshotEntity | null;
  focusedScopeId: string | null;
  entityActions: BrowserEntitySelectionAction[];
  scopeChildCount: number;
  onAddScopeAnalysis: (scopeId: string, mode: ScopeAnalysisMode, kinds?: string[], childScopeKinds?: string[]) => void;
  onIsolateSelection: () => void;
  onRemoveSelection: () => void;
  onArrangeAllCanvasNodes: () => void;
  onArrangeCanvasWithMode: (mode: BrowserAutoLayoutMode) => void;
  onArrangeCanvasAroundFocus: () => void;
  onFitView: () => void;
  onClearCanvas: () => void;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
  onShowScopeContainer: (scopeId?: string) => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onEntityAction: (actionKey: string) => void;
};

export function BrowserGraphWorkspaceToolbar(props: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const toolbar = toolbarRef.current;
      if (!toolbar || toolbar.contains(event.target as Node | null)) {
        return;
      }
      closeOpenMenus(toolbar);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <>
      <BrowserGraphWorkspaceToolbarHeader
        model={props.model}
        activeModeLabel={props.activeModeLabel}
        selectedEntityCount={props.selectedEntityCount}
        pinnedNodeCount={props.pinnedNodeCount}
      />
      <div ref={toolbarRef} className="browser-canvas__toolbar browser-canvas__toolbar--compact">
        <BrowserGraphWorkspaceToolbarMenus {...props} />
      </div>
    </>
  );
}

type CanvasProps = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  viewportHandlers: ViewportEventHandlers;
  suppressClickRef: React.MutableRefObject<boolean>;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  interactionHandlers: BrowserGraphWorkspaceInteractionHandlers;
  onReconcileCanvasNodePositions: (updates: Array<{ kind: 'scope' | 'entity'; id: string; x?: number; y?: number }>) => void;
  onReceiveTreeEntitiesDrop?: (entityIds: string[]) => void;
};

export function BrowserGraphWorkspaceCanvas({
  model,
  state,
  viewportHandlers,
  suppressClickRef,
  viewportRef,
  interactionHandlers,
  onReconcileCanvasNodePositions,
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
    >
      <BrowserGraphWorkspaceLayers
        model={model}
        suppressClickRef={suppressClickRef}
        viewportHandlers={viewportHandlers}
        interactionHandlers={interactionHandlers}
      />
    </BrowserGraphWorkspaceViewport>
  );
}

function BrowserGraphWorkspaceEmptyState() {
  return (
    <div className="browser-canvas__empty">
      <h4>Start with a scope or entity</h4>
      <p className="muted">Use the left tree, facts panel, search results, or the toolbar above to add entities first. Scope containers remain available only under advanced scope actions.</p>
    </div>
  );
}

type ViewportProps = {
  model: BrowserGraphWorkspaceModel;
  state: BrowserSessionState;
  viewportHandlers: ViewportEventHandlers;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onReceiveTreeEntitiesDrop?: (entityIds: string[]) => void;
  children: ReactNode;
};

const TREE_DRAG_MIME_TYPE = 'application/x-architecture-browser-entities';

function BrowserGraphWorkspaceViewport({ model, state, viewportHandlers, viewportRef, onReceiveTreeEntitiesDrop, children }: ViewportProps) {
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

type LayersProps = {
  model: BrowserGraphWorkspaceModel;
  suppressClickRef: React.MutableRefObject<boolean>;
  viewportHandlers: ViewportEventHandlers;
  interactionHandlers: BrowserGraphWorkspaceInteractionHandlers;
};

function BrowserGraphWorkspaceLayers({ model, suppressClickRef, viewportHandlers, interactionHandlers }: LayersProps) {
  return (
    <>
      <svg className="browser-canvas__edges" width={model.width} height={model.height} viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden="true">
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
