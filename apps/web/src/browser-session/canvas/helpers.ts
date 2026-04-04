import { planEntityInsertion } from '../../browser-canvas-placement';
import type { BrowserCanvasNode, BrowserSessionState } from '../model/types';
import { uniqueValues } from '../model/collections';
import { upsertCanvasNode } from './nodes';

export function createEntityCanvasFocusState(state: BrowserSessionState, entityId: string, selectedScopeId?: string | null) {
  return {
    selectedScopeId: selectedScopeId ?? state.selectedScopeId,
    selectedEntityIds: uniqueValues([...state.selectedEntityIds, entityId]),
    focusedElement: { kind: 'entity' as const, id: entityId },
    factsPanelMode: 'entity' as const,
    appliedViewpoint: null,
  };
}

export function splitDependencyNeighborIds(
  candidateIds: string[],
  inboundEntityIds: string[],
  outboundEntityIds: string[],
) {
  const inboundNeighborIds = candidateIds.filter((candidateId) => inboundEntityIds.includes(candidateId));
  const outboundNeighborIds = candidateIds.filter((candidateId) => outboundEntityIds.includes(candidateId));
  const mixedNeighborIds = candidateIds.filter((candidateId) => !inboundNeighborIds.includes(candidateId) && !outboundNeighborIds.includes(candidateId));
  return {
    inboundNeighborIds,
    outboundNeighborIds,
    mixedNeighborIds,
  };
}

export function insertAnchoredEntities(
  state: BrowserSessionState,
  canvasNodes: BrowserCanvasNode[],
  entityIds: string[],
  anchorEntityId: string,
  anchorDirection: 'around' | 'left' | 'right',
): BrowserCanvasNode[] {
  let nextCanvasNodes = [...canvasNodes];
  for (const [index, candidateId] of entityIds.entries()) {
    const entity = state.index?.entitiesById.get(candidateId);
    if (!entity || !state.index) {
      continue;
    }
    nextCanvasNodes = upsertCanvasNode(
      nextCanvasNodes,
      { kind: 'entity', id: candidateId },
      planEntityInsertion(nextCanvasNodes, state.index, entity, {
        anchorEntityId,
        anchorDirection,
        insertionIndex: index,
        insertionCount: entityIds.length,
      }, { state }),
    );
  }
  return nextCanvasNodes;
}
