import { formatAssociationEdgeLabel } from '../browser-graph/presentation';
import { isRelationshipMeaningfulForCanvas } from '../browser-session/canvas/relationships';
import type { BrowserCanvasEdge, BrowserSessionState } from '../browser-session';
import type { BrowserProjectionEdge, BrowserProjectionNode } from './types';

export function buildProjectionSourceEntityNodeMap(nodes: BrowserProjectionNode[]): Map<string, BrowserProjectionNode> {
  return new Map(
    nodes
      .filter((node) => node.source.kind === 'entity')
      .map((node) => [node.source.id, node] as const),
  );
}

function upsertProjectionEdgeCandidate(
  edgesByRelationshipId: Map<string, BrowserCanvasEdge>,
  edge: BrowserCanvasEdge,
) {
  if (!edgesByRelationshipId.has(edge.relationshipId)) {
    edgesByRelationshipId.set(edge.relationshipId, edge);
  }
}

function collectProjectionEdgeCandidates(
  state: BrowserSessionState,
  nodesBySourceEntityId: Map<string, BrowserProjectionNode>,
  edges: BrowserCanvasEdge[],
): BrowserCanvasEdge[] {
  const index = state.index;
  if (!index) {
    return edges;
  }

  const edgeCandidatesByRelationshipId = new Map<string, BrowserCanvasEdge>();
  edges.forEach((edge) => upsertProjectionEdgeCandidate(edgeCandidatesByRelationshipId, edge));

  const visibleExpandedMemberEntityIds = new Set(
    Array.from(nodesBySourceEntityId.values())
      .filter((node) => node.isExpandedClassMember)
      .map((node) => node.source.id),
  );

  if (visibleExpandedMemberEntityIds.size === 0) {
    return Array.from(edgeCandidatesByRelationshipId.values());
  }

  for (const relationship of index.relationshipsById.values()) {
    const touchesVisibleExpandedMember =
      visibleExpandedMemberEntityIds.has(relationship.fromEntityId)
      || visibleExpandedMemberEntityIds.has(relationship.toEntityId);
    if (!touchesVisibleExpandedMember) {
      continue;
    }
    if (!nodesBySourceEntityId.has(relationship.fromEntityId) || !nodesBySourceEntityId.has(relationship.toEntityId)) {
      continue;
    }
    if (!isRelationshipMeaningfulForCanvas(relationship)) {
      continue;
    }
    upsertProjectionEdgeCandidate(edgeCandidatesByRelationshipId, {
      relationshipId: relationship.externalId,
      fromEntityId: relationship.fromEntityId,
      toEntityId: relationship.toEntityId,
    });
  }

  return Array.from(edgeCandidatesByRelationshipId.values());
}

export function buildProjectionEdges(
  state: BrowserSessionState,
  nodesBySourceEntityId: Map<string, BrowserProjectionNode>,
  edges: BrowserCanvasEdge[],
): BrowserProjectionEdge[] {
  const index = state.index;
  if (!index) {
    return [];
  }

  return collectProjectionEdgeCandidates(state, nodesBySourceEntityId, edges)
    .map((edge) => {
      const relationship = index.relationshipsById.get(edge.relationshipId);
      const fromNode = nodesBySourceEntityId.get(edge.fromEntityId);
      const toNode = nodesBySourceEntityId.get(edge.toEntityId);
      if (!relationship || !fromNode || !toNode) {
        return null;
      }
      return {
        id: `relationship:${edge.relationshipId}`,
        relationshipId: edge.relationshipId,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        fromEntityId: edge.fromEntityId,
        toEntityId: edge.toEntityId,
        label: state.appliedViewpoint?.viewpoint.id === 'persistence-model' && state.appliedViewpoint?.variant === 'show-entity-relations'
          ? (formatAssociationEdgeLabel(relationship) ?? (relationship.label?.trim() || relationship.kind))
          : (relationship.label?.trim() || relationship.kind),
        focused: state.focusedElement?.kind === 'relationship' && state.focusedElement.id === edge.relationshipId,
      };
    })
    .filter((edge): edge is BrowserProjectionEdge => Boolean(edge));
}
