import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildUndirectedAdjacency, compareNodePriority } from '../../shared/ordering';
import { buildDirectedAdjacency } from '../../shared/layoutShared';

export type BalancedCluster = {
  anchor: BrowserAutoLayoutNode;
  sidecars: BrowserAutoLayoutNode[];
  members: BrowserAutoLayoutNode[];
  width: number;
  height: number;
  outboundToUnassigned: number;
};

export function buildBalancedClusters(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
): BalancedCluster[] {
  const { outbound, inbound } = buildDirectedAdjacency(componentNodes, edges);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const nodeById = new Map(componentNodes.map((node) => [node.id, node]));
  const assigned = new Set<string>();
  const clusters: BalancedCluster[] = [];
  const sideGap = 112;
  const stackGap = 48;

  const candidateOrder = [
    root,
    ...componentNodes.filter((node) => node.id !== root.id).sort((left, right) => {
      const degreeDelta = (right.outboundCount + right.inboundCount) - (left.outboundCount + left.inboundCount);
      if (degreeDelta !== 0) {
        return degreeDelta;
      }
      return compareNodePriority(left, right);
    }),
  ];

  for (const anchor of candidateOrder) {
    if (assigned.has(anchor.id)) {
      continue;
    }

    const preferredNeighbors = [
      ...(outbound.get(anchor.id) ?? []),
      ...(inbound.get(anchor.id) ?? []),
      ...(adjacency.get(anchor.id) ?? []),
    ];
    const uniqueNeighborIds = preferredNeighbors.filter((neighborId, index, arr) => arr.indexOf(neighborId) === index);
    const sidecars = uniqueNeighborIds
      .map((neighborId) => nodeById.get(neighborId) ?? null)
      .filter((node): node is BrowserAutoLayoutNode => Boolean(node))
      .filter((node) => !assigned.has(node.id))
      .filter((node) => node.id !== anchor.id)
      .filter((node) => node.incidentCount <= 2 || (node.outboundCount === 0) || (node.inboundCount === 0))
      .sort(compareNodePriority)
      .slice(0, 2);

    const members = [anchor, ...sidecars];
    members.forEach((node) => assigned.add(node.id));

    const sidecarHeight = sidecars.length > 0
      ? sidecars.reduce((total, node, index) => total + node.height + (index > 0 ? stackGap : 0), 0)
      : 0;
    const sidecarWidth = sidecars.length > 0 ? Math.max(...sidecars.map((node) => node.width)) : 0;
    const outboundToUnassigned = [...(outbound.get(anchor.id) ?? [])].filter((neighborId) => !assigned.has(neighborId)).length;
    clusters.push({
      anchor,
      sidecars,
      members,
      width: anchor.width + (sidecars.length > 0 ? sideGap + sidecarWidth : 0),
      height: Math.max(anchor.height, sidecarHeight),
      outboundToUnassigned,
    });
  }

  const remaining = componentNodes
    .filter((node) => !assigned.has(node.id))
    .sort(compareNodePriority);
  for (const node of remaining) {
    clusters.push({
      anchor: node,
      sidecars: [],
      members: [node],
      width: node.width,
      height: node.height,
      outboundToUnassigned: 0,
    });
  }

  return clusters.sort((left, right) => {
    const leftDegree = left.anchor.outboundCount + left.anchor.inboundCount;
    const rightDegree = right.anchor.outboundCount + right.anchor.inboundCount;
    const degreeDelta = rightDegree - leftDegree;
    if (degreeDelta !== 0) {
      return degreeDelta;
    }
    const outboundDelta = right.outboundToUnassigned - left.outboundToUnassigned;
    if (outboundDelta !== 0) {
      return outboundDelta;
    }
    return compareNodePriority(left.anchor, right.anchor);
  });
}

export type BalancedClusterRow = {
  clusters: BalancedCluster[];
  width: number;
  height: number;
};

export function buildBalancedClusterConnectionGraph(
  clusters: BalancedCluster[],
  edges: BrowserAutoLayoutEdge[],
): Map<string, Set<string>> {
  const clusterByNodeId = new Map<string, string>();
  for (const cluster of clusters) {
    for (const member of cluster.members) {
      clusterByNodeId.set(member.id, cluster.anchor.id);
    }
  }

  const connections = new Map<string, Set<string>>();
  for (const cluster of clusters) {
    connections.set(cluster.anchor.id, new Set());
  }

  for (const edge of edges) {
    const fromClusterId = clusterByNodeId.get(edge.fromEntityId);
    const toClusterId = clusterByNodeId.get(edge.toEntityId);
    if (!fromClusterId || !toClusterId || fromClusterId === toClusterId) {
      continue;
    }
    connections.get(fromClusterId)?.add(toClusterId);
    connections.get(toClusterId)?.add(fromClusterId);
  }

  return connections;
}

export function buildBalancedClusterRows(
  clusters: BalancedCluster[],
  rowWidthLimit: number,
  clusterGapX: number,
): BalancedClusterRow[] {
  const rows: BalancedClusterRow[] = [];
  let currentClusters: BalancedCluster[] = [];
  let currentWidth = 0;
  let currentHeight = 0;

  for (const cluster of clusters) {
    const nextWidth = currentClusters.length === 0
      ? cluster.width
      : currentWidth + clusterGapX + cluster.width;
    if (currentClusters.length > 0 && nextWidth > rowWidthLimit) {
      rows.push({ clusters: currentClusters, width: currentWidth, height: currentHeight });
      currentClusters = [cluster];
      currentWidth = cluster.width;
      currentHeight = cluster.height;
      continue;
    }
    currentClusters.push(cluster);
    currentWidth = nextWidth;
    currentHeight = Math.max(currentHeight, cluster.height);
  }

  if (currentClusters.length > 0) {
    rows.push({ clusters: currentClusters, width: currentWidth, height: currentHeight });
  }

  return rows;
}
