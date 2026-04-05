import type { BrowserClassPresentationMode, BrowserSessionState } from '../model/types';
import {
  applyCanvasNodeMutationToSession,
  applyPresentationAwareCanvasNodeMutationToSession,
} from './canvasMutationApplication';
import {
  setCanvasEntityClassPresentationModeInCollection,
  toggleCanvasEntityClassPresentationMembersInCollection,
} from './canvasNodeTransforms';

export function setCanvasEntityClassPresentationMode(
  state: BrowserSessionState,
  entityIds: string[],
  mode: BrowserClassPresentationMode,
): BrowserSessionState {
  const canvasNodes = setCanvasEntityClassPresentationModeInCollection(state.canvasNodes, entityIds, mode);
  return canvasNodes
    ? applyPresentationAwareCanvasNodeMutationToSession(state, canvasNodes)
    : state;
}

export function toggleCanvasEntityClassPresentationMembers(
  state: BrowserSessionState,
  entityIds: string[],
  memberKind: 'fields' | 'functions',
): BrowserSessionState {
  const canvasNodes = toggleCanvasEntityClassPresentationMembersInCollection(state.canvasNodes, entityIds, memberKind);
  return canvasNodes
    ? applyCanvasNodeMutationToSession(state, canvasNodes)
    : state;
}
