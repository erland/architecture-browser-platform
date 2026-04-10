import type { BrowserDependencyDirection } from '../../../browser-snapshot';
import { getDependencyNeighborhood } from '../../../browser-snapshot';
import type { BrowserSessionState } from '../../model/types';
import {
  createCanvasAssemblyResult,
  createCanvasMutationResult,
  type BrowserCanvasAssemblyResult,
} from '../canvasMutationResult';
import { insertAnchoredEntities, splitDependencyNeighborIds } from '../helpers';
import { planEntityNodePosition, upsertCanvasEdge, upsertCanvasNode } from '../nodes';
import { syncMeaningfulCanvasEdges } from '../relationships';
import { createEntityNodePatch } from './shared';

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
  const neighborsToInsert = [...new Set(
    neighborhood.edges
      .filter((edge) => allowedRelationshipIds.has(edge.relationshipId))
      .flatMap((edge) => [edge.fromEntityId, edge.toEntityId])
      .filter((candidateId) => candidateId !== entityId),
  )];
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
