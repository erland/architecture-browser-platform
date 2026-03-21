import { planEntityInsertion } from './browserCanvasPlacement';
import type { BrowserDependencyDirection } from './browserSnapshotIndex';
import { getDependencyNeighborhood, getPrimaryEntitiesForScope } from './browserSnapshotIndex';
import type { BrowserSessionState } from './browserSessionStore.types';
import {
  uniqueValues,
  upsertCanvasEdge,
  upsertCanvasNode,
  planEntityNodePosition,
  planScopeNodePosition,
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
