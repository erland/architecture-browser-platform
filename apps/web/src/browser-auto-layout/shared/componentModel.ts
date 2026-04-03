import type { BrowserCanvasNode } from '../../browser-session';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from '../core/config';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutNode,
} from '../core/types';
import type { BrowserAutoLayoutPipelineContext } from '../core/pipeline';
import { getComponentEdges, getEntityComponentNodes, getInitialEntityOrigin } from './layoutShared';

export type BrowserAutoLayoutComponentModel = {
  component: BrowserAutoLayoutComponent;
  entityNodes: BrowserAutoLayoutNode[];
  edges: BrowserAutoLayoutEdge[];
  hardAnchorNodes: BrowserAutoLayoutNode[];
  freeNodes: BrowserAutoLayoutNode[];
  hasHardAnchors: boolean;
};

export function buildBrowserAutoLayoutComponentModel(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
): BrowserAutoLayoutComponentModel {
  const entityNodes = getEntityComponentNodes(component, nodeById);
  const config = getBrowserAutoLayoutConfig(context.request);
  const hardAnchorNodes = entityNodes.filter((node) => isHardAnchorCanvasNode(node, config));

  return {
    component,
    entityNodes,
    edges: getComponentEdges(component, context.graph),
    hardAnchorNodes,
    freeNodes: entityNodes.filter((node) => !hardAnchorNodes.some((anchoredNode) => anchoredNode.id === node.id)),
    hasHardAnchors: hardAnchorNodes.length > 0,
  };
}

export function createBrowserAutoLayoutComponentOrigin(
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  return {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };
}

export function getBrowserAutoLayoutNextComponentOriginX(arranged: BrowserCanvasNode[]) {
  return getInitialEntityOrigin(arranged).x;
}
