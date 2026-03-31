import { useEffect, useRef } from 'react';
import type { FullSnapshotEntity } from '../appModel';
import type { BrowserWorkspaceEdgeModel, BrowserWorkspaceNodeModel, BrowserGraphWorkspaceModel } from '../browserGraphWorkspaceModel';
import type { BrowserSessionState } from '../browserSessionStore';
import { renderCompartmentSubtitle } from './BrowserGraphWorkspace.actions';
import type { BrowserEntitySelectionAction, ScopeAnalysisMode, ViewportEventHandlers } from './BrowserGraphWorkspace.types';
import type { BrowserAutoLayoutMode } from '../browser-auto-layout';



function closeOpenMenus(root: ParentNode | null) {
  if (!root) {
    return;
  }
  root.querySelectorAll('details[open]').forEach((element) => {
    if (element instanceof HTMLDetailsElement) {
      element.open = false;
    }
  });
}

function handleMenuSummaryClick(event: React.MouseEvent<HTMLElement>, enabled: boolean) {
  if (enabled) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
}

function closeContainingMenus(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return;
  }
  let current: HTMLElement | null = target;
  while (current) {
    const detailsElement: Element | null = current.closest('details');
    if (!(detailsElement instanceof HTMLDetailsElement)) {
      break;
    }
    detailsElement.open = false;
    current = detailsElement.parentElement;
  }
}

function runMenuAction(event: React.MouseEvent<HTMLButtonElement>, action: () => void) {
  action();
  closeContainingMenus(event.currentTarget);
}

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

export function BrowserGraphWorkspaceToolbar({
  model,
  state,
  activeModeLabel,
  scopeActionScopeId,
  scopePrimaryEntityCount,
  scopeDirectEntityCount,
  scopeSubtreeEntityCount,
  selectedEntityCount,
  pinnedNodeCount,
  focusedEntity,
  focusedScopeId,
  entityActions,
  scopeChildCount,
  onAddScopeAnalysis,
  onIsolateSelection,
  onRemoveSelection,
  onArrangeAllCanvasNodes,
  onArrangeCanvasWithMode,
  onArrangeCanvasAroundFocus,
  onFitView,
  onClearCanvas,
  onSetCanvasViewport,
  onShowScopeContainer,
  onTogglePinNode,
  onEntityAction,
}: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const hasFocusedEntity = Boolean(focusedEntity);
  const canAddPrimary = Boolean(scopeActionScopeId) && scopePrimaryEntityCount > 0;
  const canAddDirect = Boolean(scopeActionScopeId) && scopeDirectEntityCount > 0;
  const canAddSubtree = Boolean(scopeActionScopeId) && scopeSubtreeEntityCount > 0;
  const canOpenAddMenu = canAddPrimary || canAddDirect || canAddSubtree;
  const canArrangeAll = model.nodes.length > 0;
  const canArrangeAroundFocus = model.nodes.length > 0 && hasFocusedEntity;
  const canOpenArrangeMenu = canArrangeAll || canArrangeAroundFocus;
  const canIsolateOrRemove = selectedEntityCount > 0 || Boolean(focusedScopeId);
  const canOpenEntityAction = hasFocusedEntity && entityActions.some((action) => !action.disabled || action.key === 'pin');
  const canAddChildPrimary = Boolean(focusedScopeId) && scopeChildCount > 0;
  const canAddFocusedDirect = Boolean(focusedScopeId) && scopeDirectEntityCount > 0;
  const canAddFocusedSubtree = Boolean(focusedScopeId) && scopeSubtreeEntityCount > 0;
  const canOpenAdvancedScopeMenu = Boolean(focusedScopeId);
  const canOpenSelectionMenu = canIsolateOrRemove || canOpenEntityAction || Boolean(focusedScopeId);

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
      <header className="browser-canvas__header browser-canvas__header--compact">
        <div>
          <p className="eyebrow">Canvas</p>
          <h3>Local graph surface</h3>
        </div>
        <div className="browser-canvas__header-meta">
          <span className="badge">{model.nodes.length} nodes</span>
          <span className="badge">{model.edges.length} edges</span>
          <span className="badge">{selectedEntityCount} selected</span>
          <span className="badge">{pinnedNodeCount} pinned</span>
          <span className="badge">{activeModeLabel}</span>
        </div>
      </header>

      <div ref={toolbarRef} className="browser-canvas__toolbar browser-canvas__toolbar--compact">
        <details className="browser-canvas__menu">
          <summary
            className={['button-secondary', 'browser-canvas__menu-summary', !canOpenAddMenu ? 'browser-canvas__menu-summary--disabled' : ''].filter(Boolean).join(' ')}
            aria-disabled={!canOpenAddMenu}
            onClick={(event) => handleMenuSummaryClick(event, canOpenAddMenu)}
          >Add</summary>
          <div className="browser-canvas__menu-list card">
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => { if (scopeActionScopeId) onAddScopeAnalysis(scopeActionScopeId, 'primary'); })} disabled={!canAddPrimary}>Primary entities</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => { if (scopeActionScopeId) onAddScopeAnalysis(scopeActionScopeId, 'direct'); })} disabled={!canAddDirect}>Direct entities</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => { if (scopeActionScopeId) onAddScopeAnalysis(scopeActionScopeId, 'subtree'); })} disabled={!canAddSubtree}>Subtree entities</button>
          </div>
        </details>

        <details className="browser-canvas__menu">
          <summary
            className={['button-secondary', 'browser-canvas__menu-summary', !canOpenArrangeMenu ? 'browser-canvas__menu-summary--disabled' : ''].filter(Boolean).join(' ')}
            aria-disabled={!canOpenArrangeMenu}
            onClick={(event) => handleMenuSummaryClick(event, canOpenArrangeMenu)}
          >Arrange</summary>
          <div className="browser-canvas__menu-list card">
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onArrangeAllCanvasNodes)} disabled={!canArrangeAll}>Arrange all (Structure)</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onArrangeCanvasWithMode('flow'))} disabled={!canArrangeAll}>Flow layout</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onArrangeCanvasWithMode('hierarchy'))} disabled={!canArrangeAll}>Hierarchy layout</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onArrangeCanvasAroundFocus)} disabled={!canArrangeAroundFocus}>Arrange around focus</button>
          </div>
        </details>

        <details className="browser-canvas__menu">
          <summary
            className={['button-secondary', 'browser-canvas__menu-summary', !canOpenSelectionMenu ? 'browser-canvas__menu-summary--disabled' : ''].filter(Boolean).join(' ')}
            aria-disabled={!canOpenSelectionMenu}
            onClick={(event) => handleMenuSummaryClick(event, canOpenSelectionMenu)}
          >Selection</summary>
          <div className="browser-canvas__menu-list card">
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onIsolateSelection)} disabled={!canIsolateOrRemove}>Isolate</button>
            <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, onRemoveSelection)} disabled={!canIsolateOrRemove}>Remove</button>
            {focusedEntity ? (
              entityActions.map((action) => {
                if (action.key === 'pin') {
                  const isPinned = state.canvasNodes.find((node) => node.kind === 'entity' && node.id === focusedEntity.externalId)?.pinned;
                  return (
                    <button key={action.key} type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onEntityAction(action.key))}>
                      {isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  );
                }
                return (
                  <button key={action.key} type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onEntityAction(action.key))} disabled={action.disabled}>
                    {action.label}
                  </button>
                );
              })
            ) : focusedScopeId ? (
              <>
                <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onAddScopeAnalysis(focusedScopeId, 'children-primary'))} disabled={!canAddChildPrimary}>Child primary</button>
                <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onAddScopeAnalysis(focusedScopeId, 'direct'))} disabled={!canAddFocusedDirect}>Direct entities</button>
                <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onAddScopeAnalysis(focusedScopeId, 'subtree'))} disabled={!canAddFocusedSubtree}>Subtree entities</button>
                <details className="browser-canvas__menu browser-canvas__menu--inline">
                  <summary
                    className={['button-secondary', 'browser-canvas__menu-summary', !canOpenAdvancedScopeMenu ? 'browser-canvas__menu-summary--disabled' : ''].filter(Boolean).join(' ')}
                    aria-disabled={!canOpenAdvancedScopeMenu}
                    onClick={(event) => handleMenuSummaryClick(event, canOpenAdvancedScopeMenu)}
                  >Advanced scope node</summary>
                  <div className="browser-canvas__menu-list card">
                    <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onShowScopeContainer(focusedScopeId))}>Show selected scope as container</button>
                    <button type="button" className="button-secondary" onClick={(event) => runMenuAction(event, () => onTogglePinNode({ kind: 'scope', id: focusedScopeId }))}>
                      {state.canvasNodes.find((node) => node.kind === 'scope' && node.id === focusedScopeId)?.pinned ? 'Unpin container' : 'Pin container'}
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <>
                <button type="button" className="button-secondary" disabled>Isolate</button>
                <button type="button" className="button-secondary" disabled>Remove</button>
                <button type="button" className="button-secondary" disabled>Pin</button>
                <span className="muted browser-canvas__menu-empty">Focus an entity or scope for more actions.</span>
              </>
            )}
          </div>
        </details>

        <button type="button" className="button-secondary" onClick={onClearCanvas} disabled={model.nodes.length === 0}>Clear</button>

        <div className="browser-canvas__viewport-tools">
          <button type="button" className="button-secondary" onClick={onFitView} disabled={model.nodes.length === 0}>Fit view</button>
          <label className="browser-canvas__zoom browser-canvas__zoom--compact" aria-label={`Zoom ${Math.round(state.canvasViewport.zoom * 100)}%`}>
            <span className="sr-only">Zoom</span>
            <input type="range" min="35" max="220" step="5" value={Math.round(state.canvasViewport.zoom * 100)} onChange={(event) => onSetCanvasViewport({ zoom: Number(event.target.value) / 100 })} />
            <span className="sr-only">{Math.round(state.canvasViewport.zoom * 100)}%</span>
          </label>
        </div>
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

function isFinitePoint(point: { x: number; y: number } | undefined): point is { x: number; y: number } {
  return Number.isFinite(point?.x) && Number.isFinite(point?.y);
}

export function buildSvgPolylinePath(points: BrowserWorkspaceEdgeModel['route']['points']): string {
  if (points.length < 2 || points.some((point) => !isFinitePoint(point))) {
    return '';
  }
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

export function buildFallbackEdgePath(edge: BrowserWorkspaceEdgeModel): string {
  const start = edge.routingInput.defaultStart;
  const end = edge.routingInput.defaultEnd;
  if (!isFinitePoint(start) || !isFinitePoint(end)) {
    return '';
  }
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

export function resolveRenderedEdgeGeometry(edge: BrowserWorkspaceEdgeModel): {
  path: string;
  hitboxPath: string;
  labelPosition: BrowserWorkspaceEdgeModel['route']['labelPosition'];
} {
  const routePath = edge.route.path.trim();
  const polylinePath = buildSvgPolylinePath(edge.route.points);
  const path = routePath || polylinePath || buildFallbackEdgePath(edge);
  const hitboxPath = polylinePath || path;
  const labelPosition = isFinitePoint(edge.route.labelPosition)
    ? edge.route.labelPosition
    : edge.routingInput.defaultStart;
  return { path, hitboxPath, labelPosition };
}

function BrowserWorkspaceEdge({
  edge,
  onFocusRelationship,
}: {
  edge: BrowserWorkspaceEdgeModel;
  onFocusRelationship: (relationshipId: string) => void;
}) {
  const { path, hitboxPath, labelPosition } = resolveRenderedEdgeGeometry(edge);
  if (!path) {
    return null;
  }

  return (
    <g>
      <path d={path} className={edge.focused ? 'browser-canvas__edge browser-canvas__edge--focused' : 'browser-canvas__edge'} markerEnd="url(#browser-canvas-arrow)" />
      <path d={hitboxPath} className="browser-canvas__edge-hitbox" onClick={() => onFocusRelationship(edge.relationshipId)} />
      <text x={labelPosition.x} y={labelPosition.y - 8} className="browser-canvas__edge-label" textAnchor="middle">
        {edge.label}
      </text>
    </g>
  );
}

function BrowserGraphWorkspaceNode({
  node,
  suppressClickRef,
  beginNodeDrag,
  draggingNodeId,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
}: {
  node: BrowserWorkspaceNodeModel;
  suppressClickRef: React.MutableRefObject<boolean>;
  beginNodeDrag: ViewportEventHandlers['beginNodeDrag'];
  draggingNodeId?: string | null;
  onFocusScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onSelectEntity: (entityId: string, additive?: boolean) => void;
}) {
  return (
    <article
      key={`${node.kind}:${node.id}`}
      className={[
        'browser-canvas__node',
        `browser-canvas__node--${node.kind}`,
        node.selected ? 'browser-canvas__node--selected' : '',
        node.focused ? 'browser-canvas__node--focused' : '',
        node.pinned ? 'browser-canvas__node--pinned' : '',
        draggingNodeId === node.id ? 'browser-canvas__node--dragging' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: node.x, top: node.y, width: node.width, minHeight: node.height }}
      onMouseDown={(event) => beginNodeDrag(event, node)}
    >
      <button
        type="button"
        className="browser-canvas__node-main"
        onClick={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          if (node.kind === 'scope') {
            onFocusScope(node.id);
            return;
          }
          onSelectEntity(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
          onFocusEntity(node.id);
        }}
      >
        <span className="badge">{node.badgeLabel}</span>
        <strong>{node.title}</strong>
        {node.kind !== 'uml-class' && node.subtitle ? <span className="browser-canvas__node-subtitle muted">{node.subtitle}</span> : null}
      </button>

      {node.kind === 'uml-class' && node.compartments.length > 0 ? (
        <div className="browser-canvas__uml" aria-label={`${node.title} class details`}>
          {node.compartments.map((compartment) => (
            <section key={`${node.id}:${compartment.kind}`} className="browser-canvas__uml-compartment" aria-label={compartment.kind}>
              <div className="browser-canvas__uml-compartment-label">{compartment.kind}</div>
              <ul className="browser-canvas__uml-members">
                {compartment.items.map((item) => (
                  <li key={item.entityId} className="browser-canvas__uml-member">
                    <button
                      type="button"
                      className={[
                        'browser-canvas__uml-member-button',
                        item.selected ? 'browser-canvas__uml-member-button--selected' : '',
                        item.focused ? 'browser-canvas__uml-member-button--focused' : '',
                      ].filter(Boolean).join(' ')}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEntity(item.entityId, event.shiftKey || event.metaKey || event.ctrlKey);
                        onFocusEntity(item.entityId);
                      }}
                    >
                      <span className="browser-canvas__uml-member-title">{item.title}</span>
                      <span className="browser-canvas__uml-member-kind">{renderCompartmentSubtitle(item.kind)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
}

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
    <div ref={viewportRef} className={[
      'browser-canvas__viewport',
      viewportHandlers.isPanning ? 'browser-canvas__viewport--panning' : '',
    ].filter(Boolean).join(' ')} onMouseDown={viewportHandlers.beginViewportPan} onWheel={viewportHandlers.handleViewportWheel}>
      <div className="browser-canvas__surface" style={{ width: model.width, height: model.height, transform: `translate(${state.canvasViewport.offsetX}px, ${state.canvasViewport.offsetY}px) scale(${state.canvasViewport.zoom})`, transformOrigin: 'top left' }}>
        <svg className="browser-canvas__edges" width={model.width} height={model.height} viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden="true">
          <defs>
            <marker id="browser-canvas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" className="browser-canvas__arrow" />
            </marker>
          </defs>
          <g key={model.routingRevision} data-routing-revision={model.routingRevision}>
            {model.edges.map((edge) => (
              <BrowserWorkspaceEdge key={edge.relationshipId} edge={edge} onFocusRelationship={onFocusRelationship} />
            ))}
          </g>
        </svg>

        {model.nodes.map((node) => (
          <BrowserGraphWorkspaceNode
            key={`${node.kind}:${node.id}`}
            node={node}
            suppressClickRef={suppressClickRef}
            beginNodeDrag={viewportHandlers.beginNodeDrag}
            draggingNodeId={viewportHandlers.draggingNodeId}
            onFocusScope={onFocusScope}
            onFocusEntity={onFocusEntity}
            onSelectEntity={onSelectEntity}
          />
        ))}
      </div>
    </div>
  );
}
