import type { BrowserDependencyDirection } from '../../browser-snapshot';
import { getPrimaryEntitiesForScope } from '../../browser-snapshot';
import type { BrowserSessionState } from '../model/types';
import {
  assembleDependencyCanvasExpansion,
  assembleEntitiesCanvasAddition,
  assembleEntityCanvasAddition,
  assembleScopeCanvasAddition,
} from './canvasContentAssembly';
import {
  applyDependencyCanvasAssemblyToSession,
  applyEntitiesCanvasAssemblyToSession,
  applyEntityCanvasAssemblyToSession,
  applyScopeCanvasAssemblyToSession,
} from './canvasMutationApplication';

export function addEntityToCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const assembled = assembleEntityCanvasAddition(state, entityId);
  if (!assembled) {
    return state;
  }
  return applyEntityCanvasAssemblyToSession(state, assembled);
}

export function addEntitiesToCanvas(state: BrowserSessionState, entityIds: string[]): BrowserSessionState {
  const assembled = assembleEntitiesCanvasAddition(state, entityIds);
  if (!assembled) {
    return state;
  }

  return applyEntitiesCanvasAssemblyToSession(state, assembled);
}

export function addPrimaryEntitiesForScope(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  if (!state.index?.scopesById.has(scopeId)) {
    return state;
  }
  const primaryEntityIds = getPrimaryEntitiesForScope(state.index, scopeId).map((entity) => entity.externalId);
  if (primaryEntityIds.length === 0) {
    return state;
  }
  const nextState = addEntitiesToCanvas(state, primaryEntityIds);
  return {
    ...nextState,
    selectedScopeId: scopeId,
  };
}

export function addScopeToCanvas(state: BrowserSessionState, scopeId: string): BrowserSessionState {
  const assembled = assembleScopeCanvasAddition(state, scopeId);
  if (!assembled) {
    return state;
  }
  return applyScopeCanvasAssemblyToSession(state, scopeId, assembled);
}

export function addDependenciesToCanvas(state: BrowserSessionState, entityId: string, direction: BrowserDependencyDirection = 'ALL'): BrowserSessionState {
  const assembled = assembleDependencyCanvasExpansion(state, entityId, direction);
  if (!assembled) {
    return state;
  }

  return applyDependencyCanvasAssemblyToSession(state, entityId, assembled);
}
