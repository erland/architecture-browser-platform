import { planEntityInsertion } from '../../../browser-canvas-placement';
import type { BrowserSessionState } from '../../model/types';
import { uniqueValues } from '../../model/collections';
import {
  createCanvasAssemblyResult,
  createCanvasMutationResult,
  type BrowserCanvasAssemblyResult,
} from '../canvasMutationResult';
import { upsertCanvasNode } from '../nodes';
import { syncMeaningfulCanvasEdges } from '../../../browser-graph/semantics';
import { collectValidEntityIds, createEntityNodePatch } from './shared';

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
      planEntityInsertion(
        canvasNodes,
        state.index,
        entity,
        {
          anchorEntityId,
          selectedScopeId: state.selectedScopeId,
          insertionIndex: index,
          insertionCount: validEntityIds.length,
        },
        { state },
      ),
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
