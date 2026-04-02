import type { BrowserCanvasNode } from '../browserSessionStore.types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutResult,
} from './types';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from './config';
import { getCanvasNodeByKey, getEntityComponentNodes, getNodeById, orderLayoutComponents } from './layoutShared';
import type { BrowserAutoLayoutPipelineContext } from './pipeline';
import {
  createAutoLayoutPlacementBaseline,
  buildAutoLayoutResult,
} from './browserAutoLayoutSupportShared';
import {
  placeStructureAnchoredComponentNodes,
  placeStructureFreeComponentNodes,
} from './structureLayoutPhases';

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
    ? placeStructureAnchoredComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY)
    : placeStructureFreeComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, fallbackOriginY);
}

export function runBrowserStructureAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
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

  return buildAutoLayoutResult(context, 'structure', arranged);
}
