import { compareNodePriority } from './ordering';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from './config';
import type { BrowserAutoLayoutNode, BrowserAutoLayoutRequest } from './types';

export function getAnchoredNodes(componentNodes: BrowserAutoLayoutNode[], request: BrowserAutoLayoutRequest) {
  const config = getBrowserAutoLayoutConfig(request);
  return componentNodes
    .filter((node) => isHardAnchorCanvasNode(node, config))
    .sort(compareNodePriority);
}
