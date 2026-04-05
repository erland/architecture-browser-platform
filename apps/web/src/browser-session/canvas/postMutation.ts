import type {
  BrowserCanvasEdge,
  BrowserCanvasNode,
  BrowserFocusedElement,
  BrowserSessionState,
} from '../model/types';
import { normalizeFocusedBrowserContext } from '../navigation/invariants';

type BrowserSessionCanvasPatch = Partial<Pick<BrowserSessionState,
  | 'canvasNodes'
  | 'canvasEdges'
  | 'selectedEntityIds'
  | 'focusedElement'
  | 'factsPanelMode'
  | 'routeRefreshRequestedAt'>>;

export function clearAppliedViewpoint(
  state: BrowserSessionState,
  patch: BrowserSessionCanvasPatch,
): BrowserSessionState {
  return {
    ...state,
    ...patch,
    appliedViewpoint: null,
  };
}

export function requestConservativePresentationRefresh(
  state: BrowserSessionState,
  patch: BrowserSessionCanvasPatch,
): BrowserSessionState {
  return clearAppliedViewpoint(state, {
    ...patch,
    routeRefreshRequestedAt: new Date().toISOString(),
  });
}

export function normalizeCanvasMutationContext(
  state: BrowserSessionState,
  patch: Pick<BrowserSessionState, 'canvasNodes' | 'canvasEdges'>,
  options?: {
    selectedEntityIds?: string[];
    focusedElement?: BrowserFocusedElement;
    fallbackScopeId?: string | null;
  },
): BrowserSessionState {
  const nextState = clearAppliedViewpoint(state, patch);
  return {
    ...nextState,
    ...normalizeFocusedBrowserContext(nextState, {
      selectedEntityIds: options?.selectedEntityIds,
      focusedElement: options?.focusedElement,
      fallbackScopeId: options?.fallbackScopeId,
    }),
  };
}

export function finalizeCanvasNodeMutation(
  state: BrowserSessionState,
  canvasNodes: BrowserCanvasNode[],
): BrowserSessionState {
  return clearAppliedViewpoint(state, { canvasNodes });
}

export function finalizePresentationAwareCanvasNodeMutation(
  state: BrowserSessionState,
  canvasNodes: BrowserCanvasNode[],
): BrowserSessionState {
  return requestConservativePresentationRefresh(state, { canvasNodes });
}

export function finalizeCanvasGraphMutation(
  state: BrowserSessionState,
  canvasNodes: BrowserCanvasNode[],
  canvasEdges: BrowserCanvasEdge[],
): BrowserSessionState {
  return clearAppliedViewpoint(state, {
    canvasNodes,
    canvasEdges,
  });
}
