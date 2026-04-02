import type { BrowserCanvasNode } from '../../../browser-session';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutResult,
} from '../../core/types';
import { getCanvasNodeByKey, getNodeById, orderLayoutComponents } from '../../shared/layoutShared';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import {
  createAutoLayoutPlacementBaseline,
  buildAutoLayoutResult,
} from '../../shared/browserAutoLayoutSupportShared';
import {
  hasFlowHardAnchors,
  placeFlowAnchoredComponentNodes,
  placeFlowFreeComponentNodes,
} from './flowLayoutPhases';

function placeComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  return hasFlowHardAnchors(component, nodeById, context.request)
    ? placeFlowAnchoredComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeFlowFreeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserFlowAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const { request, graph } = context;
  const nodeById = getNodeById(graph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);
  const baseline = createAutoLayoutPlacementBaseline(request);

  let arranged = baseline.arranged;
  let nextOriginY = baseline.initialOrigin.y;
  for (const component of orderLayoutComponents(graph, nodeById)) {
    const placement = placeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, nextOriginY);
    arranged = placement.arranged;
    nextOriginY = placement.nextOriginY;
  }

  return buildAutoLayoutResult(context, 'flow', arranged);
}
