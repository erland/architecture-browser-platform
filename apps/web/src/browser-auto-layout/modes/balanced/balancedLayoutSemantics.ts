import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildComponentIndegree, chooseSinglePriorityRoot, getAnchoredPriorityNodes } from '../../shared/layoutRoots';

export function chooseBalancedComponentRoot(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  return chooseSinglePriorityRoot(componentNodes, {
    graph,
    indegree: buildComponentIndegree(componentNodes, edges),
    getAnchoredNodes: (nodes) => getAnchoredPriorityNodes(nodes, (node) => node.pinned || node.manuallyPlaced),
  });
}
