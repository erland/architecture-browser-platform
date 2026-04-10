import type { BrowserCanvasNode } from '../../browser-graph/contracts';
import { getBrowserAutoLayoutConfig } from '../core/config';
import { placeBrowserAutoLayoutNode } from './placement';
import { enforceVerticalColumnClearance } from './layoutFootprint';
import type { BrowserAutoLayoutNode, BrowserAutoLayoutRequest } from '../core/types';

export type LayoutBand<TNode extends BrowserAutoLayoutNode = BrowserAutoLayoutNode> = {
  level: number;
  nodes: TNode[];
};

export function placeBandBasedFreeComponentNodes(
  arranged: BrowserCanvasNode[],
  request: BrowserAutoLayoutRequest,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  bands: LayoutBand[],
  placeDesired: (args: {
    band: LayoutBand;
    index: number;
    node: BrowserAutoLayoutNode;
    config: ReturnType<typeof getBrowserAutoLayoutConfig>;
  }) => { x: number; y: number },
) {
  const config = getBrowserAutoLayoutConfig(request);
  let nextArranged = [...arranged];

  for (const band of bands) {
    const bandPlaced: BrowserCanvasNode[] = [];
    for (const [index, layoutNode] of band.nodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const placement = placeBrowserAutoLayoutNode(
        [...nextArranged, ...bandPlaced],
        original,
        placeDesired({ band, index, node: layoutNode, config }),
        request.options,
      );
      bandPlaced.push({
        ...original,
        ...placement,
        manuallyPlaced: false,
      });
    }
    const adjustedBandPlaced = enforceVerticalColumnClearance(nextArranged, bandPlaced, request.options);
    nextArranged = [...nextArranged, ...adjustedBandPlaced];
  }

  return nextArranged;
}
