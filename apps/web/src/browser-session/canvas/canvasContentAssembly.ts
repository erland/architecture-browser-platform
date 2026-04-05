import { planEntityInsertion } from '../../browser-canvas-placement';
import { resolveBrowserStateViewpointPresentationPolicy } from '../../browser-graph/presentation';
import type { BrowserDependencyDirection } from '../../browser-snapshot';
import { getDependencyNeighborhood } from '../../browser-snapshot';
import type { BrowserCanvasNode, BrowserSessionState } from '../model/types';
import { createCanvasEntityClassPresentationFromViewpointPolicy } from '../model/classPresentation';
import { uniqueValues } from '../model/collections';
import {
  createCanvasAssemblyResult,
  createCanvasMutationResult,
  type BrowserCanvasAssemblyResult,
} from './canvasMutationResult';
import {
  insertAnchoredEntities,
  splitDependencyNeighborIds,
} from './helpers';
import {
  planEntityNodePosition,
  planScopeNodePosition,
  upsertCanvasEdge,
  upsertCanvasNode,
} from './nodes';
import { syncMeaningfulCanvasEdges } from './relationships';

function collectValidEntityIds(state: BrowserSessionState, entityIds: string[]): string[] {
  if (!state.index) {
    return [];
  }
  return [...new Set(entityIds)].filter((entityId) => state.index?.entitiesById.has(entityId));
}

function createEntityNodePatch(
  state: BrowserSessionState,
  entityId: string,
  options?: { pinned?: boolean },
): Pick<BrowserCanvasNode, 'kind' | 'id' | 'pinned' | 'classPresentation'> {
  const presentationPolicy = resolveBrowserStateViewpointPresentationPolicy(state);
  return {
    kind: 'entity',
    id: entityId,
    pinned: options?.pinned,
    classPresentation: createCanvasEntityClassPresentationFromViewpointPolicy(entityId, state.index, presentationPolicy),
  };
}

export function assembleEntityCanvasAddition(
  state: BrowserSessionState,
  entityId: string,
): BrowserCanvasAssemblyResult | null {
  const entity = state.index?.entitiesById.get(entityId);
  if (!entity) {
    return null;
  }

  const canvasNodes = upsertCanvasNode(
    state.canvasNodes,
    createEntityNodePatch(state, entityId),
    planEntityNodePosition(state, entityId),
  );

  return createCanvasAssemblyResult(
    createCanvasMutationResult(canvasNodes, syncMeaningfulCanvasEdges(state, canvasNodes)),
    {
      selectedScopeId: entity.scopeId ?? state.selectedScopeId,
      focusEntityId: entityId,
    },
  );
}

export function assembleEntitiesCanvasAddition(
  state: BrowserSessionState,
  entityIds: string[],
): BrowserCanvasAssemblyResult | null {
  if (!state.index) {
    return null;
  }

  const validEntityIds = collectValidEntityIds(state, entityIds);
  if (validEntityIds.length === 0) {
    return null;
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
      createEntityNodePatch(state, entityId),
      planEntityInsertion(canvasNodes, state.index, entity, {
        anchorEntityId,
        selectedScopeId: state.selectedScopeId,
        insertionIndex: index,
        insertionCount: validEntityIds.length,
      }, { state }),
    );
  }

  const focusEntityId = validEntityIds[0];
  return createCanvasAssemblyResult(
    createCanvasMutationResult(canvasNodes, syncMeaningfulCanvasEdges(state, canvasNodes)),
    {
      selectedScopeId: state.index.entitiesById.get(focusEntityId)?.scopeId ?? state.selectedScopeId,
      selectedEntityIds: uniqueValues([...state.selectedEntityIds, ...validEntityIds]),
      focusEntityId,
      validEntityIds,
    },
  );
}

export function assembleScopeCanvasAddition(
  state: BrowserSessionState,
  scopeId: string,
): BrowserCanvasAssemblyResult | null {
  if (!state.index?.scopesById.has(scopeId)) {
    return null;
  }

  const canvasNodes = upsertCanvasNode(
    state.canvasNodes,
    { kind: 'scope', id: scopeId },
    planScopeNodePosition(state, scopeId),
  );

  return createCanvasAssemblyResult(
    createCanvasMutationResult(canvasNodes, syncMeaningfulCanvasEdges(state, canvasNodes)),
  );
}

export function assembleDependencyCanvasExpansion(
  state: BrowserSessionState,
  entityId: string,
  direction: BrowserDependencyDirection = 'ALL',
): BrowserCanvasAssemblyResult | null {
  if (!state.index?.entitiesById.has(entityId)) {
    return null;
  }

  const neighborhood = getDependencyNeighborhood(state.index, entityId, direction);
  if (!neighborhood) {
    return null;
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

  let canvasNodes = upsertCanvasNode(
    state.canvasNodes,
    createEntityNodePatch(state, entityId, { pinned: true }),
    planEntityNodePosition(state, entityId),
  );
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

  return createCanvasAssemblyResult(
    createCanvasMutationResult(canvasNodes, syncMeaningfulCanvasEdges({ ...state, canvasEdges }, canvasNodes)),
    {
      graphExpansionAction: {
        type: 'dependencies',
        entityId,
        direction,
        appliedAt: new Date().toISOString(),
      },
    },
  );
}
