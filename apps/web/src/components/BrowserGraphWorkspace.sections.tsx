import { useEffect, useRef } from 'react';
import type { FullSnapshotEntity } from '../appModel';
import type { BrowserGraphWorkspaceModel } from '../browserGraphWorkspaceModel';
import type { BrowserSessionState } from '../browserSessionStore';
import type { BrowserAutoLayoutMode } from '../browser-auto-layout';
import type { BrowserEntitySelectionAction, ScopeAnalysisMode, ViewportEventHandlers } from './BrowserGraphWorkspace.types';
import { BrowserGraphWorkspaceEdgeLayer } from './BrowserGraphWorkspaceEdgeLayer';
import { closeOpenMenus } from './BrowserGraphWorkspaceMenu';
import { BrowserGraphWorkspaceNodeLayer } from './BrowserGraphWorkspaceNodeLayer';
import { BrowserGraphWorkspaceToolbarHeader } from './BrowserGraphWorkspaceToolbarHeader';
import { BrowserGraphWorkspaceToolbarMenus } from './BrowserGraphWorkspaceToolbarMenus';

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
  focusedEntity: FullSnapshotEntity | null;
  viewportHandlers: ViewportEventHandlers;
  suppressClickRef: React.MutableRefObject<boolean>;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onFocusRelationship: (relationshipId: string) => void;
  onFocusScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onSelectEntity: (entityId: string, additive?: boolean) => void;
};

export function BrowserGraphWorkspaceCanvas({
  model,
  state,
  viewportHandlers,
  suppressClickRef,
  viewportRef,
  onFocusRelationship,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
}: CanvasProps) {
  if (model.nodes.length === 0) {
    return (
      <div className="browser-canvas__empty">
        <h4>Start with a scope or entity</h4>
        <p className="muted">Use the left tree, facts panel, search results, or the toolbar above to add entities first. Scope containers remain available only under advanced scope actions.</p>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={[
        'browser-canvas__viewport',
        viewportHandlers.isPanning ? 'browser-canvas__viewport--panning' : '',
      ].filter(Boolean).join(' ')}
      onMouseDown={viewportHandlers.beginViewportPan}
      onWheel={viewportHandlers.handleViewportWheel}
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
        <svg className="browser-canvas__edges" width={model.width} height={model.height} viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden="true">
          <defs>
            <marker id="browser-canvas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" className="browser-canvas__arrow" />
            </marker>
          </defs>
          <g key={model.routingRevision} data-routing-revision={model.routingRevision}>
            <BrowserGraphWorkspaceEdgeLayer
              edges={model.edges}
              onFocusRelationship={onFocusRelationship}
            />
          </g>
        </svg>

        <BrowserGraphWorkspaceNodeLayer
          nodes={model.nodes}
          suppressClickRef={suppressClickRef}
          beginNodeDrag={viewportHandlers.beginNodeDrag}
          draggingNodeId={viewportHandlers.draggingNodeId}
          onFocusScope={onFocusScope}
          onFocusEntity={onFocusEntity}
          onSelectEntity={onSelectEntity}
        />
      </div>
    </div>
  );
}
