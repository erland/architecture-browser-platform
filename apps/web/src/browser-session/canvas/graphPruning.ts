import type { BrowserCanvasEdge, BrowserSessionState } from '../model/types';
import {
  createCanvasMutationResult,
  withCanvasMutationSelectionRepair,
  type BrowserCanvasGraphPruningResult,
} from './canvasMutationResult';

function pruneCanvasEdgesByAllowedEntities(
  canvasEdges: BrowserCanvasEdge[],
  allowedEntityIds: Set<string>,
): BrowserCanvasEdge[] {
  return canvasEdges.filter(
    (edge) => allowedEntityIds.has(edge.fromEntityId) && allowedEntityIds.has(edge.toEntityId),
  );
}

export function pruneCanvasGraphForEntityRemoval(
  state: BrowserSessionState,
  entityId: string,
): BrowserCanvasGraphPruningResult {
  return withCanvasMutationSelectionRepair(
    createCanvasMutationResult(
      state.canvasNodes.filter((node) => !(node.kind === 'entity' && node.id === entityId)),
      state.canvasEdges.filter(
        (edge) => edge.fromEntityId !== entityId && edge.toEntityId !== entityId,
      ),
    ),
    {
      selectedEntityIds: state.selectedEntityIds.filter((current) => current !== entityId),
      focusedElement:
        state.focusedElement?.kind === 'entity' && state.focusedElement.id === entityId
          ? null
          : state.focusedElement,
    },
  );
}

export function pruneCanvasGraphForIsolation(
  state: BrowserSessionState,
): BrowserCanvasGraphPruningResult | null {
  const selectedEntityIds = state.selectedEntityIds.filter((entityId) => state.index?.entitiesById.has(entityId));
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : state.selectedScopeId;
  const allowedEntityIds = new Set(selectedEntityIds);
  const allowedScopeIds = new Set<string>();

  if (focusedScopeId && state.index?.scopesById.has(focusedScopeId)) {
    allowedScopeIds.add(focusedScopeId);
  }
  if (allowedEntityIds.size === 0 && allowedScopeIds.size === 0) {
    return null;
  }

  return withCanvasMutationSelectionRepair(
    createCanvasMutationResult(
      state.canvasNodes.filter((node) => (
        node.kind === 'entity' ? allowedEntityIds.has(node.id) : allowedScopeIds.has(node.id)
      )),
      pruneCanvasEdgesByAllowedEntities(state.canvasEdges, allowedEntityIds),
    ),
    {
      selectedEntityIds,
      fallbackScopeId: focusedScopeId,
    },
  );
}

export function pruneCanvasGraphForSelectionRemoval(
  state: BrowserSessionState,
): BrowserCanvasGraphPruningResult {
  const selectedEntityIds = new Set(state.selectedEntityIds);
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;

  return withCanvasMutationSelectionRepair(
    createCanvasMutationResult(
      state.canvasNodes.filter((node) => (
        node.kind === 'entity' ? !selectedEntityIds.has(node.id) : node.id !== focusedScopeId
      )),
      state.canvasEdges.filter(
        (edge) => !selectedEntityIds.has(edge.fromEntityId) && !selectedEntityIds.has(edge.toEntityId),
      ),
    ),
    {
      selectedEntityIds: [],
      focusedElement:
        state.focusedElement
        && ((state.focusedElement.kind === 'entity' && selectedEntityIds.has(state.focusedElement.id))
          || (state.focusedElement.kind === 'scope' && state.focusedElement.id === focusedScopeId))
          ? null
          : state.focusedElement,
    },
  );
}
