import type { BrowserSessionState } from '../model/types';
import { applyCanvasGraphPruningToSession } from './canvasMutationApplication';
import {
  pruneCanvasGraphForEntityRemoval,
  pruneCanvasGraphForIsolation,
  pruneCanvasGraphForSelectionRemoval,
} from './graphPruning';

export function removeEntityFromCanvas(state: BrowserSessionState, entityId: string): BrowserSessionState {
  const pruned = pruneCanvasGraphForEntityRemoval(state, entityId);
  return applyCanvasGraphPruningToSession(state, pruned);
}

export function isolateCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const pruned = pruneCanvasGraphForIsolation(state);
  if (!pruned) {
    return state;
  }
  return applyCanvasGraphPruningToSession(state, pruned);
}

export function removeCanvasSelection(state: BrowserSessionState): BrowserSessionState {
  const pruned = pruneCanvasGraphForSelectionRemoval(state);
  return applyCanvasGraphPruningToSession(state, pruned);
}
