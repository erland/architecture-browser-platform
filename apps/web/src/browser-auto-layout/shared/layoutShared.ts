import { getBrowserCanvasBounds } from '../../browser-canvas-placement/stage';
import type { BrowserCanvasNode } from '../../browser-session/types';
import type {
  BrowserAutoLayoutComponent,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../core/types';
import { compareNodePriority, orderComponentsForLayout } from './ordering';
import type { BrowserAutoLayoutEdge } from '../core/types';

export function compareIds(left: string, right: string) {
  return left.localeCompare(right);
}

export function getNodeById(graph: BrowserAutoLayoutGraph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function getCanvasNodeByKey(nodes: BrowserCanvasNode[]) {
  return new Map(nodes.map((node) => [`${node.kind}:${node.id}`, node]));
}

export function getEntityComponentNodes(
  component: BrowserAutoLayoutComponent,
  nodeById: Map<string, BrowserAutoLayoutNode>,
) {
  return component.nodeIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is BrowserAutoLayoutNode => Boolean(node && node.kind === 'entity'))
    .sort(compareNodePriority);
}

export function getComponentEdges(component: BrowserAutoLayoutComponent, graph: BrowserAutoLayoutGraph) {
  const componentNodeIds = new Set(component.nodeIds);
  return graph.edges.filter((edge) => componentNodeIds.has(edge.fromEntityId) && componentNodeIds.has(edge.toEntityId));
}

export function buildDirectedAdjacency(nodes: BrowserAutoLayoutNode[], edges: BrowserAutoLayoutEdge[]) {
  const outbound = new Map<string, Set<string>>();
  const inbound = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  for (const node of nodes) {
    outbound.set(node.id, new Set());
    inbound.set(node.id, new Set());
    indegree.set(node.id, 0);
  }
  for (const edge of edges) {
    if (!outbound.has(edge.fromEntityId) || !outbound.has(edge.toEntityId)) {
      continue;
    }
    if (!outbound.get(edge.fromEntityId)?.has(edge.toEntityId)) {
      outbound.get(edge.fromEntityId)?.add(edge.toEntityId);
      inbound.get(edge.toEntityId)?.add(edge.fromEntityId);
      indegree.set(edge.toEntityId, (indegree.get(edge.toEntityId) ?? 0) + 1);
    }
  }
  return { outbound, inbound, indegree };
}

export function getInitialEntityOrigin(arranged: BrowserCanvasNode[]) {
  const scopeNodes = arranged.filter((node) => node.kind === 'scope');
  const fallbackEntityStartX = scopeNodes.length > 0
    ? Math.max(...scopeNodes.map((node) => node.x + 280)) + 60
    : 96;
  const bounds = getBrowserCanvasBounds(arranged);
  return {
    x: fallbackEntityStartX,
    y: Math.max(96, bounds?.minY ?? 96),
  };
}

export function orderLayoutComponents(
  graph: BrowserAutoLayoutGraph,
  nodeById: Map<string, BrowserAutoLayoutNode>,
  enableOrderingHeuristics = true,
) {
  return enableOrderingHeuristics
    ? orderComponentsForLayout(graph, nodeById)
    : [...graph.components].sort((left, right) => left.id.localeCompare(right.id));
}
