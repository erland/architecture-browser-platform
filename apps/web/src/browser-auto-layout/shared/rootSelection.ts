import type { BrowserAutoLayoutGraph, BrowserAutoLayoutNode } from '../core/types';

export function findFocusedComponentNode(
  componentNodes: BrowserAutoLayoutNode[],
  graph: BrowserAutoLayoutGraph,
): BrowserAutoLayoutNode | null {
  return graph.focusedNodeId ? componentNodes.find((node) => node.id === graph.focusedNodeId) ?? null : null;
}

export function findSelectedComponentNode(
  componentNodes: BrowserAutoLayoutNode[],
  graph: BrowserAutoLayoutGraph,
): BrowserAutoLayoutNode | null {
  return graph.selectedNodeIds
    .map((selectedNodeId) => componentNodes.find((node) => node.id === selectedNodeId) ?? null)
    .find((node): node is BrowserAutoLayoutNode => Boolean(node)) ?? null;
}

export function findFocusedOrSelectedComponentNode(
  componentNodes: BrowserAutoLayoutNode[],
  graph: BrowserAutoLayoutGraph,
): BrowserAutoLayoutNode | null {
  return findFocusedComponentNode(componentNodes, graph) ?? findSelectedComponentNode(componentNodes, graph);
}

export function findAnchoredComponentNodes(
  componentNodes: BrowserAutoLayoutNode[],
  isAnchoredNode: (node: BrowserAutoLayoutNode) => boolean,
  compareNodes: (left: BrowserAutoLayoutNode, right: BrowserAutoLayoutNode) => number,
): BrowserAutoLayoutNode[] {
  return componentNodes.filter(isAnchoredNode).sort(compareNodes);
}

export function findZeroIndegreeComponentNodes(
  componentNodes: BrowserAutoLayoutNode[],
  indegree: Map<string, number>,
  compareNodes: (left: BrowserAutoLayoutNode, right: BrowserAutoLayoutNode) => number,
): BrowserAutoLayoutNode[] {
  return componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodes);
}

export function findFirstPriorityNode(
  componentNodes: BrowserAutoLayoutNode[],
  compareNodes: (left: BrowserAutoLayoutNode, right: BrowserAutoLayoutNode) => number,
): BrowserAutoLayoutNode | null {
  return [...componentNodes].sort(compareNodes)[0] ?? null;
}
