import type {
  BrowserCanvasNode,
  BrowserSessionState,
} from '../model/types';
import {
  moveCanvasNodeInCollection,
  reconcileCanvasNodePositionsInCollection,
  toggleCanvasNodePinInCollection,
} from './canvasNodeTransforms';
import {
  applyCanvasNodeMutationToSession,
  applyPresentationAwareCanvasNodeMutationToSession,
} from './canvasMutationApplication';

export function moveCanvasNode(
  state: BrowserSessionState,
  node: { kind: BrowserCanvasNode['kind']; id: string },
  position: { x: number; y: number },
): BrowserSessionState {
  const canvasNodes = moveCanvasNodeInCollection(state.canvasNodes, node, position);
  return canvasNodes
    ? applyCanvasNodeMutationToSession(state, canvasNodes)
    : state;
}

export function reconcileCanvasNodePositions(
  state: BrowserSessionState,
  updates: Array<{ kind: BrowserCanvasNode['kind']; id: string; x?: number; y?: number }>,
): BrowserSessionState {
  const canvasNodes = reconcileCanvasNodePositionsInCollection(state.canvasNodes, updates);
  return canvasNodes
    ? applyPresentationAwareCanvasNodeMutationToSession(state, canvasNodes)
    : state;
}

export function toggleCanvasNodePin(state: BrowserSessionState, node: { kind: BrowserCanvasNode['kind']; id: string }): BrowserSessionState {
  return applyCanvasNodeMutationToSession(
    state,
    toggleCanvasNodePinInCollection(state.canvasNodes, node),
  );
}
