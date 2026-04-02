import type { BrowserAutoLayoutEdge, BrowserAutoLayoutGraph, BrowserAutoLayoutNode } from '../core/types';

export function compareNodePriority(left: BrowserAutoLayoutNode, right: BrowserAutoLayoutNode) {
  if (left.focused !== right.focused) {
    return left.focused ? -1 : 1;
  }
  if (left.selected !== right.selected) {
    return left.selected ? -1 : 1;
  }
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1;
  }
  if (left.manuallyPlaced !== right.manuallyPlaced) {
    return left.manuallyPlaced ? -1 : 1;
  }
  if (left.incidentCount !== right.incidentCount) {
    return right.incidentCount - left.incidentCount;
  }
  if (left.outboundCount !== right.outboundCount) {
    return right.outboundCount - left.outboundCount;
  }
  if (left.inboundCount !== right.inboundCount) {
    return left.inboundCount - right.inboundCount;
  }
  return left.id.localeCompare(right.id);
}

export function buildUndirectedAdjacency(nodes: BrowserAutoLayoutNode[], edges: BrowserAutoLayoutEdge[]) {
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (!adjacency.has(edge.fromEntityId) || !adjacency.has(edge.toEntityId)) {
      continue;
    }
    adjacency.get(edge.fromEntityId)?.add(edge.toEntityId);
    adjacency.get(edge.toEntityId)?.add(edge.fromEntityId);
  }
  return adjacency;
}

export function sortBandNodesByBarycenter(
  nodes: BrowserAutoLayoutNode[],
  adjacency: Map<string, Set<string>>,
  fixedOrder: Map<string, number>,
  fallbackCompare = compareNodePriority,
) {
  return [...nodes].sort((left, right) => {
    const leftNeighbors = [...(adjacency.get(left.id) ?? [])].filter((neighborId) => fixedOrder.has(neighborId));
    const rightNeighbors = [...(adjacency.get(right.id) ?? [])].filter((neighborId) => fixedOrder.has(neighborId));
    const leftBarycenter = leftNeighbors.length > 0
      ? leftNeighbors.reduce((sum, neighborId) => sum + (fixedOrder.get(neighborId) ?? 0), 0) / leftNeighbors.length
      : Number.POSITIVE_INFINITY;
    const rightBarycenter = rightNeighbors.length > 0
      ? rightNeighbors.reduce((sum, neighborId) => sum + (fixedOrder.get(neighborId) ?? 0), 0) / rightNeighbors.length
      : Number.POSITIVE_INFINITY;

    const leftHasNeighbors = Number.isFinite(leftBarycenter);
    const rightHasNeighbors = Number.isFinite(rightBarycenter);
    if (leftHasNeighbors !== rightHasNeighbors) {
      return leftHasNeighbors ? -1 : 1;
    }
    if (leftHasNeighbors && rightHasNeighbors && leftBarycenter !== rightBarycenter) {
      return leftBarycenter - rightBarycenter;
    }
    return fallbackCompare(left, right);
  });
}


export function reduceLayerCrossings(
  bands: Array<{ level: number; nodes: BrowserAutoLayoutNode[] }>,
  inbound: Map<string, Set<string>>,
  outbound: Map<string, Set<string>>,
  fallbackCompare = compareNodePriority,
) {
  if (bands.length <= 2) {
    return bands.map((band) => ({ level: band.level, nodes: [...band.nodes] }));
  }

  const ordered = bands.map((band) => ({ level: band.level, nodes: [...band.nodes] }));

  const rebuildOrder = (nodes: BrowserAutoLayoutNode[]) => new Map(nodes.map((node, index) => [node.id, index]));

  for (let sweep = 0; sweep < 2; sweep += 1) {
    let previousOrder = rebuildOrder(ordered[0]?.nodes ?? []);
    for (let index = 1; index < ordered.length; index += 1) {
      ordered[index] = {
        ...ordered[index],
        nodes: sortBandNodesByBarycenter(ordered[index].nodes, inbound, previousOrder, fallbackCompare),
      };
      previousOrder = rebuildOrder(ordered[index].nodes);
    }

    let nextOrder = rebuildOrder(ordered[ordered.length - 1]?.nodes ?? []);
    for (let index = ordered.length - 2; index >= 0; index -= 1) {
      ordered[index] = {
        ...ordered[index],
        nodes: sortBandNodesByBarycenter(ordered[index].nodes, outbound, nextOrder, fallbackCompare),
      };
      nextOrder = rebuildOrder(ordered[index].nodes);
    }
  }

  return ordered;
}

export function orderComponentsForLayout(graph: BrowserAutoLayoutGraph, nodeById: Map<string, BrowserAutoLayoutNode>) {
  const focusedComponentId = graph.focusedNodeId ? graph.nodeToComponentId[graph.focusedNodeId] : null;
  const selectedComponentIds = new Set(graph.selectedNodeIds.map((nodeId) => graph.nodeToComponentId[nodeId]).filter(Boolean));

  return [...graph.components].sort((left, right) => {
    const leftHasFocus = focusedComponentId === left.id;
    const rightHasFocus = focusedComponentId === right.id;
    if (leftHasFocus !== rightHasFocus) {
      return leftHasFocus ? -1 : 1;
    }

    const leftSelected = selectedComponentIds.has(left.id);
    const rightSelected = selectedComponentIds.has(right.id);
    if (leftSelected !== rightSelected) {
      return leftSelected ? -1 : 1;
    }

    const leftAnchored = left.nodeIds.some((nodeId) => {
      const node = nodeById.get(nodeId);
      return node?.pinned || node?.manuallyPlaced;
    });
    const rightAnchored = right.nodeIds.some((nodeId) => {
      const node = nodeById.get(nodeId);
      return node?.pinned || node?.manuallyPlaced;
    });
    if (leftAnchored !== rightAnchored) {
      return leftAnchored ? -1 : 1;
    }

    if (left.edgeCount !== right.edgeCount) {
      return right.edgeCount - left.edgeCount;
    }
    if (left.nodeCount !== right.nodeCount) {
      return right.nodeCount - left.nodeCount;
    }

    const leftTopNode = left.nodeIds
      .map((nodeId) => nodeById.get(nodeId))
      .filter((node): node is BrowserAutoLayoutNode => Boolean(node))
      .sort(compareNodePriority)[0];
    const rightTopNode = right.nodeIds
      .map((nodeId) => nodeById.get(nodeId))
      .filter((node): node is BrowserAutoLayoutNode => Boolean(node))
      .sort(compareNodePriority)[0];
    if (leftTopNode && rightTopNode) {
      return compareNodePriority(leftTopNode, rightTopNode);
    }
    return (left.nodeIds[0] ?? '').localeCompare(right.nodeIds[0] ?? '');
  });
}

export function compareRootPriority(
  leftId: string,
  rightId: string,
  childrenByNode: Map<string, string[]>,
  nodeById: Map<string, BrowserAutoLayoutNode>,
) {
  const leftChildren = childrenByNode.get(leftId)?.length ?? 0;
  const rightChildren = childrenByNode.get(rightId)?.length ?? 0;
  if (leftChildren !== rightChildren) {
    return rightChildren - leftChildren;
  }
  const leftNode = nodeById.get(leftId);
  const rightNode = nodeById.get(rightId);
  if (leftNode && rightNode) {
    return compareNodePriority(leftNode, rightNode);
  }
  return leftId.localeCompare(rightId);
}
