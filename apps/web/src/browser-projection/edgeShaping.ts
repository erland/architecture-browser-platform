import { formatAssociationEdgeLabel, getAssociationEndpointLabels, getAssociationRoleLabel, isContainmentAssociation } from '../browser-graph/presentation';
import { getCanonicalEntityAssociationContext, getCanonicalRelationshipEvidenceIds, isShadowedByCanonicalEntityAssociation } from '../browser-snapshot/support';
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

function isPersistenceEntityRelationsView(state: BrowserSessionState) {
  return state.appliedViewpoint?.viewpoint.id === 'persistence-model'
    && state.appliedViewpoint.variant === 'show-entity-relations';
}

function collectSuppressedProjectionRelationshipIds(
  state: BrowserSessionState,
  nodesBySourceEntityId: Map<string, BrowserProjectionNode>,
) {
  const index = state.index;
  if (!index) {
    return new Set<string>();
  }

  const visibleEntityIds = new Set(
    Array.from(nodesBySourceEntityId.values())
      .filter((node) => node.source.kind === 'entity')
      .map((node) => node.source.id),
  );
  const { relationships: canonicalRelationships, canonicalRelationshipIds, canonicalPairKeys } = getCanonicalEntityAssociationContext(index, [...visibleEntityIds]);
  const suppressedRelationshipIds = new Set<string>();
  for (const relationship of canonicalRelationships) {
    for (const relationshipId of getCanonicalRelationshipEvidenceIds(index, relationship)) {
      if (relationshipId !== relationship.externalId) {
        suppressedRelationshipIds.add(relationshipId);
      }
    }
  }
  for (const relationship of index.relationshipsById.values()) {
    if (!visibleEntityIds.has(relationship.fromEntityId) || !visibleEntityIds.has(relationship.toEntityId)) {
      continue;
    }
    if (isShadowedByCanonicalEntityAssociation(relationship, canonicalRelationshipIds, canonicalPairKeys)) {
      suppressedRelationshipIds.add(relationship.externalId);
    }
  }
  return suppressedRelationshipIds;
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

  const suppressedRelationshipIds = collectSuppressedProjectionRelationshipIds(state, nodesBySourceEntityId);
  const allowedRelationshipIds = isPersistenceEntityRelationsView(state) && state.appliedViewpoint?.relationshipIds.length
    ? new Set(state.appliedViewpoint.relationshipIds)
    : null;
  const edgeCandidatesByRelationshipId = new Map<string, BrowserCanvasEdge>();
  edges
    .filter((edge) => !suppressedRelationshipIds.has(edge.relationshipId) && (!allowedRelationshipIds || allowedRelationshipIds.has(edge.relationshipId)))
    .forEach((edge) => upsertProjectionEdgeCandidate(edgeCandidatesByRelationshipId, edge));

  const visibleExpandedMemberEntityIds = new Set(
    Array.from(nodesBySourceEntityId.values())
      .filter((node) => node.isExpandedClassMember)
      .map((node) => node.source.id),
  );

  if (visibleExpandedMemberEntityIds.size === 0) {
    return Array.from(edgeCandidatesByRelationshipId.values());
  }

  for (const relationship of index.relationshipsById.values()) {
    if (suppressedRelationshipIds.has(relationship.externalId) || (allowedRelationshipIds && !allowedRelationshipIds.has(relationship.externalId))) {
      continue;
    }
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

function buildEntityPairKey(fromEntityId: string, toEntityId: string) {
  return fromEntityId < toEntityId ? `${fromEntityId}::${toEntityId}` : `${toEntityId}::${fromEntityId}`;
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

  const edgeCandidates = collectProjectionEdgeCandidates(state, nodesBySourceEntityId, edges);
  const pairCounts = new Map<string, number>();
  for (const edge of edgeCandidates) {
    const pairKey = buildEntityPairKey(edge.fromEntityId, edge.toEntityId);
    pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
  }

  const result: BrowserProjectionEdge[] = [];
  for (const edge of edgeCandidates) {
    const relationship = index.relationshipsById.get(edge.relationshipId);
    const fromNode = nodesBySourceEntityId.get(edge.fromEntityId);
    const toNode = nodesBySourceEntityId.get(edge.toEntityId);
    if (!relationship || !fromNode || !toNode) {
      continue;
    }
    const isPersistenceEntityRelations = state.appliedViewpoint?.viewpoint.id === 'persistence-model'
      && state.appliedViewpoint?.variant === 'show-entity-relations';
    const endpointLabels = isPersistenceEntityRelations ? getAssociationEndpointLabels(relationship) : undefined;
    const semanticStyle = isPersistenceEntityRelations && isContainmentAssociation(relationship)
      ? 'containment'
      : undefined;
    const fallbackLabel = isPersistenceEntityRelations
      ? (formatAssociationEdgeLabel(relationship) ?? (relationship.label?.trim() || relationship.kind))
      : (relationship.label?.trim() || relationship.kind);
    const hasParallelEntityAssociations = (pairCounts.get(buildEntityPairKey(edge.fromEntityId, edge.toEntityId)) ?? 0) > 1;
    const roleLabel = isPersistenceEntityRelations && hasParallelEntityAssociations
      ? getAssociationRoleLabel(relationship)
      : undefined;
    result.push({
      id: `relationship:${edge.relationshipId}`,
      relationshipId: edge.relationshipId,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      fromEntityId: edge.fromEntityId,
      toEntityId: edge.toEntityId,
      label: roleLabel ?? (endpointLabels?.fromLabel || endpointLabels?.toLabel
        ? (semanticStyle === 'containment' ? 'containment' : undefined)
        : fallbackLabel),
      fromLabel: endpointLabels?.fromLabel,
      toLabel: endpointLabels?.toLabel,
      semanticStyle,
      focused: state.focusedElement?.kind === 'relationship' && state.focusedElement.id === edge.relationshipId,
    });
  }
  return result;
}
