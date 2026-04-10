import type { BrowserSessionState } from '../../model/types';
import {
  createCanvasAssemblyResult,
  createCanvasMutationResult,
  type BrowserCanvasAssemblyResult,
} from '../canvasMutationResult';
import { planScopeNodePosition, upsertCanvasNode } from '../nodes';
import { syncMeaningfulCanvasEdges } from '../relationships';

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
