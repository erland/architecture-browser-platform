import type { BrowserCanvasNode, BrowserSessionState } from '../model/types';
import type {
  BrowserCanvasAssemblyResult,
  BrowserCanvasGraphPruningResult,
} from './canvasMutationResult';
import { createEntityCanvasFocusState } from './helpers';
import {
  finalizeCanvasNodeMutation,
  finalizePresentationAwareCanvasNodeMutation,
  normalizeCanvasMutationContext,
} from './postMutation';

function applyCanvasAssemblyResult(
  state: BrowserSessionState,
  assembled: BrowserCanvasAssemblyResult,
  focusPatch?: Partial<BrowserSessionState>,
): BrowserSessionState {
  return {
    ...state,
    canvasNodes: assembled.canvasNodes,
    canvasEdges: assembled.canvasEdges,
    ...(assembled.selectedScopeId !== undefined ? { selectedScopeId: assembled.selectedScopeId } : {}),
    ...(assembled.selectedEntityIds ? { selectedEntityIds: assembled.selectedEntityIds } : {}),
    ...focusPatch,
  };
}

export function applyEntityCanvasAssemblyToSession(
  state: BrowserSessionState,
  assembled: BrowserCanvasAssemblyResult,
): BrowserSessionState {
  return applyCanvasAssemblyResult(
    state,
    assembled,
    createEntityCanvasFocusState(state, assembled.focusEntityId!, assembled.selectedScopeId),
  );
}

export function applyEntitiesCanvasAssemblyToSession(
  state: BrowserSessionState,
  assembled: BrowserCanvasAssemblyResult,
): BrowserSessionState {
  return applyCanvasAssemblyResult(state, assembled, {
    selectedEntityIds: assembled.selectedEntityIds,
    focusedElement: { kind: 'entity', id: assembled.focusEntityId! },
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  });
}

export function applyScopeCanvasAssemblyToSession(
  state: BrowserSessionState,
  scopeId: string,
  assembled: BrowserCanvasAssemblyResult,
): BrowserSessionState {
  return applyCanvasAssemblyResult(state, assembled, {
    focusedElement: { kind: 'scope', id: scopeId },
    factsPanelMode: 'scope',
    appliedViewpoint: null,
  });
}

export function applyDependencyCanvasAssemblyToSession(
  state: BrowserSessionState,
  entityId: string,
  assembled: BrowserCanvasAssemblyResult,
): BrowserSessionState {
  return applyCanvasAssemblyResult(state, assembled, {
    ...createEntityCanvasFocusState(state, entityId),
    graphExpansionActions: assembled.graphExpansionAction
      ? [...state.graphExpansionActions, assembled.graphExpansionAction]
      : state.graphExpansionActions,
  });
}

export function applyCanvasGraphPruningToSession(
  state: BrowserSessionState,
  pruned: BrowserCanvasGraphPruningResult,
): BrowserSessionState {
  return normalizeCanvasMutationContext(state, {
    canvasNodes: pruned.canvasNodes,
    canvasEdges: pruned.canvasEdges,
  }, {
    selectedEntityIds: pruned.selectedEntityIds,
    focusedElement: pruned.focusedElement,
    fallbackScopeId: pruned.fallbackScopeId,
  });
}

export function applyCanvasNodeMutationToSession(
  state: BrowserSessionState,
  canvasNodes: BrowserCanvasNode[],
): BrowserSessionState {
  return finalizeCanvasNodeMutation(state, canvasNodes);
}

export function applyPresentationAwareCanvasNodeMutationToSession(
  state: BrowserSessionState,
  canvasNodes: BrowserCanvasNode[],
): BrowserSessionState {
  return finalizePresentationAwareCanvasNodeMutation(state, canvasNodes);
}
