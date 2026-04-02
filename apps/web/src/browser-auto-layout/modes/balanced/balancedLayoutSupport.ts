import type { BrowserCanvasNode } from '../../../browserSessionStore.types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutResult,
} from '../../core/types';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from '../../core/config';
import { getCanvasNodeByKey, getEntityComponentNodes, getNodeById, orderLayoutComponents } from '../../shared/layoutShared';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import {
  createAutoLayoutPlacementBaseline,
  buildAutoLayoutResult,
} from '../../shared/browserAutoLayoutSupportShared';
import {
  placeBalancedAnchoredComponentNodes,
  placeBalancedFreeComponentNodes,
} from './balancedLayoutPhases';

function placeComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request } = context;
  const hasHardAnchors = getEntityComponentNodes(component, nodeById)
    .some((node) => isHardAnchorCanvasNode(node, getBrowserAutoLayoutConfig(request)));

  return hasHardAnchors
    ? placeBalancedAnchoredComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeBalancedFreeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserBalancedAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const { request, graph } = context;
  const nodeById = getNodeById(graph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);
  const baseline = createAutoLayoutPlacementBaseline(request);

  let arranged = baseline.arranged;
  let nextOriginY = baseline.initialOrigin.y;

  for (const component of orderLayoutComponents(graph, nodeById, getBrowserAutoLayoutConfig(request).enableOrderingHeuristics)) {
    const placement = placeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, nextOriginY);
    arranged = placement.arranged;
    nextOriginY = placement.nextOriginY;
  }

  return buildAutoLayoutResult(context, 'balanced', arranged);
}
