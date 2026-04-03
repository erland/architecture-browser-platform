import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutRequest,
} from '../../core/types';
import { getBrowserAutoLayoutConfig, isHardAnchorCanvasNode } from '../../core/config';
import { buildDirectedAdjacency } from '../../shared/layoutShared';
import { choosePriorityRoots, getAnchoredPriorityNodes } from '../../shared/layoutRoots';
import {
  fillMissingLevels,
  propagateLongestDirectedLevels,
  seedLevelsFromRoots,
  seedLevelsFromZeroIndegreeRoots,
} from '../../shared/layoutLevels';

export function chooseHierarchyRoots(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
) {
  const { indegree } = buildDirectedAdjacency(componentNodes, edges);
  const config = getBrowserAutoLayoutConfig(request);
  return choosePriorityRoots(componentNodes, {
    graph,
    indegree,
    getAnchoredNodes: (nodes) => getAnchoredPriorityNodes(nodes, (node) => isHardAnchorCanvasNode(node, config)),
  });
}

export function assignHierarchyLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
): Map<string, number> {
  const { outbound, indegree } = buildDirectedAdjacency(componentNodes, edges);
  const roots = chooseHierarchyRoots(componentNodes, edges, graph, request);
  const levels = new Map<string, number>();
  const queue: string[] = [];

  seedLevelsFromRoots(roots, levels, queue);
  seedLevelsFromZeroIndegreeRoots(componentNodes, indegree, levels, queue);
  propagateLongestDirectedLevels(outbound, levels, queue);
  fillMissingLevels(componentNodes, levels);

  return levels;
}
