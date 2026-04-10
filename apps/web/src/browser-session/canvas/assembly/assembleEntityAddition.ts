import type { BrowserSessionState } from '../../model/types';
import {
  createCanvasAssemblyResult,
  createCanvasMutationResult,
  type BrowserCanvasAssemblyResult,
} from '../canvasMutationResult';
import { planEntityNodePosition, upsertCanvasNode } from '../nodes';
import { syncMeaningfulCanvasEdges } from '../../../browser-graph/semantics';
import { createEntityNodePatch } from './shared';

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
