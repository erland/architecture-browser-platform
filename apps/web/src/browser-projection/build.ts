import { resolveBrowserStateViewpointPresentationPolicy } from '../browserViewpointPresentation';
import type { BrowserSessionState } from '../browserSessionStore';
import { buildProjectionEdges, buildProjectionSourceEntityNodeMap } from './edgeShaping';
import { buildProjectionNodes } from './nodeShaping';
import type { BrowserProjectionModel } from './types';

export function buildBrowserProjectionModel(state: BrowserSessionState): BrowserProjectionModel {
  const index = state.index;
  const presentationPolicy = resolveBrowserStateViewpointPresentationPolicy(state);
  if (!index) {
    return { width: 1280, height: 720, nodes: [], edges: [], presentationPolicy, suppressedEntityIds: [] };
  }

  const { nodes, suppressedEntityIds } = buildProjectionNodes(state, presentationPolicy);
  const nodesBySourceEntityId = buildProjectionSourceEntityNodeMap(nodes);
  const edges = buildProjectionEdges(state, nodesBySourceEntityId, state.canvasEdges);
  const maxNodeRight = nodes.reduce((current, node) => Math.max(current, node.x + node.width), 0);
  const maxNodeBottom = nodes.reduce((current, node) => Math.max(current, node.y + node.height), 0);

  return {
    width: Math.max(1280, maxNodeRight + 80),
    height: Math.max(720, maxNodeBottom + 80),
    nodes,
    edges,
    presentationPolicy,
    suppressedEntityIds,
  };
}
