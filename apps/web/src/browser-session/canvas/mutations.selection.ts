import type {
  BrowserFocusedElement,
  BrowserSessionState,
} from '../model/types';
import { upsertSelectedEntityIds } from './nodes';
import { deriveFactsPanelModeFromFocus } from '../navigation/invariants';

export function focusBrowserElement(state: BrowserSessionState, focusedElement: BrowserFocusedElement): BrowserSessionState {
  return {
    ...state,
    focusedElement,
    factsPanelMode: deriveFactsPanelModeFromFocus(focusedElement, state.factsPanelMode),
  };
}

export function selectCanvasEntity(state: BrowserSessionState, entityId: string, additive = false): BrowserSessionState {
  const entity = state.index?.entitiesById.get(entityId);
  if (!entity) {
    return state;
  }
  return {
    ...state,
    selectedScopeId: entity.scopeId ?? state.selectedScopeId,
    selectedEntityIds: upsertSelectedEntityIds(state.selectedEntityIds, entityId, additive),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  };
}

export function clearCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  if (state.selectedEntityIds.length === 0 && !state.focusedElement) {
    return state;
  }
  return {
    ...state,
    selectedEntityIds: [],
    focusedElement: null,
    factsPanelMode: 'hidden',
    appliedViewpoint: null,
  };
}

export function selectAllCanvasEntities(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = state.canvasNodes
    .filter((node) => node.kind === 'entity')
    .map((node) => node.id)
    .filter((entityId) => state.index?.entitiesById.has(entityId));
  if (selectedEntityIds.length === 0) {
    return state;
  }
  const focusEntityId = state.focusedElement?.kind === 'entity' && selectedEntityIds.includes(state.focusedElement.id)
    ? state.focusedElement.id
    : selectedEntityIds[0];
  const focusedEntity = focusEntityId ? { kind: 'entity' as const, id: focusEntityId } : state.focusedElement;
  return {
    ...state,
    selectedEntityIds,
    focusedElement: focusedEntity,
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  };
}
