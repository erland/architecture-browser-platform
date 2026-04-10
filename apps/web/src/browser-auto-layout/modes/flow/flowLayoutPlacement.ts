import type { BrowserCanvasNode } from '../../../browser-session/types';
import type { BrowserAutoLayoutNode } from '../../core/types';
import type { BrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import { getBrowserAutoLayoutConfig } from '../../core/config';
import { createBrowserAutoLayoutComponentOrigin } from '../../shared/componentModel';
import { finalizeComponentPlacement } from '../../shared/layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from '../../shared/layoutFreePlacement';
import { buildCenteredVerticalTopPositions, buildSequentialBandLeftPositions } from '../../shared/layoutFootprint';
import { buildFlowBands } from './flowLayoutModel';

export function placeFlowFreeComponentNodes(
  componentModel: BrowserAutoLayoutComponentModel,
  context: BrowserAutoLayoutPipelineContext,
  _nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request } = context;
  const config = getBrowserAutoLayoutConfig(request);
  const { entityNodes: componentNodes, edges: componentEdges } = componentModel;
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = createBrowserAutoLayoutComponentOrigin(arranged, fallbackOriginY);

  const bands = buildFlowBands(componentNodes, componentEdges, context.graph);
  const bandLeftByLevel = buildSequentialBandLeftPositions(bands, componentOrigin.x, config);
  const nextArranged = placeBandBasedFreeComponentNodes(
    arranged,
    request,
    canvasNodeByKey,
    bands,
    ({ band, index, config }) => {
      const topPositions = buildCenteredVerticalTopPositions(band.nodes, componentOrigin.y, config);
      return {
        x: bandLeftByLevel.get(band.level) ?? componentOrigin.x,
        y: topPositions[index] ?? componentOrigin.y,
      };
    },
  );

  return finalizeComponentPlacement(componentModel.component, request, nextArranged, fallbackOriginY);
}
