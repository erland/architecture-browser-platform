import { BROWSER_ENTITY_NODE_SIZE, BROWSER_SCOPE_NODE_SIZE, getProjectionAwareCanvasNodeSize } from '../../browser-graph';
import type { BrowserAutoLayoutEdge, BrowserAutoLayoutGraph, BrowserAutoLayoutNode, BrowserAutoLayoutRequest } from '../core/types';
import { attachBrowserAutoLayoutComponents } from './components';
import { getFocusedAutoLayoutNodeId } from '../core/types';

function getNodeSize(request: BrowserAutoLayoutRequest, node: { kind: BrowserAutoLayoutNode['kind']; id: string }) {
  if (request.state) {
    return getProjectionAwareCanvasNodeSize(request.state, node);
  }
  return node.kind === 'scope' ? BROWSER_SCOPE_NODE_SIZE : BROWSER_ENTITY_NODE_SIZE;
}

function getNodeScopeId(request: BrowserAutoLayoutRequest, node: { kind: 'scope' | 'entity'; id: string }) {
  if (node.kind === 'scope') {
    return node.id;
  }
  return request.state?.index?.entitiesById.get(node.id)?.scopeId ?? null;
}

function toLayoutEdge(request: BrowserAutoLayoutRequest, relationshipId: string, fromEntityId: string, toEntityId: string): BrowserAutoLayoutEdge {
  const relationship = request.state?.index?.relationshipsById.get(relationshipId);
  return {
    relationshipId,
    fromEntityId,
    toEntityId,
    kind: relationship?.kind ?? null,
    label: relationship?.label ?? null,
  };
}

export function extractBrowserAutoLayoutGraph(request: BrowserAutoLayoutRequest): BrowserAutoLayoutGraph {
  const selectedNodeIds = new Set<string>([
    ...(request.state?.selectedEntityIds ?? []),
    ...(request.state?.focusedElement?.kind === 'scope' ? [request.state.focusedElement.id] : []),
  ]);
  const focusedNodeId = getFocusedAutoLayoutNodeId(request.state?.focusedElement ?? null);
  const anchorNodeId = focusedNodeId ?? request.state?.selectedEntityIds[0] ?? null;

  const visibleNodeIds = new Set<string>();
  const visibleEntityIds = new Set<string>();
  for (const node of request.nodes) {
    visibleNodeIds.add(node.id);
    if (node.kind === 'entity') {
      visibleEntityIds.add(node.id);
    }
  }

  const seenRelationshipIds = new Set<string>();
  const edges = request.edges
    .filter((edge) => {
      if (seenRelationshipIds.has(edge.relationshipId)) {
        return false;
      }
      if (!visibleEntityIds.has(edge.fromEntityId) || !visibleEntityIds.has(edge.toEntityId)) {
        return false;
      }
      seenRelationshipIds.add(edge.relationshipId);
      return true;
    })
    .map((edge) => toLayoutEdge(request, edge.relationshipId, edge.fromEntityId, edge.toEntityId));

  const inboundCounts = new Map<string, number>();
  const outboundCounts = new Map<string, number>();
  for (const edge of edges) {
    outboundCounts.set(edge.fromEntityId, (outboundCounts.get(edge.fromEntityId) ?? 0) + 1);
    inboundCounts.set(edge.toEntityId, (inboundCounts.get(edge.toEntityId) ?? 0) + 1);
  }

  const nodes = request.nodes
    .filter((node) => visibleNodeIds.has(node.id))
    .map<BrowserAutoLayoutNode>((node) => {
      const size = getNodeSize(request, { kind: node.kind, id: node.id });
      const selected = selectedNodeIds.has(node.id);
      const focused = focusedNodeId === node.id;
      const inboundCount = inboundCounts.get(node.id) ?? 0;
      const outboundCount = outboundCounts.get(node.id) ?? 0;
      return {
        kind: node.kind,
        id: node.id,
        key: `${node.kind}:${node.id}`,
        x: node.x,
        y: node.y,
        width: size.width,
        height: size.height,
        pinned: node.pinned === true,
        manuallyPlaced: node.manuallyPlaced === true,
        selected,
        focused,
        anchored: focused || node.pinned === true || node.manuallyPlaced === true || anchorNodeId === node.id,
        scopeId: getNodeScopeId(request, node),
        inboundCount,
        outboundCount,
        incidentCount: inboundCount + outboundCount,
      };
    });

  return attachBrowserAutoLayoutComponents({
    nodes,
    edges,
    focusedNodeId,
    anchorNodeId,
    selectedNodeIds: [...selectedNodeIds].filter((nodeId) => visibleNodeIds.has(nodeId)).sort((a, b) => a.localeCompare(b)),
  });
}
