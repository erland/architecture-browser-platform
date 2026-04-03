import type { BrowserAutoLayoutEdge, BrowserAutoLayoutGraph, BrowserAutoLayoutNode } from '../core/types';
import { compareNodePriority } from './ordering';
import {
  findAnchoredComponentNodes,
  findFirstPriorityNode,
  findFocusedOrSelectedComponentNode,
  findZeroIndegreeComponentNodes,
} from './rootSelection';

export type BrowserAutoLayoutRootChoiceOptions = {
  graph: BrowserAutoLayoutGraph;
  indegree?: Map<string, number>;
  getAnchoredNodes?: (nodes: BrowserAutoLayoutNode[]) => BrowserAutoLayoutNode[];
};

export function buildComponentIndegree(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
): Map<string, number> {
  const indegree = new Map<string, number>(componentNodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    if (!indegree.has(edge.fromEntityId) || !indegree.has(edge.toEntityId)) {
      continue;
    }
    indegree.set(edge.toEntityId, (indegree.get(edge.toEntityId) ?? 0) + 1);
  }
  return indegree;
}

export function chooseSinglePriorityRoot(
  componentNodes: BrowserAutoLayoutNode[],
  options: BrowserAutoLayoutRootChoiceOptions,
): BrowserAutoLayoutNode | undefined {
  const preferred = findFocusedOrSelectedComponentNode(componentNodes, options.graph);
  if (preferred) {
    return preferred;
  }

  const anchored = options.getAnchoredNodes?.(componentNodes) ?? [];
  if (anchored.length > 0) {
    return anchored[0];
  }

  if (options.indegree) {
    const zeroIndegree = findZeroIndegreeComponentNodes(componentNodes, options.indegree, compareNodePriority);
    if (zeroIndegree.length > 0) {
      return zeroIndegree[0];
    }
  }

  const fallback = findFirstPriorityNode(componentNodes, compareNodePriority);
  return fallback ?? undefined;
}

export function choosePriorityRoots(
  componentNodes: BrowserAutoLayoutNode[],
  options: BrowserAutoLayoutRootChoiceOptions,
): BrowserAutoLayoutNode[] {
  const preferred = findFocusedOrSelectedComponentNode(componentNodes, options.graph);
  if (preferred) {
    return [preferred];
  }

  const anchored = options.getAnchoredNodes?.(componentNodes) ?? [];
  if (anchored.length > 0) {
    return anchored;
  }

  if (options.indegree) {
    const zeroIndegree = findZeroIndegreeComponentNodes(componentNodes, options.indegree, compareNodePriority);
    if (zeroIndegree.length > 0) {
      return zeroIndegree;
    }
  }

  const fallback = findFirstPriorityNode(componentNodes, compareNodePriority);
  return fallback ? [fallback] : [];
}

export function getAnchoredPriorityNodes(
  componentNodes: BrowserAutoLayoutNode[],
  isAnchored: (node: BrowserAutoLayoutNode) => boolean,
): BrowserAutoLayoutNode[] {
  return findAnchoredComponentNodes(componentNodes, isAnchored, compareNodePriority);
}
