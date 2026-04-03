import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
  BrowserAutoLayoutRequest,
} from '../../core/types';
import { compareNodePriority, compareRootPriority } from '../../shared/ordering';
import { buildDirectedAdjacency } from '../../shared/layoutShared';
import { assignHierarchyLevels } from './hierarchyLayoutSemantics';

export function buildHierarchyForest(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
  request: BrowserAutoLayoutRequest,
) {
  const { outbound, inbound } = buildDirectedAdjacency(componentNodes, edges);
  const levels = assignHierarchyLevels(componentNodes, edges, graph, request);
  const nodeById = new Map(componentNodes.map((node) => [node.id, node]));
  const nodesByLevel = [...componentNodes].sort((left, right) => {
    const leftLevel = levels.get(left.id) ?? 0;
    const rightLevel = levels.get(right.id) ?? 0;
    if (leftLevel !== rightLevel) {
      return leftLevel - rightLevel;
    }
    return compareNodePriority(left, right);
  });

  const childrenByNode = new Map<string, string[]>();
  const rootIds = new Set<string>();
  for (const node of componentNodes) {
    childrenByNode.set(node.id, []);
    rootIds.add(node.id);
  }

  for (const node of nodesByLevel) {
    const nodeLevel = levels.get(node.id) ?? 0;
    const candidateParents = [...(inbound.get(node.id) ?? [])]
      .filter((parentId) => (levels.get(parentId) ?? 0) < nodeLevel)
      .map((parentId) => nodeById.get(parentId) ?? null)
      .filter((candidate): candidate is BrowserAutoLayoutNode => Boolean(candidate))
      .sort(compareNodePriority);

    const parent = candidateParents[0];
    if (!parent) {
      continue;
    }
    childrenByNode.set(parent.id, [...(childrenByNode.get(parent.id) ?? []), node.id]);
    rootIds.delete(node.id);
  }

  const orderedRootIds = [...rootIds].sort((left, right) => compareRootPriority(left, right, childrenByNode, nodeById));

  for (const [parentId, childIds] of [...childrenByNode.entries()]) {
    childrenByNode.set(parentId, [...childIds].sort((left, right) => {
      const leftNode = nodeById.get(left);
      const rightNode = nodeById.get(right);
      if (!leftNode || !rightNode) {
        return left.localeCompare(right);
      }
      const leftLevel = levels.get(left) ?? 0;
      const rightLevel = levels.get(right) ?? 0;
      if (leftLevel !== rightLevel) {
        return leftLevel - rightLevel;
      }
      return compareNodePriority(leftNode, rightNode);
    }));
  }

  return {
    levels,
    outbound,
    inbound,
    rootIds: orderedRootIds,
    childrenByNode,
  };
}

export function computeSubtreeColumns(
  rootId: string,
  childrenByNode: Map<string, string[]>,
  memo = new Map<string, number>(),
): number {
  const existing = memo.get(rootId);
  if (existing !== undefined) {
    return existing;
  }
  const children = childrenByNode.get(rootId) ?? [];
  if (children.length === 0) {
    memo.set(rootId, 1);
    return 1;
  }
  const width = Math.max(1, children.reduce((sum, childId) => sum + computeSubtreeColumns(childId, childrenByNode, memo), 0));
  memo.set(rootId, width);
  return width;
}
