import type { BrowserCanvasNode } from '../../../browser-session';
import type { BrowserAutoLayoutNode } from '../../core/types';
import type { BrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import { getBrowserAutoLayoutConfig, getWrappedBandOffset } from '../../core/config';
import { createBrowserAutoLayoutComponentOrigin } from '../../shared/componentModel';
import { finalizeComponentPlacement } from '../../shared/layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from '../../shared/layoutFreePlacement';
import { buildCenteredVerticalTopPositions, buildSequentialBandLeftPositions } from '../../shared/layoutFootprint';
import { buildStructureBands } from './structureLayoutModel';
import { chooseStructureComponentRoot } from './structureLayoutSemantics';

export function placeStructureFreeComponentNodes(
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

  const root = chooseStructureComponentRoot(componentNodes, componentEdges, context.graph);
  if (!root) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = createBrowserAutoLayoutComponentOrigin(arranged, fallbackOriginY);

  const bands = buildStructureBands(componentNodes, componentEdges, root);
  const baseBands = bands.map((band) => ({ level: band.level, nodes: band.nodes.slice(0, config.maxBreadth) }));
  const bandLeftByLevel = buildSequentialBandLeftPositions(baseBands, componentOrigin.x, config);

  const nextArranged = placeBandBasedFreeComponentNodes(
    arranged,
    request,
    canvasNodeByKey,
    bands,
    ({ band, index, config }) => {
      const wrapped = getWrappedBandOffset(index, config);
      const visibleNodes = band.nodes.slice(wrapped.wrapGroup * config.maxBreadth, (wrapped.wrapGroup + 1) * config.maxBreadth);
      const topPositions = buildCenteredVerticalTopPositions(
        visibleNodes,
        componentOrigin.y + wrapped.wrapGroup * Math.round(config.componentSpacing / 2),
        config,
      );
      return {
        x: (bandLeftByLevel.get(band.level) ?? componentOrigin.x) + wrapped.wrapGroup * config.horizontalSpacing,
        y: topPositions[wrapped.indexInGroup] ?? componentOrigin.y,
      };
    },
  );

  return finalizeComponentPlacement(componentModel.component, request, nextArranged, fallbackOriginY);
}
