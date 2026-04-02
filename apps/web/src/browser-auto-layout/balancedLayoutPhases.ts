import type { BrowserCanvasNode } from '../browserSessionStore.types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from './types';
import { buildUndirectedAdjacency, compareNodePriority } from './ordering';
import { getBrowserAutoLayoutConfig, getWrappedBandOffset, isHardAnchorCanvasNode } from './config';
import {
  assignNodesToAnchors,
  buildFallbackFreeNodeOrigin,
  enforceAnchoredPlacementClearance,
  finalizeComponentPlacement,
  prepareAnchoredComponentPlacement,
} from './layoutAnchoredPlacement';
import { placeBandBasedFreeComponentNodes } from './layoutFreePlacement';
import {
  buildDirectedAdjacency,
  getComponentEdges,
  getEntityComponentNodes,
  getInitialEntityOrigin,
} from './layoutShared';
import { buildCenteredVerticalTopPositions } from './layoutFootprint';
import type { BrowserAutoLayoutPipelineContext } from './pipeline';

export function chooseBalancedComponentRoot(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
) {
  const focused = graph.focusedNodeId ? componentNodes.find((node) => node.id === graph.focusedNodeId) : null;
  if (focused) {
    return focused;
  }

  const selected = graph.selectedNodeIds
    .map((selectedNodeId) => componentNodes.find((node) => node.id === selectedNodeId) ?? null)
    .find((node): node is BrowserAutoLayoutNode => Boolean(node));
  if (selected) {
    return selected;
  }

  const indegree = new Map<string, number>(componentNodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    if (indegree.has(edge.toEntityId) && indegree.has(edge.fromEntityId)) {
      indegree.set(edge.toEntityId, (indegree.get(edge.toEntityId) ?? 0) + 1);
    }
  }

  const anchored = componentNodes.filter((node) => node.pinned || node.manuallyPlaced).sort(compareNodePriority)[0];
  if (anchored) {
    return anchored;
  }

  const zeroIndegree = componentNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareNodePriority);
  if (zeroIndegree.length > 0) {
    return zeroIndegree[0];
  }

  return [...componentNodes].sort(compareNodePriority)[0] ?? null;
}

export function placeBalancedAnchoredComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request, graph } = context;
  const prepared = prepareAnchoredComponentPlacement(component, request, graph, nodeById, canvasNodeByKey, arranged);
  if (!prepared) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const { config, componentNodes, componentEdges, anchorNodes } = prepared;
  let nextArranged = prepared.arrangedWithAnchors;
  const assignments = assignNodesToAnchors(componentNodes, componentEdges, anchorNodes);
  const freeNodes = componentNodes.filter((node) => !isHardAnchorCanvasNode(node, config));

  for (const anchorNode of anchorNodes) {
    const anchorCanvasNode = canvasNodeByKey.get(anchorNode.key);
    if (!anchorCanvasNode) {
      continue;
    }

    const assignedNodes = freeNodes
      .filter((node) => assignments.get(node.id)?.anchorId === anchorNode.id)
      .sort((left, right) => {
        const leftDistance = assignments.get(left.id)?.distance ?? Number.MAX_SAFE_INTEGER;
        const rightDistance = assignments.get(right.id)?.distance ?? Number.MAX_SAFE_INTEGER;
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
        return compareNodePriority(left, right);
      });

    const groupedByDistance = new Map<number, BrowserAutoLayoutNode[]>();
    for (const node of assignedNodes) {
      const distance = assignments.get(node.id)?.distance ?? 1;
      groupedByDistance.set(distance, [...(groupedByDistance.get(distance) ?? []), node]);
    }

    const bands = [...groupedByDistance.entries()].sort((left, right) => left[0] - right[0]).map(([level, nodes]) => ({
      level,
      nodes: [...nodes].sort(compareNodePriority),
    }));
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      bands,
      ({ band, index, config }) => {
        const wrapped = getWrappedBandOffset(index, config);
        const visibleNodes = band.nodes.slice(wrapped.wrapGroup * config.maxBreadth, (wrapped.wrapGroup + 1) * config.maxBreadth);
        const visiblePositions = buildCenteredVerticalTopPositions(visibleNodes, anchorCanvasNode.y + anchorNode.height / 2, config);
        return {
          x: anchorCanvasNode.x + (band.level + wrapped.wrapGroup) * config.horizontalSpacing,
          y: visiblePositions[wrapped.indexInGroup] ?? anchorCanvasNode.y,
        };
      },
    );
  }

  const unassignedNodes = freeNodes
    .filter((node) => !assignments.has(node.id))
    .sort(compareNodePriority);
  if (unassignedNodes.length > 0) {
    const fallbackOrigin = buildFallbackFreeNodeOrigin(nextArranged, fallbackOriginY);
    nextArranged = placeBandBasedFreeComponentNodes(
      nextArranged,
      request,
      canvasNodeByKey,
      [{ level: 0, nodes: unassignedNodes }],
      ({ index, config }) => {
        const wrapped = getWrappedBandOffset(index, config);
        return {
          x: fallbackOrigin.x,
          y: fallbackOrigin.y + wrapped.indexInGroup * config.verticalSpacing + wrapped.wrapGroup * (config.maxBreadth * config.verticalSpacing + Math.round(config.componentSpacing / 2)),
        };
      },
    );
  }

  nextArranged = enforceAnchoredPlacementClearance(nextArranged, freeNodes.map((node) => node.id), request);

  return finalizeComponentPlacement(component, request, nextArranged, fallbackOriginY);
}

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

export function placeBalancedClusters(
  arranged: BrowserCanvasNode[],
  request: BrowserAutoLayoutPipelineContext['request'],
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  clusters: BalancedCluster[],
  componentEdges: BrowserAutoLayoutEdge[],
  componentOrigin: { x: number; y: number },
) {
  const config = getBrowserAutoLayoutConfig(request);
  const clusterGapX = Math.round(config.horizontalSpacing * 0.75);
  const clusterGapY = Math.round(config.componentSpacing * 0.65);
  const rowWidthLimit = Math.max(1100, Math.round((config.horizontalSpacing + 260) * 3.2));
  const sideGap = Math.round(config.horizontalSpacing * 0.45);
  const sideStackGap = Math.max(32, Math.round(config.verticalSpacing * 0.3));

  const rows = buildBalancedClusterRows(clusters, rowWidthLimit, clusterGapX);
  const connections = buildBalancedClusterConnectionGraph(clusters, componentEdges);
  const rowIndexByClusterId = new Map<string, number>();
  rows.forEach((row, rowIndex) => {
    row.clusters.forEach((cluster) => rowIndexByClusterId.set(cluster.anchor.id, rowIndex));
  });

  const previousRowCenterByClusterId = new Map<string, number>();
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (rowIndex > 0) {
      row.clusters.sort((left, right) => {
        const leftNeighbors = [...(connections.get(left.anchor.id) ?? new Set())]
          .filter((clusterId) => rowIndexByClusterId.get(clusterId) === rowIndex - 1);
        const rightNeighbors = [...(connections.get(right.anchor.id) ?? new Set())]
          .filter((clusterId) => rowIndexByClusterId.get(clusterId) === rowIndex - 1);
        const leftBarycenter = leftNeighbors.length > 0
          ? leftNeighbors.reduce((sum, clusterId) => sum + (previousRowCenterByClusterId.get(clusterId) ?? 0), 0) / leftNeighbors.length
          : Number.MAX_SAFE_INTEGER;
        const rightBarycenter = rightNeighbors.length > 0
          ? rightNeighbors.reduce((sum, clusterId) => sum + (previousRowCenterByClusterId.get(clusterId) ?? 0), 0) / rightNeighbors.length
          : Number.MAX_SAFE_INTEGER;
        if (leftBarycenter !== rightBarycenter) {
          return leftBarycenter - rightBarycenter;
        }
        const leftConnections = leftNeighbors.length;
        const rightConnections = rightNeighbors.length;
        if (leftConnections !== rightConnections) {
          return rightConnections - leftConnections;
        }
        return compareNodePriority(left.anchor, right.anchor);
      });
    }

    let localCenter = componentOrigin.x;
    for (const cluster of row.clusters) {
      previousRowCenterByClusterId.set(cluster.anchor.id, localCenter + cluster.width / 2);
      localCenter += cluster.width + clusterGapX;
    }
  }

  let nextArranged = arranged;
  let cursorY = componentOrigin.y;

  for (const row of rows) {
    let cursorX = componentOrigin.x;
    for (const cluster of row.clusters) {
      const anchorCanvasNode = canvasNodeByKey.get(cluster.anchor.key);
      if (anchorCanvasNode) {
        nextArranged = nextArranged.filter((node) => !(node.kind === anchorCanvasNode.kind && node.id === anchorCanvasNode.id));
        nextArranged.push({ ...anchorCanvasNode, x: cursorX, y: cursorY });
      }

      let sideY = cursorY;
      const sideX = cursorX + cluster.anchor.width + sideGap;
      for (const sidecar of cluster.sidecars) {
        const sideCanvasNode = canvasNodeByKey.get(sidecar.key);
        if (!sideCanvasNode) {
          continue;
        }
        nextArranged = nextArranged.filter((node) => !(node.kind === sideCanvasNode.kind && node.id === sideCanvasNode.id));
        nextArranged.push({ ...sideCanvasNode, x: sideX, y: sideY });
        sideY += sidecar.height + sideStackGap;
      }

      cursorX += cluster.width + clusterGapX;
    }
    cursorY += row.height + clusterGapY;
  }

  return nextArranged;
}

export function placeBalancedFreeComponentNodes(
  component: BrowserAutoLayoutComponent,
  context: BrowserAutoLayoutPipelineContext,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request, graph } = context;
  const componentNodes = getEntityComponentNodes(component, nodeById);
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentEdges = getComponentEdges(component, graph);
  const root = chooseBalancedComponentRoot(componentNodes, componentEdges, graph);
  if (!root) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = {
    ...getInitialEntityOrigin(arranged),
    y: fallbackOriginY,
  };

  const clusters = buildBalancedClusters(componentNodes, componentEdges, root);
  const nextArranged = placeBalancedClusters(arranged, request, canvasNodeByKey, clusters, componentEdges, componentOrigin);
  return finalizeComponentPlacement(component, request, nextArranged, fallbackOriginY);
}
