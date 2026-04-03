import type { BrowserCanvasNode } from '../../browser-session';
import { getCanvasNodeByKey, getNodeById, orderLayoutComponents } from './layoutShared';
import { createAutoLayoutPlacementBaseline } from './browserAutoLayoutSupportShared';
import type { BrowserAutoLayoutComponent, BrowserAutoLayoutNode } from '../core/types';
import type { BrowserAutoLayoutPipelineContext } from '../core/pipeline';

export type BrowserAutoLayoutComponentPlacementState = {
  arranged: BrowserCanvasNode[];
  nextOriginX: number;
  nextOriginY: number;
};

export type BrowserAutoLayoutComponentPlacementEnvironment = {
  context: BrowserAutoLayoutPipelineContext;
  nodeById: Map<string, BrowserAutoLayoutNode>;
  canvasNodeByKey: Map<string, BrowserCanvasNode>;
};

export type BrowserAutoLayoutComponentPlacementArgs = BrowserAutoLayoutComponentPlacementEnvironment & {
  component: BrowserAutoLayoutComponent;
  state: BrowserAutoLayoutComponentPlacementState;
};

export type BrowserAutoLayoutComponentPlacementResult = {
  arranged: BrowserCanvasNode[];
  nextOriginY: number;
  nextOriginX?: number;
};

export type BrowserAutoLayoutComponentPipelineOptions = {
  context: BrowserAutoLayoutPipelineContext;
  enableOrderingHeuristics?: boolean;
  includeComponent?: (args: BrowserAutoLayoutComponentPlacementEnvironment & { component: BrowserAutoLayoutComponent }) => boolean;
  placeComponent: (args: BrowserAutoLayoutComponentPlacementArgs) => BrowserAutoLayoutComponentPlacementResult;
};

export function createBrowserAutoLayoutComponentPlacementEnvironment(
  context: BrowserAutoLayoutPipelineContext,
): BrowserAutoLayoutComponentPlacementEnvironment {
  return {
    context,
    nodeById: getNodeById(context.graph),
    canvasNodeByKey: getCanvasNodeByKey(context.request.nodes),
  };
}

export function createBrowserAutoLayoutComponentPlacementState(
  context: BrowserAutoLayoutPipelineContext,
): BrowserAutoLayoutComponentPlacementState {
  const baseline = createAutoLayoutPlacementBaseline(context.request);
  return {
    arranged: baseline.arranged,
    nextOriginX: baseline.initialOrigin.x,
    nextOriginY: baseline.initialOrigin.y,
  };
}

export function runBrowserAutoLayoutComponentPipeline(
  options: BrowserAutoLayoutComponentPipelineOptions,
): BrowserAutoLayoutComponentPlacementState {
  const environment = createBrowserAutoLayoutComponentPlacementEnvironment(options.context);
  const orderedComponents = orderLayoutComponents(
    options.context.graph,
    environment.nodeById,
    options.enableOrderingHeuristics,
  );

  let state = createBrowserAutoLayoutComponentPlacementState(options.context);
  for (const component of orderedComponents) {
    if (options.includeComponent && !options.includeComponent({ ...environment, component })) {
      continue;
    }
    const placement = options.placeComponent({
      ...environment,
      component,
      state,
    });
    state = {
      arranged: placement.arranged,
      nextOriginX: placement.nextOriginX ?? state.nextOriginX,
      nextOriginY: placement.nextOriginY,
    };
  }

  return state;
}
