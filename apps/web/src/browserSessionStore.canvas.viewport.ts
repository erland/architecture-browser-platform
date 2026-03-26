import { arrangeCanvasNodesAroundEntityFocus, arrangeCanvasNodesInGrid } from './browser-canvas-placement';
import type { BrowserCanvasViewport, BrowserSessionState } from './browserSessionStore.types';



function clampCanvasZoom(zoom: number) {
  return Math.min(2.2, Math.max(0.35, Number.isFinite(zoom) ? zoom : 1));
}

function mergeCanvasViewport(current: BrowserCanvasViewport, viewport: Partial<BrowserCanvasViewport>): BrowserCanvasViewport {
  return {
    zoom: clampCanvasZoom(viewport.zoom ?? current.zoom),
    offsetX: viewport.offsetX ?? current.offsetX,
    offsetY: viewport.offsetY ?? current.offsetY,
  };
}

function withRouteRefresh(state: BrowserSessionState): BrowserSessionState {
  return {
    ...state,
    routeRefreshRequestedAt: new Date().toISOString(),
  };
}

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
  const nextState: BrowserSessionState = {
    ...state,
    canvasNodes: arrangeCanvasNodesInGrid(state.canvasNodes, { state }),
    canvasLayoutMode: 'grid',
    fitViewRequestedAt: new Date().toISOString(),
  };
  return withRouteRefresh(nextState);
}

export function arrangeCanvasAroundFocus(state: BrowserSessionState): BrowserSessionState {
  if (state.canvasNodes.length === 0) {
    return state;
  }
  if (state.focusedElement?.kind !== 'entity') {
    return arrangeAllCanvasNodes(state);
  }
  const nextState: BrowserSessionState = {
    ...state,
    canvasNodes: arrangeCanvasNodesAroundEntityFocus(state.canvasNodes, state.canvasEdges, state.focusedElement.id, { state }),
    canvasLayoutMode: 'radial',
    fitViewRequestedAt: new Date().toISOString(),
  };
  return withRouteRefresh(nextState);
}

export function relayoutCanvas(state: BrowserSessionState): BrowserSessionState {
  return arrangeAllCanvasNodes(state);
}
