import type { BrowserAutoLayoutNode } from '../core/types';
import { compareNodePriority } from './ordering';
import { compareIds } from './layoutShared';

export type BrowserAutoLayoutDirectedAdjacency = {
  outbound: Map<string, Set<string>>;
  inbound: Map<string, Set<string>>;
  indegree: Map<string, number>;
};

export function seedLevelsFromRoots(
  roots: BrowserAutoLayoutNode[],
  levels: Map<string, number>,
  queue: string[],
  level = 0,
) {
  for (const root of roots) {
    if (levels.has(root.id)) {
      continue;
    }
    levels.set(root.id, level);
    queue.push(root.id);
  }
}

export function seedLevelsFromZeroIndegreeRoots(
  componentNodes: BrowserAutoLayoutNode[],
  indegree: Map<string, number>,
  levels: Map<string, number>,
  queue: string[],
  level = 0,
) {
  const roots = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  seedLevelsFromRoots(roots, levels, queue, level);
}

export function propagateLongestDirectedLevels(
  outbound: Map<string, Set<string>>,
  levels: Map<string, number>,
  queue: string[],
) {
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = levels.get(currentId) ?? 0;
    const neighbors = [...(outbound.get(currentId) ?? [])].sort(compareIds);
    for (const neighborId of neighbors) {
      const candidate = currentLevel + 1;
      const existing = levels.get(neighborId);
      if (existing === undefined || candidate > existing) {
        levels.set(neighborId, candidate);
        queue.push(neighborId);
      }
    }
  }
}

export function relaxDirectedLevels(
  nodeIds: string[],
  adjacency: BrowserAutoLayoutDirectedAdjacency,
  levels: Map<string, number>,
  maxIterations: number,
) {
  let changed = true;
  let iterations = 0;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations += 1;

    for (const nodeId of nodeIds) {
      const sourceLevel = levels.get(nodeId);
      if (sourceLevel === undefined) {
        continue;
      }
      const neighbors = [...(adjacency.outbound.get(nodeId) ?? [])].sort(compareIds);
      for (const neighborId of neighbors) {
        const candidate = sourceLevel + 1;
        const existing = levels.get(neighborId);
        if (existing === undefined || candidate > existing) {
          levels.set(neighborId, candidate);
          changed = true;
        }
      }
    }

    for (const nodeId of nodeIds) {
      if (levels.has(nodeId)) {
        continue;
      }
      const inboundLevels = [...(adjacency.inbound.get(nodeId) ?? [])]
        .map((parentId) => levels.get(parentId))
        .filter((level): level is number => level !== undefined);
      if (inboundLevels.length > 0) {
        levels.set(nodeId, Math.max(...inboundLevels) + 1);
        changed = true;
        continue;
      }
      const outboundLevels = [...(adjacency.outbound.get(nodeId) ?? [])]
        .map((childId) => levels.get(childId))
        .filter((level): level is number => level !== undefined);
      if (outboundLevels.length > 0) {
        levels.set(nodeId, Math.max(0, Math.min(...outboundLevels) - 1));
        changed = true;
      }
    }
  }
}

export function fillMissingLevels(
  componentNodes: BrowserAutoLayoutNode[],
  levels: Map<string, number>,
  fallbackLevel = 0,
) {
  for (const node of [...componentNodes].sort(compareNodePriority)) {
    if (!levels.has(node.id)) {
      levels.set(node.id, fallbackLevel);
    }
  }
}

export function normalizeLevelsToNonNegative(levels: Map<string, number>) {
  if (levels.size === 0) {
    return;
  }
  const minLevel = Math.min(...levels.values());
  if (minLevel >= 0) {
    return;
  }
  for (const [nodeId, level] of [...levels.entries()]) {
    levels.set(nodeId, level - minLevel);
  }
}

export function groupNodesByLevel(
  componentNodes: BrowserAutoLayoutNode[],
  levels: Map<string, number>,
) {
  const grouped = new Map<number, BrowserAutoLayoutNode[]>();
  for (const node of componentNodes) {
    const level = levels.get(node.id) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), node]);
  }
  return grouped;
}
