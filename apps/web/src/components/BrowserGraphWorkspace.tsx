import { useEffect, useMemo, useState } from 'react';
import type { BrowserSnapshotIndex } from '../browserSnapshotIndex';
import type { BrowserSessionState } from '../browserSessionStore';
import { buildBrowserGraphWorkspaceModel } from '../browserGraphWorkspaceModel';

function scopeActionLabel(index: BrowserSnapshotIndex | null, scopeId: string | null) {
  if (!index || !scopeId) {
    return 'selected scope';
  }
  return index.scopePathById.get(scopeId) ?? scopeId;
}

type BrowserGraphWorkspaceProps = {
  state: BrowserSessionState;
  activeModeLabel: string;
  onAddSelectedScope: () => void;
  onAddScopeEntities: (scopeId: string) => void;
  onFocusScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onSelectEntity: (entityId: string, additive?: boolean) => void;
  onFocusRelationship: (relationshipId: string) => void;
  onExpandEntityDependencies: (entityId: string) => void;
  onExpandInboundDependencies: (entityId: string) => void;
  onExpandOutboundDependencies: (entityId: string) => void;
  onRemoveEntity: (entityId: string) => void;
  onRemoveSelection: () => void;
  onIsolateSelection: () => void;
  onTogglePinNode: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  onRelayoutCanvas: () => void;
  onClearCanvas: () => void;
  onFitView: () => void;
};

export function BrowserGraphWorkspace({
  state,
  activeModeLabel,
  onAddSelectedScope,
  onAddScopeEntities,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
  onFocusRelationship,
  onExpandEntityDependencies,
  onExpandInboundDependencies,
  onExpandOutboundDependencies,
  onRemoveEntity,
  onRemoveSelection,
  onIsolateSelection,
  onTogglePinNode,
  onRelayoutCanvas,
  onClearCanvas,
  onFitView,
}: BrowserGraphWorkspaceProps) {
  const [zoom, setZoom] = useState(1);
  const model = useMemo(() => buildBrowserGraphWorkspaceModel(state), [state]);
  const selectedScopeEntityCount = state.selectedScopeId ? (state.index?.entityIdsByScopeId.get(state.selectedScopeId)?.length ?? 0) : 0;
  const focusedEntityId = state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null;
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;
  const selectedEntityCount = state.selectedEntityIds.length;
  const pinnedNodeCount = state.canvasNodes.filter((node) => node.pinned).length;

  useEffect(() => {
    if (!state.fitViewRequestedAt) {
      return;
    }
    if (model.nodes.length > 12) {
      setZoom(0.82);
    } else if (model.nodes.length > 6) {
      setZoom(0.9);
    } else {
      setZoom(1);
    }
  }, [model.nodes.length, state.fitViewRequestedAt]);

  return (
    <section className="card browser-canvas" aria-label="Canvas graph workspace">
      <header className="browser-canvas__header">
        <div>
          <p className="eyebrow">Canvas workspace</p>
          <h3>Local graph surface</h3>
          <p className="muted browser-canvas__lead">
            The Browser center stage is now a local canvas. Step 12 adds analysis interactions so you can grow a graph from one element, compare neighborhoods, isolate a subset, and re-layout the result without touching the old backend explorer endpoints.
          </p>
        </div>
        <div className="browser-canvas__header-meta">
          <span className="badge">{model.nodes.length} nodes</span>
          <span className="badge">{model.edges.length} edges</span>
          <span className="badge">{selectedEntityCount} selected</span>
          <span className="badge">{pinnedNodeCount} pinned</span>
          <span className="badge">Layout {state.canvasLayoutMode}</span>
          <span className="badge">Mode {activeModeLabel}</span>
        </div>
      </header>

      <div className="browser-canvas__toolbar">
        <button type="button" className="button-secondary" onClick={onAddSelectedScope} disabled={!state.selectedScopeId}>Add selected scope</button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => state.selectedScopeId ? onAddScopeEntities(state.selectedScopeId) : undefined}
          disabled={!state.selectedScopeId || selectedScopeEntityCount === 0}
        >
          Add scope entities
        </button>
        <button type="button" className="button-secondary" onClick={onIsolateSelection} disabled={selectedEntityCount === 0 && !focusedScopeId}>Isolate selection</button>
        <button type="button" className="button-secondary" onClick={onRemoveSelection} disabled={selectedEntityCount === 0 && !focusedScopeId}>Remove selection</button>
        <button type="button" className="button-secondary" onClick={onRelayoutCanvas} disabled={model.nodes.length === 0}>Re-layout</button>
        <button type="button" className="button-secondary" onClick={onFitView} disabled={model.nodes.length === 0}>Fit view</button>
        <button type="button" className="button-secondary" onClick={onClearCanvas} disabled={model.nodes.length === 0}>Clear canvas</button>
        <label className="browser-canvas__zoom">
          <span className="muted">Zoom</span>
          <input
            type="range"
            min="70"
            max="130"
            step="5"
            value={Math.round(zoom * 100)}
            onChange={(event) => setZoom(Number(event.target.value) / 100)}
          />
          <span className="badge">{Math.round(zoom * 100)}%</span>
        </label>
      </div>

      <div className="browser-canvas__helper-row">
        <p className="muted">Selected branch: {scopeActionLabel(state.index, state.selectedScopeId)}</p>
        {focusedEntityId ? (
          <div className="actions">
            <button type="button" className="button-secondary" onClick={() => onExpandInboundDependencies(focusedEntityId)}>
              Who depends on this?
            </button>
            <button type="button" className="button-secondary" onClick={() => onExpandOutboundDependencies(focusedEntityId)}>
              What does this depend on?
            </button>
            <button type="button" className="button-secondary" onClick={() => onExpandEntityDependencies(focusedEntityId)}>
              What is around this?
            </button>
            <button type="button" className="button-secondary" onClick={() => onRemoveEntity(focusedEntityId)}>
              Remove focused entity
            </button>
            <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'entity', id: focusedEntityId })}>
              {state.canvasNodes.find((node) => node.kind === 'entity' && node.id === focusedEntityId)?.pinned ? 'Unpin focused entity' : 'Pin focused entity'}
            </button>
          </div>
        ) : focusedScopeId ? (
          <div className="actions">
            <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: 'scope', id: focusedScopeId })}>
              {state.canvasNodes.find((node) => node.kind === 'scope' && node.id === focusedScopeId)?.pinned ? 'Unpin focused scope' : 'Pin focused scope'}
            </button>
          </div>
        ) : null}
      </div>

      {model.nodes.length === 0 ? (
        <div className="browser-canvas__empty">
          <h4>Start with a scope or entity</h4>
          <p className="muted">Use the left tree’s “＋” buttons, local search results, or the toolbar above to seed the canvas. Shift-click additional entities on the canvas to multi-select, then isolate or remove a subset as you analyze it.</p>
        </div>
      ) : (
        <div className="browser-canvas__viewport">
          <div className="browser-canvas__surface" style={{ width: model.width, height: model.height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <svg className="browser-canvas__edges" width={model.width} height={model.height} viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden="true">
              <defs>
                <marker id="browser-canvas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" className="browser-canvas__arrow" />
                </marker>
              </defs>
              {model.edges.map((edge) => (
                <g key={edge.relationshipId}>
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    className={edge.focused ? 'browser-canvas__edge browser-canvas__edge--focused' : 'browser-canvas__edge'}
                    markerEnd="url(#browser-canvas-arrow)"
                  />
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    className="browser-canvas__edge-hitbox"
                    onClick={() => onFocusRelationship(edge.relationshipId)}
                  />
                  <text
                    x={(edge.x1 + edge.x2) / 2}
                    y={(edge.y1 + edge.y2) / 2 - 8}
                    className="browser-canvas__edge-label"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                </g>
              ))}
            </svg>

            {model.nodes.map((node) => (
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
              >
                <button
                  type="button"
                  className="browser-canvas__node-main"
                  onClick={(event) => {
                    if (node.kind === 'scope') {
                      onFocusScope(node.id);
                      return;
                    }
                    onSelectEntity(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
                    onFocusEntity(node.id);
                  }}
                >
                  <span className="badge">{node.kind}</span>
                  <strong>{node.title}</strong>
                  <span className="muted">{node.subtitle}</span>
                </button>
                <div className="browser-canvas__node-actions">
                  <button type="button" className="button-secondary" onClick={() => onTogglePinNode({ kind: node.kind, id: node.id })}>{node.pinned ? 'Unpin' : 'Pin'}</button>
                  {node.kind === 'entity' ? (
                    <>
                      <button type="button" className="button-secondary" onClick={() => onExpandEntityDependencies(node.id)}>Around</button>
                      <button type="button" className="button-secondary" onClick={() => onExpandInboundDependencies(node.id)}>Inbound</button>
                      <button type="button" className="button-secondary" onClick={() => onExpandOutboundDependencies(node.id)}>Outbound</button>
                      <button type="button" className="button-secondary" onClick={() => onRemoveEntity(node.id)}>Remove</button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
