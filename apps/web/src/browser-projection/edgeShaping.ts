import { formatAssociationEdgeLabel } from '../browserRelationshipSemantics';
import type { BrowserCanvasEdge, BrowserSessionState } from '../browserSessionStore';
import type { BrowserProjectionEdge, BrowserProjectionNode } from './types';

export function buildProjectionSourceEntityNodeMap(nodes: BrowserProjectionNode[]): Map<string, BrowserProjectionNode> {
  return new Map(
    nodes
      .filter((node) => node.source.kind === 'entity')
      .map((node) => [node.source.id, node] as const),
  );
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

  return edges
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
