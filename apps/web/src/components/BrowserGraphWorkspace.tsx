import { useEffect, useMemo, useRef, type MouseEvent as ReactMouseEvent, type WheelEvent as ReactWheelEvent } from 'react';
import type { FullSnapshotEntity } from '../appModel';
import {
  getContainedEntitiesForEntity,
  getContainingEntitiesForEntity,
  getPrimaryEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
  type BrowserSnapshotIndex,
} from '../browserSnapshotIndex';
import type { BrowserCanvasNode, BrowserSessionState } from '../browserSessionStore';
import { buildBrowserGraphWorkspaceModel, type BrowserWorkspaceNodeModel } from '../browserGraphWorkspaceModel';
import {
  computeDraggedCanvasNodePosition,
  computeFitViewCanvasViewport,
  computePannedCanvasViewport,
  computeZoomedCanvasViewportAroundPointer,
} from '../browserCanvasViewport';

function scopeActionLabel(index: BrowserSnapshotIndex | null, scopeId: string | null) {
  if (!index || !scopeId) {
    return 'selected scope';
  }
  return index.scopePathById.get(scopeId) ?? scopeId;
}

type ScopeAnalysisMode = 'primary' | 'direct' | 'subtree' | 'children-primary';

type BrowserGraphWorkspaceProps = {
  state: BrowserSessionState;
  activeModeLabel: string;
  onShowScopeContainer: (scopeId?: string) => void;
  onAddScopeAnalysis: (scopeId: string, mode: ScopeAnalysisMode, kinds?: string[], childScopeKinds?: string[]) => void;
  onAddContainedEntities: (entityId: string, kinds?: string[]) => void;
  onAddPeerEntities: (entityId: string, containerKinds?: string[], peerKinds?: string[]) => void;
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
  onMoveCanvasNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
  onSetCanvasViewport: (viewport: { zoom?: number; offsetX?: number; offsetY?: number }) => void;
  onArrangeAllCanvasNodes: () => void;
  onArrangeCanvasAroundFocus: () => void;
  onClearCanvas: () => void;
  onFitView: () => void;
};

type BrowserEntitySelectionAction = {
  key: string;
  label: string;
  disabled?: boolean;
};


type DragState = {
  node: Pick<BrowserCanvasNode, 'kind' | 'id'>;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

type PanState = {
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
};

function renderCompartmentSubtitle(kind: string) {
  return kind.toLowerCase();
}

function filterEntitiesByKinds(entities: FullSnapshotEntity[], kinds?: string[]) {
  if (!kinds || kinds.length === 0) {
    return entities;
  }
  const allowed = new Set(kinds);
  return entities.filter((entity) => allowed.has(entity.kind));
}

function getEntityContainedCount(index: BrowserSnapshotIndex, entityId: string, kinds?: string[]) {
  return filterEntitiesByKinds(getContainedEntitiesForEntity(index, entityId), kinds).length;
}

function getEntityPeerCount(index: BrowserSnapshotIndex, entityId: string, containerKinds?: string[], peerKinds?: string[]) {
  const containers = filterEntitiesByKinds(getContainingEntitiesForEntity(index, entityId), containerKinds);
  const peerIds = new Set<string>();
  for (const container of containers) {
    for (const peer of filterEntitiesByKinds(getContainedEntitiesForEntity(index, container.externalId), peerKinds)) {
      if (peer.externalId !== entityId) {
        peerIds.add(peer.externalId);
      }
    }
  }
  return peerIds.size;
}

function getScopeChildPrimaryCount(index: BrowserSnapshotIndex, scopeId: string, childScopeKinds?: string[]) {
  const childKindFilter = childScopeKinds && childScopeKinds.length > 0 ? new Set(childScopeKinds) : null;
  const childScopeIds = (index.childScopeIdsByParentId.get(scopeId) ?? []).filter((childScopeId) => {
    if (!childKindFilter) {
      return true;
    }
    return childKindFilter.has(index.scopesById.get(childScopeId)?.kind ?? '');
  });
  const entityIds = new Set<string>();
  for (const childScopeId of childScopeIds) {
    for (const entity of getPrimaryEntitiesForScope(index, childScopeId)) {
      entityIds.add(entity.externalId);
    }
  }
  return entityIds.size;
}

export function buildEntitySelectionActions(index: BrowserSnapshotIndex | null, entity: FullSnapshotEntity | null): BrowserEntitySelectionAction[] {
  if (!index || !entity) {
    return [];
  }

  const containedCount = getEntityContainedCount(index, entity.externalId);
  const inboundCount = index.inboundRelationshipIdsByEntityId.get(entity.externalId)?.length ?? 0;
  const outboundCount = index.outboundRelationshipIdsByEntityId.get(entity.externalId)?.length ?? 0;
  const scopeId = entity.scopeId;

  if (entity.kind === 'MODULE') {
    const functionCount = getEntityContainedCount(index, entity.externalId, ['FUNCTION']);
    return [
      { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
      { key: 'functions', label: `Functions${functionCount > 0 ? ` (${Math.min(functionCount, 24)})` : ''}`, disabled: functionCount === 0 },
      { key: 'dependencies', label: 'Dependencies', disabled: inboundCount + outboundCount === 0 },
      { key: 'used-by', label: `Used by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  if (entity.kind === 'PACKAGE') {
    const subpackageCount = scopeId ? getScopeChildPrimaryCount(index, scopeId, ['PACKAGE']) : 0;
    const moduleCount = scopeId ? getSubtreeEntitiesForScopeByKind(index, scopeId, ['MODULE']).length : 0;
    const classCount = scopeId ? getSubtreeEntitiesForScopeByKind(index, scopeId, ['CLASS', 'INTERFACE']).length : 0;
    return [
      { key: 'subpackages', label: `Subpackages${subpackageCount > 0 ? ` (${Math.min(subpackageCount, 24)})` : ''}`, disabled: subpackageCount === 0 },
      { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
      { key: 'modules', label: `Modules${moduleCount > 0 ? ` (${Math.min(moduleCount, 24)})` : ''}`, disabled: moduleCount === 0 },
      { key: 'classes', label: `Classes${classCount > 0 ? ` (${Math.min(classCount, 24)})` : ''}`, disabled: classCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  if (entity.kind === 'FUNCTION') {
    const sameModuleCount = getEntityPeerCount(index, entity.externalId, ['MODULE'], ['FUNCTION']);
    return [
      { key: 'calls', label: `Calls${outboundCount > 0 ? ` (${Math.min(outboundCount, 24)})` : ''}`, disabled: outboundCount === 0 },
      { key: 'called-by', label: `Called by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
      { key: 'same-module', label: `Same module${sameModuleCount > 0 ? ` (${Math.min(sameModuleCount, 24)})` : ''}`, disabled: sameModuleCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  if (entity.kind === 'CLASS' || entity.kind === 'INTERFACE') {
    return [
      { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
      { key: 'dependencies', label: 'Dependencies', disabled: inboundCount + outboundCount === 0 },
      { key: 'used-by', label: `Used by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
      { key: 'remove', label: 'Remove' },
      { key: 'pin', label: 'Pin' },
    ];
  }

  return [
    { key: 'contained', label: `Contained${containedCount > 0 ? ` (${Math.min(containedCount, 24)})` : ''}`, disabled: containedCount === 0 },
    { key: 'dependencies', label: 'Dependencies', disabled: inboundCount + outboundCount === 0 },
    { key: 'used-by', label: `Used by${inboundCount > 0 ? ` (${Math.min(inboundCount, 24)})` : ''}`, disabled: inboundCount === 0 },
    { key: 'remove', label: 'Remove' },
    { key: 'pin', label: 'Pin' },
  ];
}

export function BrowserGraphWorkspace({
  state,
  activeModeLabel,
  onShowScopeContainer,
  onAddScopeAnalysis,
  onAddContainedEntities,
  onAddPeerEntities,
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
  onMoveCanvasNode,
  onSetCanvasViewport,
  onArrangeAllCanvasNodes,
  onArrangeCanvasAroundFocus,
  onClearCanvas,
  onFitView,
}: BrowserGraphWorkspaceProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const dragDistanceRef = useRef(0);
  const panDistanceRef = useRef(0);
  const suppressClickRef = useRef(false);
  const model = useMemo(() => buildBrowserGraphWorkspaceModel(state), [state]);
  const focusedEntityId = state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null;
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;
  const scopeActionScopeId = focusedScopeId ?? state.selectedScopeId;
  const scopeTreeNode = scopeActionScopeId ? state.index?.scopeTree.find((node) => node.scopeId === scopeActionScopeId) ?? null : null;
  const scopeChildCount = scopeActionScopeId ? (state.index?.childScopeIdsByParentId.get(scopeActionScopeId)?.length ?? 0) : 0;
  const scopeDirectEntityCount = scopeActionScopeId ? (state.index?.entityIdsByScopeId.get(scopeActionScopeId)?.length ?? 0) : 0;
  const scopePrimaryEntityCount = scopeActionScopeId ? (state.index ? getPrimaryEntitiesForScope(state.index, scopeActionScopeId).length : 0) : 0;
  const scopeSubtreeEntityCount = scopeTreeNode?.descendantEntityCount ?? 0;
  const selectedEntityCount = state.selectedEntityIds.length;
  const pinnedNodeCount = state.canvasNodes.filter((node) => node.pinned).length;
  const focusedEntity = focusedEntityId ? state.index?.entitiesById.get(focusedEntityId) ?? null : null;
  const entityActions = useMemo(
    () => buildEntitySelectionActions(state.index, focusedEntity),
    [state.index, focusedEntity],
  );

  useEffect(() => {
    if (!state.fitViewRequestedAt || model.nodes.length === 0) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    onSetCanvasViewport(computeFitViewCanvasViewport({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    }, {
      width: model.width,
      height: model.height,
    }));
  }, [model.height, model.nodes.length, model.width, onSetCanvasViewport, state.fitViewRequestedAt]);



  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (dragState) {
        event.preventDefault();
        const deltaX = event.clientX - dragState.startClientX;
        const deltaY = event.clientY - dragState.startClientY;
        const nextPosition = computeDraggedCanvasNodePosition({
          x: dragState.startX,
          y: dragState.startY,
        }, {
          x: deltaX,
          y: deltaY,
        }, state.canvasViewport.zoom);
        dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(nextPosition.x - dragState.startX), Math.abs(nextPosition.y - dragState.startY));
        suppressClickRef.current = dragDistanceRef.current > 4;
        onMoveCanvasNode(dragState.node, nextPosition);
        return;
      }
      const panState = panStateRef.current;
      if (!panState) {
        return;
      }
      event.preventDefault();
      const deltaX = event.clientX - panState.startClientX;
      const deltaY = event.clientY - panState.startClientY;
      panDistanceRef.current = Math.max(panDistanceRef.current, Math.abs(deltaX), Math.abs(deltaY));
      onSetCanvasViewport(computePannedCanvasViewport({
        zoom: state.canvasViewport.zoom,
        offsetX: panState.startOffsetX,
        offsetY: panState.startOffsetY,
      }, {
        x: deltaX,
        y: deltaY,
      }));
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      panStateRef.current = null;
      dragDistanceRef.current = 0;
      panDistanceRef.current = 0;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const hasWindow = typeof window !== 'undefined';
    if (!hasWindow) {
      return;
    }

    if (dragStateRef.current || panStateRef.current) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMoveCanvasNode, onSetCanvasViewport, state.canvasViewport.zoom]);

  const beginNodeDrag = (event: ReactMouseEvent<HTMLElement>, node: BrowserWorkspaceNodeModel) => {
    if (event.button !== 0) {
      return;
    }
    dragStateRef.current = {
      node: { kind: node.kind === 'scope' ? 'scope' : 'entity', id: node.id },
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: node.x,
      startY: node.y,
    };
    dragDistanceRef.current = 0;
    suppressClickRef.current = false;
  };

  const beginViewportPan = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }
    panStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: state.canvasViewport.offsetX,
      startOffsetY: state.canvasViewport.offsetY,
    };
    panDistanceRef.current = 0;
  };

  const handleViewportWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    onSetCanvasViewport(computeZoomedCanvasViewportAroundPointer(state.canvasViewport, {
      x: pointerX,
      y: pointerY,
    }, event.deltaY));
  };

  const handleEntityAction = (actionKey: string) => {
    if (!focusedEntity) {
      return;
    }
    if (actionKey === 'contained') {
      onAddContainedEntities(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'functions') {
      onAddContainedEntities(focusedEntity.externalId, ['FUNCTION']);
      return;
    }
    if (actionKey === 'dependencies') {
      onExpandEntityDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'used-by' || actionKey === 'called-by') {
      onExpandInboundDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'calls') {
      onExpandOutboundDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'same-module') {
      onAddPeerEntities(focusedEntity.externalId, ['MODULE'], ['FUNCTION']);
      return;
    }
    if (actionKey === 'subpackages' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'children-primary', undefined, ['PACKAGE']);
      return;
    }
    if (actionKey === 'modules' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'subtree', ['MODULE']);
      return;
    }
    if (actionKey === 'classes' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'subtree', ['CLASS', 'INTERFACE']);
      return;
    }
    if (actionKey === 'remove') {
      onRemoveEntity(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'pin') {
      onTogglePinNode({ kind: 'entity', id: focusedEntity.externalId });
    }
  };

  return (
    <section className="card browser-canvas" aria-label="Canvas graph workspace">
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
        <button
          type="button"
          className="button-secondary"
          onClick={() => scopeActionScopeId ? onAddScopeAnalysis(scopeActionScopeId, 'primary') : undefined}
          disabled={!scopeActionScopeId || scopePrimaryEntityCount === 0}
        >
          Add primary entities
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => scopeActionScopeId ? onAddScopeAnalysis(scopeActionScopeId, 'direct') : undefined}
          disabled={!scopeActionScopeId || scopeDirectEntityCount === 0}
        >
          Add direct entities
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => scopeActionScopeId ? onAddScopeAnalysis(scopeActionScopeId, 'subtree') : undefined}
          disabled={!scopeActionScopeId || scopeSubtreeEntityCount === 0}
        >
          Add subtree entities
        </button>
        <button type="button" className="button-secondary" onClick={onIsolateSelection} disabled={selectedEntityCount === 0 && !focusedScopeId}>Isolate selection</button>
        <button type="button" className="button-secondary" onClick={onRemoveSelection} disabled={selectedEntityCount === 0 && !focusedScopeId}>Remove selection</button>
        <button type="button" className="button-secondary" onClick={onArrangeAllCanvasNodes} disabled={model.nodes.length === 0}>Arrange all</button>
        <button type="button" className="button-secondary" onClick={onArrangeCanvasAroundFocus} disabled={model.nodes.length === 0 || !focusedEntity}>Arrange around focus</button>
        <button type="button" className="button-secondary" onClick={onFitView} disabled={model.nodes.length === 0}>Fit view</button>
        <button type="button" className="button-secondary" onClick={onClearCanvas} disabled={model.nodes.length === 0}>Clear canvas</button>
        <label className="browser-canvas__zoom">
          <span className="muted">Zoom</span>
          <input
            type="range"
            min="35"
            max="220"
            step="5"
            value={Math.round(state.canvasViewport.zoom * 100)}
            onChange={(event) => onSetCanvasViewport({ zoom: Number(event.target.value) / 100 })}
          />
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
                  <button key={action.key} type="button" className="button-secondary" onClick={() => handleEntityAction(action.key)}>
                    {isPinned ? 'Unpin' : 'Pin'}
                  </button>
                );
              }
              return (
                <button
                  key={action.key}
                  type="button"
                  className="button-secondary"
                  onClick={() => handleEntityAction(action.key)}
                  disabled={action.disabled}
                >
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

      {model.nodes.length === 0 ? (
        <div className="browser-canvas__empty">
          <h4>Start with a scope or entity</h4>
          <p className="muted">Use the left tree, facts panel, search results, or the toolbar above to add entities first. Scope containers remain available only under advanced scope actions.</p>
        </div>
      ) : (
        <div
          ref={viewportRef}
          className="browser-canvas__viewport"
          onMouseDown={beginViewportPan}
          onWheel={handleViewportWheel}
        >
          <div className="browser-canvas__surface" style={{ width: model.width, height: model.height, transform: `translate(${state.canvasViewport.offsetX}px, ${state.canvasViewport.offsetY}px) scale(${state.canvasViewport.zoom})`, transformOrigin: 'top left' }}>
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
                  {node.kind !== 'uml-class' && node.subtitle ? (
                    <span className="browser-canvas__node-subtitle muted">{node.subtitle}</span>
                  ) : null}
                </button>

                {node.kind === 'uml-class' && node.compartments.length > 0 ? (
                  <div className="browser-canvas__uml" aria-label={`${node.title} class details`}>
                    {node.compartments.map((compartment) => (
                      <section
                        key={`${node.id}:${compartment.kind}`}
                        className="browser-canvas__uml-compartment"
                        aria-label={compartment.kind}
                      >
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
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
