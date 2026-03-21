import { arrangeCanvasNodesAroundEntityFocus, arrangeCanvasNodesInGrid } from './browserCanvasPlacement';
import type { BrowserCanvasViewport, BrowserSessionState } from './browserSessionStore.types';
import { mergeCanvasViewport } from './browserSessionStore.utils';

export function clearCanvas(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    canvasNodes: [],
    canvasEdges: [],
    canvasViewport: { ...state.canvasViewport, offsetX: 0, offsetY: 0 },
    fitViewRequestedAt: null,
  };
}

export function requestFitCanvasView(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function setCanvasViewport(state: BrowserSessionState, viewport: Partial<BrowserCanvasViewport>): BrowserSessionState {
  return {
    ...state,
    canvasViewport: mergeCanvasViewport(state.canvasViewport, viewport),
  };
}

export function panCanvasViewport(state: BrowserSessionState, delta: { x: number; y: number }): BrowserSessionState {
  return setCanvasViewport(state, {
    offsetX: state.canvasViewport.offsetX + delta.x,
    offsetY: state.canvasViewport.offsetY + delta.y,
  });
}

export function arrangeAllCanvasNodes(state: BrowserSessionState): BrowserSessionState {
  if (state.canvasNodes.length === 0) {
    return state;
  }
  return {
    ...state,
    canvasNodes: arrangeCanvasNodesInGrid(state.canvasNodes, { state }),
    canvasLayoutMode: 'grid',
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function arrangeCanvasAroundFocus(state: BrowserSessionState): BrowserSessionState {
  if (state.canvasNodes.length === 0) {
    return state;
  }
  if (state.focusedElement?.kind !== 'entity') {
    return arrangeAllCanvasNodes(state);
  }
  return {
    ...state,
    canvasNodes: arrangeCanvasNodesAroundEntityFocus(state.canvasNodes, state.canvasEdges, state.focusedElement.id, { state }),
    canvasLayoutMode: 'radial',
    fitViewRequestedAt: new Date().toISOString(),
  };
}

export function relayoutCanvas(state: BrowserSessionState): BrowserSessionState {
  return arrangeAllCanvasNodes(state);
}
