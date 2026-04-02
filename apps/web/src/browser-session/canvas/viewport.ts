import { arrangeCanvasNodesAroundEntityFocus } from '../../browser-canvas-placement';
import { runBrowserAutoLayout } from '../../browser-auto-layout';
import type { BrowserAutoLayoutMode } from '../../browser-auto-layout';
import type { BrowserCanvasViewport, BrowserSessionState } from '../model/types';



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

function arrangeCanvasNodesWithResolvedMode(state: BrowserSessionState, mode: BrowserAutoLayoutMode = 'structure', configOverride?: { manualNodesAreHardAnchors?: boolean }): BrowserSessionState {
  if (state.canvasNodes.length === 0) {
    return state;
  }
  const layoutResult = runBrowserAutoLayout({
    mode,
    nodes: state.canvasNodes,
    edges: state.canvasEdges,
    options: { state },
    state,
    config: configOverride,
  });
  const nextState: BrowserSessionState = {
    ...state,
    canvasNodes: layoutResult.nodes,
    canvasLayoutMode: layoutResult.canvasLayoutMode,
    fitViewRequestedAt: new Date().toISOString(),
  };
  return withRouteRefresh(nextState);
}


export function arrangeCanvasNodesWithMode(state: BrowserSessionState, mode: BrowserAutoLayoutMode = 'structure'): BrowserSessionState {
  return arrangeCanvasNodesWithResolvedMode(state, mode);
}

export function arrangeCanvasNodesInteractivelyWithMode(state: BrowserSessionState, mode: BrowserAutoLayoutMode = 'structure'): BrowserSessionState {
  return arrangeCanvasNodesWithResolvedMode(state, mode, { manualNodesAreHardAnchors: false });
}

export function arrangeAllCanvasNodes(state: BrowserSessionState): BrowserSessionState {
  return arrangeCanvasNodesWithMode(state, 'structure');
}

export function arrangeAllCanvasNodesInteractive(state: BrowserSessionState): BrowserSessionState {
  return arrangeCanvasNodesInteractivelyWithMode(state, 'structure');
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
  return arrangeCanvasNodesInteractivelyWithMode(state, state.canvasLayoutMode === 'flow' || state.canvasLayoutMode === 'hierarchy' || state.canvasLayoutMode === 'balanced' ? state.canvasLayoutMode : 'structure');
}
