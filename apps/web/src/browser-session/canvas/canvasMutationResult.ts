import type {
  BrowserCanvasEdge,
  BrowserCanvasNode,
  BrowserFocusedElement,
  BrowserGraphExpansionAction,
} from '../model/types';

export type BrowserCanvasMutationSelectionRepair = {
  selectedEntityIds?: string[];
  focusedElement?: BrowserFocusedElement;
  fallbackScopeId?: string | null;
};

export type BrowserCanvasMutationResult = {
  canvasNodes: BrowserCanvasNode[];
  canvasEdges: BrowserCanvasEdge[];
};

export type BrowserCanvasGraphPruningResult = BrowserCanvasMutationResult & BrowserCanvasMutationSelectionRepair;

export type BrowserCanvasAssemblyResult = BrowserCanvasMutationResult & {
  selectedScopeId?: string | null;
  selectedEntityIds?: string[];
  focusEntityId?: string;
  validEntityIds?: string[];
  graphExpansionAction?: BrowserGraphExpansionAction;
};

export function createCanvasMutationResult(
  canvasNodes: BrowserCanvasNode[],
  canvasEdges: BrowserCanvasEdge[],
): BrowserCanvasMutationResult {
  return { canvasNodes, canvasEdges };
}

export function withCanvasMutationSelectionRepair(
  result: BrowserCanvasMutationResult,
  repair: BrowserCanvasMutationSelectionRepair,
): BrowserCanvasGraphPruningResult {
  return {
    ...result,
    ...repair,
  };
}

export function createCanvasAssemblyResult(
  result: BrowserCanvasMutationResult,
  options?: Omit<BrowserCanvasAssemblyResult, 'canvasNodes' | 'canvasEdges'>,
): BrowserCanvasAssemblyResult {
  return {
    ...result,
    ...options,
  };
}
