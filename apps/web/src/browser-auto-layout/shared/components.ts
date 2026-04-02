import type { BrowserAutoLayoutComponent, BrowserAutoLayoutGraph, BrowserAutoLayoutNode } from '../core/types';

function compareNodeIds(left: string, right: string) {
  return left.localeCompare(right);
}

function buildAdjacency(graph: Pick<BrowserAutoLayoutGraph, 'nodes' | 'edges'>) {
  const adjacency = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.fromEntityId)?.add(edge.toEntityId);
    adjacency.get(edge.toEntityId)?.add(edge.fromEntityId);
  }
  return adjacency;
}

function getAnchoredNodeIds(nodeIds: string[], nodeById: Map<string, BrowserAutoLayoutNode>) {
  return nodeIds
    .filter((nodeId) => nodeById.get(nodeId)?.anchored)
    .sort(compareNodeIds);
}

export function detectBrowserAutoLayoutComponents(graph: Pick<BrowserAutoLayoutGraph, 'nodes' | 'edges'>): BrowserAutoLayoutComponent[] {
  const adjacency = buildAdjacency(graph);
  const visited = new Set<string>();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const unsortedComponents: Array<Omit<BrowserAutoLayoutComponent, 'id'>> = [];

  for (const node of graph.nodes) {
    if (visited.has(node.id)) {
      continue;
    }
    const queue = [node.id];
    const nodeIds: string[] = [];
    visited.add(node.id);
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }
      nodeIds.push(currentId);
      for (const adjacentId of adjacency.get(currentId) ?? []) {
        if (visited.has(adjacentId)) {
          continue;
        }
        visited.add(adjacentId);
        queue.push(adjacentId);
      }
    }
    nodeIds.sort(compareNodeIds);
    const nodeIdSet = new Set(nodeIds);
    const edgeIds = graph.edges
      .filter((edge) => nodeIdSet.has(edge.fromEntityId) && nodeIdSet.has(edge.toEntityId))
      .map((edge) => edge.relationshipId)
      .sort(compareNodeIds);
    const anchoredNodeIds = getAnchoredNodeIds(nodeIds, nodeById);
    unsortedComponents.push({
      nodeIds,
      edgeIds,
      anchoredNodeIds,
      nodeCount: nodeIds.length,
      edgeCount: edgeIds.length,
    });
  }

  return unsortedComponents
    .sort((left, right) => {
      if (left.nodeCount !== right.nodeCount) {
        return right.nodeCount - left.nodeCount;
      }
      if (left.edgeCount !== right.edgeCount) {
        return right.edgeCount - left.edgeCount;
      }
      return (left.nodeIds[0] ?? '').localeCompare(right.nodeIds[0] ?? '');
    })
    .map((component, index) => ({
      id: `component-${index + 1}`,
      ...component,
    }));
}

export function mapBrowserAutoLayoutNodeToComponentId(components: BrowserAutoLayoutComponent[]): Record<string, string> {
  const nodeToComponentId: Record<string, string> = {};
  for (const component of components) {
    for (const nodeId of component.nodeIds) {
      nodeToComponentId[nodeId] = component.id;
    }
  }
  return nodeToComponentId;
}

export function attachBrowserAutoLayoutComponents(
  graph: Omit<BrowserAutoLayoutGraph, 'components' | 'nodeToComponentId'>,
): BrowserAutoLayoutGraph {
  const components = detectBrowserAutoLayoutComponents(graph);
  return {
    ...graph,
    components,
    nodeToComponentId: mapBrowserAutoLayoutNodeToComponentId(components),
  };
}
