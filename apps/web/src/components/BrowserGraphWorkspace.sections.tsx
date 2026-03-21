import type { FullSnapshotEntity } from '../appModel';
import type { BrowserWorkspaceNodeModel, BrowserGraphWorkspaceModel } from '../browserGraphWorkspaceModel';
import type { BrowserSessionState } from '../browserSessionStore';
import { renderCompartmentSubtitle, scopeActionLabel } from './BrowserGraphWorkspace.actions';
import type { BrowserEntitySelectionAction, ScopeAnalysisMode, ViewportEventHandlers } from './BrowserGraphWorkspace.types';

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
  onArrangeCanvasAroundFocus,
  onFitView,
  onClearCanvas,
  onSetCanvasViewport,
  onShowScopeContainer,
  onTogglePinNode,
  onEntityAction,
}: ToolbarProps) {
  return (
    <>
      <header className="browser-canvas__header">
        <div>
          <p className="eyebrow">Canvas workspace</p>
          <h3>Local graph surface</h3>
        </div>
        <div className="browser-canvas__header-meta">
          <span className="badge">{model.nodes.length} nodes</span>
          <span className="badge">{model.edges.length} edges</span>
          <span className="badge">{selectedEntityCount} selected</span>
          <span className="badge">{pinnedNodeCount} pinned</span>
          <span className="badge">Zoom {Math.round(state.canvasViewport.zoom * 100)}%</span>
          <span className="badge">Mode {activeModeLabel}</span>
        </div>
      </header>

      <div className="browser-canvas__toolbar">
        <button type="button" className="button-secondary" onClick={() => scopeActionScopeId ? onAddScopeAnalysis(scopeActionScopeId, 'primary') : undefined} disabled={!scopeActionScopeId || scopePrimaryEntityCount === 0}>Add primary entities</button>
        <button type="button" className="button-secondary" onClick={() => scopeActionScopeId ? onAddScopeAnalysis(scopeActionScopeId, 'direct') : undefined} disabled={!scopeActionScopeId || scopeDirectEntityCount === 0}>Add direct entities</button>
        <button type="button" className="button-secondary" onClick={() => scopeActionScopeId ? onAddScopeAnalysis(scopeActionScopeId, 'subtree') : undefined} disabled={!scopeActionScopeId || scopeSubtreeEntityCount === 0}>Add subtree entities</button>
        <button type="button" className="button-secondary" onClick={onIsolateSelection} disabled={selectedEntityCount === 0 && !focusedScopeId}>Isolate selection</button>
        <button type="button" className="button-secondary" onClick={onRemoveSelection} disabled={selectedEntityCount === 0 && !focusedScopeId}>Remove selection</button>
        <button type="button" className="button-secondary" onClick={onArrangeAllCanvasNodes} disabled={model.nodes.length === 0}>Arrange all</button>
        <button type="button" className="button-secondary" onClick={onArrangeCanvasAroundFocus} disabled={model.nodes.length === 0 || !focusedEntity}>Arrange around focus</button>
        <button type="button" className="button-secondary" onClick={onFitView} disabled={model.nodes.length === 0}>Fit view</button>
        <button type="button" className="button-secondary" onClick={onClearCanvas} disabled={model.nodes.length === 0}>Clear canvas</button>
        <label className="browser-canvas__zoom">
          <span className="muted">Zoom</span>
          <input type="range" min="35" max="220" step="5" value={Math.round(state.canvasViewport.zoom * 100)} onChange={(event) => onSetCanvasViewport({ zoom: Number(event.target.value) / 100 })} />
          <span className="badge">{Math.round(state.canvasViewport.zoom * 100)}%</span>
        </label>
      </div>

      <div className="browser-canvas__helper-row">
        <p className="muted">Selected branch: {scopeActionLabel(state.index, scopeActionScopeId)}</p>
        <div className="actions browser-canvas__selection-toolbar">
          {focusedEntity ? (
            entityActions.map((action) => {
              if (action.key === 'pin') {
                const isPinned = state.canvasNodes.find((node) => node.kind === 'entity' && node.id === focusedEntity.externalId)?.pinned;
                return (
                  <button key={action.key} type="button" className="button-secondary" onClick={() => onEntityAction(action.key)}>
                    {isPinned ? 'Unpin' : 'Pin'}
                  </button>
                );
              }
              return (
                <button key={action.key} type="button" className="button-secondary" onClick={() => onEntityAction(action.key)} disabled={action.disabled}>
                  {action.label}
                </button>
              );
            })
          ) : focusedScopeId ? (
            <>
              <button type="button" className="button-secondary" onClick={() => onAddScopeAnalysis(focusedScopeId, 'children-primary')} disabled={scopeChildCount === 0}>Child primary{scopeChildCount > 0 ? ` (${Math.min(scopeChildCount, 24)})` : ''}</button>
              <button type="button" className="button-secondary" onClick={() => onAddScopeAnalysis(focusedScopeId, 'direct')} disabled={scopeDirectEntityCount === 0}>Direct entities{scopeDirectEntityCount > 0 ? ` (${Math.min(scopeDirectEntityCount, 24)})` : ''}</button>
              <button type="button" className="button-secondary" onClick={() => onAddScopeAnalysis(focusedScopeId, 'subtree')} disabled={scopeSubtreeEntityCount === 0}>Subtree entities{scopeSubtreeEntityCount > 0 ? ` (${Math.min(scopeSubtreeEntityCount, 24)})` : ''}</button>
              <details className="browser-canvas__advanced-scope">
                <summary className="button-secondary">Advanced scope node</summary>
                <div className="browser-canvas__advanced-scope-actions">
                  <p className="muted">Entity actions are the default. Use scope nodes only when you explicitly want container/debug context on the canvas.</p>
                  <div className="actions">
                    <button type="button" className="button-secondary" onClick={() => onShowScopeContainer(focusedScopeId)}>Show selected scope as container</button>
                    <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'scope', id: focusedScopeId })}>
                      {state.canvasNodes.find((node) => node.kind === 'scope' && node.id === focusedScopeId)?.pinned ? 'Unpin scope node' : 'Pin scope node'}
                    </button>
                  </div>
                </div>
              </details>
            </>
          ) : (
            <span className="muted">Focus an entity to explore relationships, containment, and neighbors. Scope actions remain available as an advanced fallback.</span>
          )}
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

function BrowserGraphWorkspaceNode({
  node,
  suppressClickRef,
  beginNodeDrag,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
}: {
  node: BrowserWorkspaceNodeModel;
  suppressClickRef: React.MutableRefObject<boolean>;
  beginNodeDrag: ViewportEventHandlers['beginNodeDrag'];
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
    <div ref={viewportRef} className="browser-canvas__viewport" onMouseDown={viewportHandlers.beginViewportPan} onWheel={viewportHandlers.handleViewportWheel}>
      <div className="browser-canvas__surface" style={{ width: model.width, height: model.height, transform: `translate(${state.canvasViewport.offsetX}px, ${state.canvasViewport.offsetY}px) scale(${state.canvasViewport.zoom})`, transformOrigin: 'top left' }}>
        <svg className="browser-canvas__edges" width={model.width} height={model.height} viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden="true">
          <defs>
            <marker id="browser-canvas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" className="browser-canvas__arrow" />
            </marker>
          </defs>
          {model.edges.map((edge) => (
            <g key={edge.relationshipId}>
              <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} className={edge.focused ? 'browser-canvas__edge browser-canvas__edge--focused' : 'browser-canvas__edge'} markerEnd="url(#browser-canvas-arrow)" />
              <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} className="browser-canvas__edge-hitbox" onClick={() => onFocusRelationship(edge.relationshipId)} />
              <text x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2 - 8} className="browser-canvas__edge-label" textAnchor="middle">
                {edge.label}
              </text>
            </g>
          ))}
        </svg>

        {model.nodes.map((node) => (
          <BrowserGraphWorkspaceNode
            key={`${node.kind}:${node.id}`}
            node={node}
            suppressClickRef={suppressClickRef}
            beginNodeDrag={viewportHandlers.beginNodeDrag}
            onFocusScope={onFocusScope}
            onFocusEntity={onFocusEntity}
            onSelectEntity={onSelectEntity}
          />
        ))}
      </div>
    </div>
  );
}
