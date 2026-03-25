import type {
  BrowserCanvasNode,
  BrowserFactsPanelLocation,
  BrowserFactsPanelMode,
  BrowserFocusedElement,
  BrowserSessionState,
} from './browserSessionStore.types';
import {
  upsertCanvasNode,
  upsertPinnedCanvasNode,
  upsertSelectedEntityIds,
} from './browserSessionStore.canvas.nodes';

export function removeEntityFromCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const canvasNodes = state.canvasNodes.filter((node) => !(node.kind === 'entity' && node.id === entityId));
  const canvasEdges = state.canvasEdges.filter((edge) => edge.fromEntityId !== entityId && edge.toEntityId !== entityId);
  const selectedEntityIds = state.selectedEntityIds.filter((current) => current !== entityId);
  const focusedElement = state.focusedElement?.kind === 'entity' && state.focusedElement.id === entityId ? null : state.focusedElement;
  const factsPanelMode = focusedElement ? state.factsPanelMode : 'hidden';
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds,
    focusedElement,
    factsPanelMode,
    appliedViewpoint: null,
  };
}

export function focusBrowserElement(state: BrowserSessionState, focusedElement: BrowserFocusedElement): BrowserSessionState {
  let factsPanelMode = state.factsPanelMode;
  if (!focusedElement) {
    factsPanelMode = 'hidden';
  } else if (focusedElement.kind === 'scope') {
    factsPanelMode = 'scope';
  } else if (focusedElement.kind === 'entity') {
    factsPanelMode = 'entity';
  } else {
    factsPanelMode = 'relationship';
  }
  return {
    ...state,
    focusedElement,
    factsPanelMode,
  };
}

export function openFactsPanel(state: BrowserSessionState, mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation): BrowserSessionState {
  return {
    ...state,
    factsPanelMode: mode,
    factsPanelLocation: location ?? state.factsPanelLocation,
  };
}

export function selectCanvasEntity(state: BrowserSessionState, entityId: string, additive = false): BrowserSessionState {
  if (!state.index?.entitiesById.has(entityId)) {
    return state;
  }
  return {
    ...state,
    selectedEntityIds: upsertSelectedEntityIds(state.selectedEntityIds, entityId, additive),
    focusedElement: { kind: 'entity', id: entityId },
    factsPanelMode: 'entity',
    appliedViewpoint: null,
  };
}

export function isolateCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = state.selectedEntityIds.filter((entityId) => state.index?.entitiesById.has(entityId));
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : state.selectedScopeId;
  const allowedEntityIds = new Set(selectedEntityIds);
  const allowedScopeIds = new Set<string>();
  if (focusedScopeId && state.index?.scopesById.has(focusedScopeId)) {
    allowedScopeIds.add(focusedScopeId);
  }
  if (allowedEntityIds.size === 0 && allowedScopeIds.size === 0) {
    return state;
  }
  const canvasNodes = state.canvasNodes.filter((node) => node.kind === 'entity' ? allowedEntityIds.has(node.id) : allowedScopeIds.has(node.id));
  const canvasEdges = state.canvasEdges.filter((edge) => allowedEntityIds.has(edge.fromEntityId) && allowedEntityIds.has(edge.toEntityId));
  const focusedElement = state.focusedElement && ((state.focusedElement.kind === 'entity' && allowedEntityIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'scope' && allowedScopeIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'relationship' && canvasEdges.some((edge) => edge.relationshipId === state.focusedElement?.id)))
    ? state.focusedElement
    : (selectedEntityIds[0] ? { kind: 'entity' as const, id: selectedEntityIds[0] } : focusedScopeId ? { kind: 'scope' as const, id: focusedScopeId } : null);
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds,
    focusedElement,
    factsPanelMode: focusedElement ? focusedElement.kind === 'relationship' ? 'relationship' : focusedElement.kind : 'hidden',
  };
}

export function removeCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const selectedEntityIds = new Set(state.selectedEntityIds);
  const focusedScopeId = state.focusedElement?.kind === 'scope' ? state.focusedElement.id : null;
  const canvasNodes = state.canvasNodes.filter((node) => node.kind === 'entity' ? !selectedEntityIds.has(node.id) : node.id !== focusedScopeId);
  const canvasEdges = state.canvasEdges.filter((edge) => !selectedEntityIds.has(edge.fromEntityId) && !selectedEntityIds.has(edge.toEntityId));
  const focusedElement = state.focusedElement && ((state.focusedElement.kind === 'entity' && selectedEntityIds.has(state.focusedElement.id)) || (state.focusedElement.kind === 'scope' && state.focusedElement.id === focusedScopeId)) ? null : state.focusedElement;
  return {
    ...state,
    canvasNodes,
    canvasEdges,
    selectedEntityIds: [],
    focusedElement,
    factsPanelMode: focusedElement ? state.factsPanelMode : 'hidden',
  };
}

export function moveCanvasNode(
  state: BrowserSessionState,
  node: { kind: BrowserCanvasNode['kind']; id: string },
  position: { x: number; y: number },
): BrowserSessionState {
  const existing = state.canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  if (!existing) {
    return state;
  }
  return {
    ...state,
    canvasNodes: upsertCanvasNode(state.canvasNodes, {
      kind: node.kind,
      id: node.id,
      x: position.x,
      y: position.y,
      manuallyPlaced: true,
    }),
    appliedViewpoint: null,
  };
}

export function toggleCanvasNodePin(state: BrowserSessionState, node: { kind: BrowserCanvasNode['kind']; id: string }): BrowserSessionState {
  const existing = state.canvasNodes.find((current) => current.kind === node.kind && current.id === node.id);
  const nextPinned = !existing?.pinned;
  return {
    ...state,
    canvasNodes: upsertPinnedCanvasNode(state.canvasNodes, node.kind, node.id, nextPinned),
    appliedViewpoint: null,
  };
}
