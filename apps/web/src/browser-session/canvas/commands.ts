import { planEntityInsertion } from '../../browser-canvas-placement';
import type { BrowserDependencyDirection } from '../../browser-snapshot';
import { getDependencyNeighborhood, getPrimaryEntitiesForScope } from '../../browser-snapshot';
import type { BrowserSessionState } from '../browserSessionStore.types';
import { uniqueValues } from '../browserSessionStore.collections';
import { syncMeaningfulCanvasEdges } from './relationships';
import {
  planEntityNodePosition,
  planScopeNodePosition,
  upsertCanvasEdge,
  upsertCanvasNode,
} from './nodes';
import {
  createEntityCanvasFocusState,
  insertAnchoredEntities,
  splitDependencyNeighborIds,
} from './helpers';

export function addEntityToCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const entity = state.index?.entitiesById.get(entityId);
  if (!entity) {
    return state;
  }
  const canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'entity', id: entityId }, planEntityNodePosition(state, entityId));
  const canvasEdges = syncMeaningfulCanvasEdges(state, canvasNodes);
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    ...createEntityCanvasFocusState(state, entityId),
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
  const canvasEdges = syncMeaningfulCanvasEdges(state, canvasNodes);
  return {
    ...state,
    canvasNodes,
    canvasEdges,
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
  const canvasNodes = upsertCanvasNode(state.canvasNodes, { kind: 'scope', id: scopeId }, planScopeNodePosition(state, scopeId));
  return {
    ...state,
    canvasNodes,
    canvasEdges: syncMeaningfulCanvasEdges(state, canvasNodes),
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
  const { inboundNeighborIds, outboundNeighborIds, mixedNeighborIds } = splitDependencyNeighborIds(
    neighborsToInsert,
    neighborhood.inboundEntityIds,
    neighborhood.outboundEntityIds,
  );

  canvasNodes = insertAnchoredEntities(state, canvasNodes, inboundNeighborIds, entityId, 'left');
  canvasNodes = insertAnchoredEntities(state, canvasNodes, outboundNeighborIds, entityId, 'right');
  canvasNodes = insertAnchoredEntities(state, canvasNodes, mixedNeighborIds, entityId, 'around');

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
    canvasEdges: syncMeaningfulCanvasEdges({ ...state, canvasEdges }, canvasNodes),
    ...createEntityCanvasFocusState(state, entityId),
    graphExpansionActions: [...state.graphExpansionActions, {
      type: 'dependencies',
      entityId,
      direction,
      appliedAt: new Date().toISOString(),
    }],
  };
}
