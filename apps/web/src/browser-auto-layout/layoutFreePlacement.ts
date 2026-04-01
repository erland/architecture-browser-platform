import type { BrowserCanvasNode } from '../browserSessionStore.types';
import { getBrowserAutoLayoutConfig } from './config';
import { placeBrowserAutoLayoutNode } from './placement';
import type { BrowserAutoLayoutNode, BrowserAutoLayoutRequest } from './types';

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
    for (const [index, layoutNode] of band.nodes.entries()) {
      const original = canvasNodeByKey.get(layoutNode.key);
      if (!original) {
        continue;
      }
      const placement = placeBrowserAutoLayoutNode(
        nextArranged,
        original,
        placeDesired({ band, index, node: layoutNode, config }),
        request.options,
      );
      nextArranged = [...nextArranged, {
        ...original,
        ...placement,
        manuallyPlaced: false,
      }];
    }
  }

  return nextArranged;
}
