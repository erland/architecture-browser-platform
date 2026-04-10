import type { BrowserCanvasNode } from '../../../browser-session/types';
import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutNode,
} from '../../core/types';
import type { BrowserAutoLayoutComponentModel } from '../../shared/componentModel';
import type { BrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import { compareNodePriority } from '../../shared/ordering';
import { getBrowserAutoLayoutConfig } from '../../core/config';
import { createBrowserAutoLayoutComponentOrigin } from '../../shared/componentModel';
import { finalizeComponentPlacement } from '../../shared/layoutAnchoredPlacement';
import {
  BalancedCluster,
  buildBalancedClusterConnectionGraph,
  buildBalancedClusterRows,
  buildBalancedClusters,
} from './balancedLayoutModel';
import { chooseBalancedComponentRoot } from './balancedLayoutSemantics';

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
  componentModel: BrowserAutoLayoutComponentModel,
  context: BrowserAutoLayoutPipelineContext,
  _nodeById: Map<string, BrowserAutoLayoutNode>,
  canvasNodeByKey: Map<string, BrowserCanvasNode>,
  arranged: BrowserCanvasNode[],
  fallbackOriginY: number,
) {
  const { request } = context;
  const { entityNodes: componentNodes, edges: componentEdges } = componentModel;
  if (componentNodes.length === 0) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const root = chooseBalancedComponentRoot(componentNodes, componentEdges, context.graph);
  if (!root) {
    return { arranged, nextOriginY: fallbackOriginY };
  }

  const componentOrigin = createBrowserAutoLayoutComponentOrigin(arranged, fallbackOriginY);
  const clusters = buildBalancedClusters(componentNodes, componentEdges, root);
  const nextArranged = placeBalancedClusters(arranged, request, canvasNodeByKey, clusters, componentEdges, componentOrigin);
  return finalizeComponentPlacement(componentModel.component, request, nextArranged, fallbackOriginY);
}
