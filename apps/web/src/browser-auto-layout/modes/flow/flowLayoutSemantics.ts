import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildDirectedAdjacency } from '../../shared/layoutShared';
import { choosePriorityRoots } from '../../shared/layoutRoots';
import {
  fillMissingLevels,
  normalizeLevelsToNonNegative,
  propagateLongestDirectedLevels,
  relaxDirectedLevels,
  seedLevelsFromRoots,
  seedLevelsFromZeroIndegreeRoots,
} from '../../shared/layoutLevels';

export function chooseFlowRoots(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const { indegree } = buildDirectedAdjacency(componentNodes, edges);
  return choosePriorityRoots(componentNodes, { graph, indegree });
}

export function assignFlowLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
): Map<string, number> {
  const { outbound, inbound, indegree } = buildDirectedAdjacency(componentNodes, edges);
  const roots = chooseFlowRoots(componentNodes, edges, graph);
  const levels = new Map<string, number>();
  const queue: string[] = [];
  const sortedNodeIds = componentNodes.map((node) => node.id).sort();

  seedLevelsFromRoots(roots, levels, queue);
  seedLevelsFromZeroIndegreeRoots(componentNodes, indegree, levels, queue);
  propagateLongestDirectedLevels(outbound, levels, queue);
  relaxDirectedLevels(sortedNodeIds, { outbound, inbound, indegree }, levels, componentNodes.length);
  fillMissingLevels(componentNodes, levels);
  normalizeLevelsToNonNegative(levels);

  return levels;
}
