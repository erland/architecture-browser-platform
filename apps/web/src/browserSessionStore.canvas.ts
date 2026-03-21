import { arrangeCanvasNodesAroundEntityFocus, arrangeCanvasNodesInGrid, planEntityInsertion } from './browserCanvasPlacement';
import type {
  BrowserDependencyDirection,
} from './browserSnapshotIndex';
import { getDependencyNeighborhood, getPrimaryEntitiesForScope } from './browserSnapshotIndex';
import type {
  BrowserCanvasNode,
  BrowserCanvasViewport,
  BrowserFactsPanelLocation,
  BrowserFactsPanelMode,
  BrowserFocusedElement,
  BrowserSessionState,
} from './browserSessionStore.types';
import {
  mergeCanvasViewport,
  planEntityNodePosition,
  planScopeNodePosition,
  uniqueValues,
  upsertCanvasEdge,
  upsertCanvasNode,
  upsertPinnedCanvasNode,
  upsertSelectedEntityIds,
} from './browserSessionStore.utils';

export function addEntityToCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const entity = state.index?.entitiesById.get(entityId);
  if (!entity) {
    return state;
  }
  const canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId }, planEntityNodePosition(state, entityId));
  return {
    ...state,
    canvasNodes,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, entityId]),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  };
}

export function addEntitiesToCanvas(state: BrowserSessionState, entityIds: string[]): BrowserSessionState {
  if (!state.index) {
    return state;
  }
  const validEntityIds = [...new Set(entityIds)].filter((entityId) => state.index?.entitiesById.has(entityId));
  if (validEntityIds.length === 0) {
    return state;
  }

  let canvasNodes = [...state.canvasNodes];
  const anchorEntityId = state.focusedElement?.kind === 'entity' ? state.focusedElement.id : null;
  for (const [index, entityId] of validEntityIds.entries()) {
    const entity = state.index.entitiesById.get(entityId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(
      canvasNodes,
      { kind: 'entity', id: entityId },
      planEntityInsertion(canvasNodes, state.index, entity, {
        anchorEntityId,
        selectedScopeId: state.selectedScopeId,
        insertionIndex: index,
        insertionCount: validEntityIds.length,
      }, { state }),
    );
  }

  const focusEntityId = validEntityIds[0];
  return {
    ...state,
    canvasNodes,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, ...validEntityIds]),
    focusedElement: { kind: 'entity', id: focusEntityId },
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  };
}

export function addPrimaryEntitiesForScope(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  if (!state.index?.scopesById.has(scopeId)) {
    return state;
  }
  const primaryEntityIds = getPrimaryEntitiesForScope(state.index, scopeId).map((entity) => entity.externalId);
  if (primaryEntityIds.length === 0) {
    return state;
  }
  const nextState = addEntitiesToCanvas(state, primaryEntityIds);
  return {
    ...nextState,
    selectedScopeId: scopeId,
  };
}

export function addScopeToCanvas(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  const scope = state.index?.scopesById.get(scopeId);
  if (!scope) {
    return state;
  }
  return {
    ...state,
    canvasNodes: upsertCanvasNode(state.canvasNodes, { kind: 'scope', id: scopeId }, planScopeNodePosition(state, scopeId)),
    focusedElement: { kind: 'scope', id: scopeId },
    factsPanelMode: 'scope',
    appliedViewpoint: null,
  };
}

export function addDependenciesToCanvas(state: BrowserSessionState, entityId: string, direction: BrowserDependencyDirection = 'ALL'): BrowserSessionState {
  if (!state.index?.entitiesById.has(entityId)) {
    return state;
  }
  const neighborhood = getDependencyNeighborhood(state.index, entityId, direction);
  if (!neighborhood) {
    return state;
  }
  const allowedRelationshipIds = new Set(
    neighborhood.edges
      .filter((edge) => direction === 'ALL'
        ? true
        : direction === 'INBOUND'
          ? edge.toEntityId === entityId
          : edge.fromEntityId === entityId)
      .map((edge) => edge.relationshipId),
  );

  let canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId, pinned: true }, planEntityNodePosition(state, entityId));
  let canvasEdges = [...state.canvasEdges];
  const neighborsToInsert = uniqueValues(
    neighborhood.edges
      .filter((edge) => allowedRelationshipIds.has(edge.relationshipId))
      .flatMap((edge) => [edge.fromEntityId, edge.toEntityId])
      .filter((candidateId) => candidateId !== entityId),
  );
  const inboundNeighborIds = neighborsToInsert.filter((candidateId) => neighborhood.inboundEntityIds.includes(candidateId));
  const outboundNeighborIds = neighborsToInsert.filter((candidateId) => neighborhood.outboundEntityIds.includes(candidateId));
  const mixedNeighborIds = neighborsToInsert.filter((candidateId) => !inboundNeighborIds.includes(candidateId) && !outboundNeighborIds.includes(candidateId));

  for (const [index, candidateId] of inboundNeighborIds.entries()) {
    const entity = state.index.entitiesById.get(candidateId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: candidateId }, planEntityInsertion(canvasNodes, state.index, entity, {
      anchorEntityId: entityId,
      anchorDirection: 'left',
      insertionIndex: index,
      insertionCount: inboundNeighborIds.length,
    }, { state }));
  }
  for (const [index, candidateId] of outboundNeighborIds.entries()) {
    const entity = state.index.entitiesById.get(candidateId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: candidateId }, planEntityInsertion(canvasNodes, state.index, entity, {
      anchorEntityId: entityId,
      anchorDirection: 'right',
      insertionIndex: index,
      insertionCount: outboundNeighborIds.length,
    }, { state }));
  }
  for (const [index, candidateId] of mixedNeighborIds.entries()) {
    const entity = state.index.entitiesById.get(candidateId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(canvasNodes, { kind: 'entity', id: candidateId }, planEntityInsertion(canvasNodes, state.index, entity, {
      anchorEntityId: entityId,
      anchorDirection: 'around',
      insertionIndex: index,
      insertionCount: mixedNeighborIds.length,
    }, { state }));
  }

  for (const edge of neighborhood.edges) {
    if (!allowedRelationshipIds.has(edge.relationshipId)) {
      continue;
    }
    canvasEdges = upsertCanvasEdge(canvasEdges, {
      relationshipId: edge.relationshipId,
      fromEntityId: edge.fromEntityId,
      toEntityId: edge.toEntityId,
    });
  }

  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, entityId]),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
    graphExpansionActions: [...state.graphExpansionActions, {
      type: 'dependencies',
      entityId,
      direction,
      appliedAt: new Date().toISOString(),
    }],
    appliedViewpoint: null,
  };
}

export function removeEntityFromCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const canvasNodes = state.canvasNodes.filter((node) => !(node.kind === 'entity' && node.id === entityId));
  const canvasEdges = state.canvasEdges.filter((edge) => edge.fromEntityId !== entityId && edge.toEntityId !== entityId);
  const selectedEntityIds = state.selectedEntityIds.filter((current) => current !== entityId);
  const focusedElement = state.focusedElement?.kind === 'entity' && state.focusedElement.id === entityId ? null : state.focusedElement;
  const factsPanelMode = focusedElement ? state.factsPanelMode : 'hidden';
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds,
    focusedElement,
    factsPanelMode,
    appliedViewpoint: null,
  };
}

export function focusBrowserElement(state: BrowserSessionState, focusedElement: BrowserFocusedElement): BrowserSessionState {
  let factsPanelMode = state.factsPanelMode;
  if (!focusedElement) {
    factsPanelMode = 'hidden';
  } else if (focusedElement.kind === 'scope') {
    factsPanelMode = 'scope';
  } else if (focusedElement.kind === 'entity') {
    factsPanelMode = 'entity';
  } else {
    factsPanelMode = 'relationship';
  }
  return {
    ...state,
    focusedElement,
    factsPanelMode,
  };
}

export function openFactsPanel(state: BrowserSessionState, mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation): BrowserSessionState {
  return {
    ...state,
    factsPanelMode: mode,
    factsPanelLocation: location ?? state.factsPanelLocation,
  };
}

export function clearCanvas(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    canvasNodes: [],
    canvasEdges: [],
    canvasViewport: { ...state.canvasViewport, offsetX: 0, offsetY: 0 },
    fitViewRequestedAt: null,
  };
}

export function requestFitCanvasView(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function selectCanvasEntity(state: BrowserSessionState, entityId: string, additive = false): BrowserSessionState {
  if (!state.index?.entitiesById.has(entityId)) {
    return state;
  }
  return {
    ...state,
    selectedEntityIds: upsertSelectedEntityIds(state.selectedEntityIds, entityId, additive),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  };
}

export function isolateCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = state.selectedEntityIds.filter((entityId) => state.index?.entitiesById.has(entityId));
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : state.selectedScopeId;
  const allowedEntityIds = new Set(selectedEntityIds);
  const allowedScopeIds = new Set<string>();
  if (focusedScopeId && state.index?.scopesById.has(focusedScopeId)) {
    allowedScopeIds.add(focusedScopeId);
  }
  if (allowedEntityIds.size === 0 && allowedScopeIds.size === 0) {
    return state;
  }
  const canvasNodes = state.canvasNodes.filter((node) => node.kind === 'entity' ? allowedEntityIds.has(node.id) : allowedScopeIds.has(node.id));
  const canvasEdges = state.canvasEdges.filter((edge) => allowedEntityIds.has(edge.fromEntityId) && allowedEntityIds.has(edge.toEntityId));
  const focusedElement = state.focusedElement && ((state.focusedElement.kind === 'entity' && allowedEntityIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'scope' && allowedScopeIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'relationship' && canvasEdges.some((edge) => edge.relationshipId === state.focusedElement?.id)))
    ? state.focusedElement
    : (selectedEntityIds[0] ? { kind: 'entity' as const, id: selectedEntityIds[0] } : focusedScopeId ? { kind: 'scope' as const, id: focusedScopeId } : null);
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds,
    focusedElement,
    factsPanelMode: focusedElement ? focusedElement.kind === 'relationship' ? 'relationship' : focusedElement.kind : 'hidden',
  };
}

export function removeCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = new Set(state.selectedEntityIds);
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;
  const canvasNodes = state.canvasNodes.filter((node) => node.kind === 'entity' ? !selectedEntityIds.has(node.id) : node.id !== focusedScopeId);
  const canvasEdges = state.canvasEdges.filter((edge) => !selectedEntityIds.has(edge.fromEntityId) && !selectedEntityIds.has(edge.toEntityId));
  const focusedElement = state.focusedElement && ((state.focusedElement.kind === 'entity' && selectedEntityIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'scope' && state.focusedElement.id === focusedScopeId)) ? null : state.focusedElement;
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds: [],
    focusedElement,
    factsPanelMode: focusedElement ? state.factsPanelMode : 'hidden',
  };
}

export function setCanvasViewport(state: BrowserSessionState, viewport: Partial<BrowserCanvasViewport>): BrowserSessionState {
  return {
    ...state,
    canvasViewport: mergeCanvasViewport(state.canvasViewport, viewport),
  };
}

export function panCanvasViewport(state: BrowserSessionState, delta: { x: number; y: number }): BrowserSessionState {
  return setCanvasViewport(state, {
    offsetX: state.canvasViewport.offsetX + delta.x,
    offsetY: state.canvasViewport.offsetY + delta.y,
  });
}

export function moveCanvasNode(
  state: BrowserSessionState,
  node: { kind: BrowserCanvasNode['kind']; id: string },
  position: { x: number; y: number },
): BrowserSessionState {
  const existing = state.canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  if (!existing) {
    return state;
  }
  return {
    ...state,
    canvasNodes: upsertCanvasNode(state.canvasNodes, {
      kind: node.kind,
      id: node.id,
      x: position.x,
      y: position.y,
      manuallyPlaced: true,
    }),
    appliedViewpoint: null,
  };
}

export function toggleCanvasNodePin(state: BrowserSessionState, node: { kind: BrowserCanvasNode['kind']; id: string }): BrowserSessionState {
  const existing = state.canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  const nextPinned = !existing?.pinned;
  return {
    ...state,
    canvasNodes: upsertPinnedCanvasNode(state.canvasNodes, node.kind, node.id, nextPinned),
    appliedViewpoint: null,
  };
}

export function arrangeAllCanvasNodes(state: BrowserSessionState): BrowserSessionState {
  if (state.canvasNodes.length === 0) {
    return state;
  }
  return {
    ...state,
    canvasNodes: arrangeCanvasNodesInGrid(state.canvasNodes, { state }),
    canvasLayoutMode: 'grid',
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function arrangeCanvasAroundFocus(state: BrowserSessionState): BrowserSessionState {
  if (state.canvasNodes.length === 0) {
    return state;
  }
  if (state.focusedElement?.kind !== 'entity') {
    return arrangeAllCanvasNodes(state);
  }
  return {
    ...state,
    canvasNodes: arrangeCanvasNodesAroundEntityFocus(state.canvasNodes, state.canvasEdges, state.focusedElement.id, { state }),
    canvasLayoutMode: 'radial',
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function relayoutCanvas(state: BrowserSessionState): BrowserSessionState {
  return arrangeAllCanvasNodes(state);
}
