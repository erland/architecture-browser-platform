import type { BrowserAutoLayoutResult } from '../../core/types';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from '../../core/config';
import {
  getCanvasNodeByKey,
  getComponentEdges,
  getEntityComponentNodes,
  getInitialEntityOrigin,
  getNodeById,
  orderLayoutComponents,
} from '../../shared/layoutShared';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import {
  buildHierarchyForest,
  placeAnchoredHierarchyComponentNodes,
  placeHierarchyTree,
} from './hierarchyLayoutPhases';
import {
  buildAutoLayoutResult,
  createAutoLayoutPlacementBaseline,
} from '../../shared/browserAutoLayoutSupportShared';

export function runBrowserHierarchyAutoLayoutWithContext(context: BrowserAutoLayoutPipelineContext): BrowserAutoLayoutResult {
  const { request, graph } = context;
  const nodeById = getNodeById(graph);
  const canvasNodeByKey = getCanvasNodeByKey(request.nodes);
  const baseline = createAutoLayoutPlacementBaseline(request);

  let arranged = baseline.arranged;
  let nextOriginX = baseline.initialOrigin.x;
  let nextOriginY = baseline.initialOrigin.y;

  for (const component of orderLayoutComponents(graph, nodeById).filter((candidate) => candidate.nodeIds.some((nodeId) => nodeById.get(nodeId)?.kind === 'entity'))) {
    const componentNodes = getEntityComponentNodes(component, nodeById);
    if (componentNodes.length === 0) {
      continue;
    }

    if (componentNodes.some((node) => isHardAnchorCanvasNode(node, getBrowserAutoLayoutConfig(request)))) {
      const anchoredPlacement = placeAnchoredHierarchyComponentNodes(component, context, nodeById, canvasNodeByKey, arranged, nextOriginY);
      arranged = anchoredPlacement.arranged;
      nextOriginX = getInitialEntityOrigin(arranged).x;
      nextOriginY = anchoredPlacement.nextOriginY;
      continue;
    }

    const forest = buildHierarchyForest(componentNodes, getComponentEdges(component, graph), graph, request);
    const subtreeMemo = new Map<string, number>();
    let componentArranged = [...arranged];
    let componentOriginX = nextOriginX;
    let componentBottomY = nextOriginY;

    for (const rootId of forest.rootIds) {
      const placement = placeHierarchyTree(
        rootId,
        componentOriginX,
        nextOriginY,
        forest,
        nodeById,
        canvasNodeByKey,
        componentArranged,
        request,
        subtreeMemo,
      );
      componentArranged = placement.arranged;
      componentOriginX = placement.nextOriginX;
      componentBottomY = Math.max(componentBottomY, placement.nextOriginY);
    }

    arranged = componentArranged;
    nextOriginX = getInitialEntityOrigin(arranged).x;
    nextOriginY = componentBottomY;
  }

  return buildAutoLayoutResult(context, 'hierarchy', arranged, { cleanupMode: 'compact-only' });
}
