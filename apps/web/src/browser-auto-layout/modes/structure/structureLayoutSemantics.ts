import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildUndirectedAdjacency, compareNodePriority } from '../../shared/ordering';
import { buildDirectedAdjacency, compareIds } from '../../shared/layoutShared';
import { buildComponentIndegree, chooseSinglePriorityRoot, getAnchoredPriorityNodes } from '../../shared/layoutRoots';
import { propagateLongestDirectedLevels, seedLevelsFromRoots } from '../../shared/layoutLevels';

export function chooseStructureComponentRoot(
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

export function assignStructureLevels(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
): Map<string, number> {
  const levels = new Map<string, number>();
  const { outbound, indegree } = buildDirectedAdjacency(componentNodes, edges);

  const sourceRoots = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  const seededRoots = [root, ...sourceRoots.filter((node) => node.id !== root.id)];
  const queue: string[] = [];

  let nextSeedLevel = 0;
  for (const seed of seededRoots) {
    if (levels.has(seed.id)) {
      continue;
    }
    seedLevelsFromRoots([seed], levels, queue, nextSeedLevel);
    nextSeedLevel += 1;
  }

  if (queue.length === 0) {
    seedLevelsFromRoots([root], levels, queue);
  }

  propagateLongestDirectedLevels(outbound, levels, queue);

  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const fallbackVisited = new Set<string>(levels.keys());
  const fallbackQueue = [...levels.keys()];
  while (fallbackQueue.length > 0) {
    const currentId = fallbackQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = levels.get(currentId) ?? 0;
    const neighbors = [...(adjacency.get(currentId) ?? [])].sort(compareIds);
    for (const neighborId of neighbors) {
      if (fallbackVisited.has(neighborId)) {
        continue;
      }
      fallbackVisited.add(neighborId);
      levels.set(neighborId, currentLevel + 1);
      fallbackQueue.push(neighborId);
    }
  }

  for (const node of componentNodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, nextSeedLevel);
      nextSeedLevel += 1;
    }
  }

  return levels;
}
