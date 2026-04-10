import type { FullSnapshotRelationship } from '../../app-model';
import { getArchitecturalSemantics, getCanonicalEntityAssociationContext, getCanonicalRelationshipEvidenceIds, isShadowedByCanonicalEntityAssociation } from '../../browser-snapshot/support';
import { hasAssociationDisplayMetadata, hasAssociationSemantics } from '../presentation/browserRelationshipSemantics';
import type { BrowserCanvasNode, BrowserGraphPipelineState } from '../contracts';


function upsertCanvasEdge(edges: BrowserGraphPipelineState['canvasEdges'], nextEdge: BrowserGraphPipelineState['canvasEdges'][number]) {
  const existing = edges.find((edge) => edge.relationshipId === nextEdge.relationshipId);
  return existing ? edges : [...edges, nextEdge];
}

const AUTO_VISIBLE_RELATIONSHIP_KINDS = new Set([
  'CALLS',
  'USES',
  'DEPENDS_ON',
  'CONTAINS',
  'NAVIGATES_TO',
  'REDIRECTS_TO',
  'GUARDS',
  'IMPLEMENTS',
  'EXTENDS',
  'COMPOSES',
  'ASSOCIATES_WITH',
  'ASSOCIATION',
]);

export function isRelationshipMeaningfulForCanvas(relationship: FullSnapshotRelationship) {
  if (getArchitecturalSemantics(relationship).length > 0) {
    return true;
  }
  if (hasAssociationSemantics(relationship) || hasAssociationDisplayMetadata(relationship)) {
    return true;
  }
  return AUTO_VISIBLE_RELATIONSHIP_KINDS.has(relationship.kind);
}

function isPersistentEntityRelationsViewActive(state: BrowserGraphPipelineState) {
  return (state.appliedViewpoint?.viewpoint.id === 'persistence-model' && state.appliedViewpoint.variant === 'show-entity-relations')
    || (state.viewpointSelection.viewpointId === 'persistence-model' && state.viewpointSelection.variant === 'show-entity-relations');
}

function collectSuppressedEvidenceRelationshipIds(state: BrowserGraphPipelineState, visibleEntityIds: Set<string>) {
  if (!state.index || visibleEntityIds.size < 2) {
    return new Set<string>();
  }

  const { relationships: canonicalRelationships, canonicalRelationshipIds, canonicalPairKeys } = getCanonicalEntityAssociationContext(state.index, [...visibleEntityIds]);
  if (canonicalRelationships.length === 0) {
    return new Set<string>();
  }

  const suppressedRelationshipIds = new Set<string>();
  for (const relationship of canonicalRelationships) {
    if (!visibleEntityIds.has(relationship.fromEntityId) || !visibleEntityIds.has(relationship.toEntityId)) {
      continue;
    }
    for (const relationshipId of getCanonicalRelationshipEvidenceIds(state.index, relationship)) {
      if (relationshipId !== relationship.externalId) {
        suppressedRelationshipIds.add(relationshipId);
      }
    }
  }

  for (const relationship of state.index.relationshipsById.values()) {
    if (!visibleEntityIds.has(relationship.fromEntityId) || !visibleEntityIds.has(relationship.toEntityId)) {
      continue;
    }
    if (isShadowedByCanonicalEntityAssociation(relationship, canonicalRelationshipIds, canonicalPairKeys)) {
      suppressedRelationshipIds.add(relationship.externalId);
    }
  }

  return suppressedRelationshipIds;
}

export function syncMeaningfulCanvasEdges(
  state: BrowserGraphPipelineState,
  canvasNodes: BrowserCanvasNode[] = state.canvasNodes,
) {
  if (!state.index) {
    return state.canvasEdges;
  }
  const visibleEntityIds = new Set(
    canvasNodes
      .filter((node) => node.kind === 'entity')
      .map((node) => node.id),
  );
  const suppressedRelationshipIds = collectSuppressedEvidenceRelationshipIds(state, visibleEntityIds);
  let canvasEdges = state.canvasEdges.filter((edge) => (
    visibleEntityIds.has(edge.fromEntityId)
      && visibleEntityIds.has(edge.toEntityId)
      && !suppressedRelationshipIds.has(edge.relationshipId)
  ));
  if (visibleEntityIds.size < 2) {
    return canvasEdges;
  }

  if (isPersistentEntityRelationsViewActive(state) && state.appliedViewpoint?.relationshipIds.length) {
    const allowedRelationshipIds = new Set(state.appliedViewpoint.relationshipIds);
    return canvasEdges.filter((edge) => allowedRelationshipIds.has(edge.relationshipId));
  }

  for (const relationship of state.index.relationshipsById.values()) {
    if (suppressedRelationshipIds.has(relationship.externalId)) {
      continue;
    }
    if (!visibleEntityIds.has(relationship.fromEntityId) || !visibleEntityIds.has(relationship.toEntityId)) {
      continue;
    }
    if (!isRelationshipMeaningfulForCanvas(relationship)) {
      continue;
    }
    canvasEdges = upsertCanvasEdge(canvasEdges, {
      relationshipId: relationship.externalId,
      fromEntityId: relationship.fromEntityId,
      toEntityId: relationship.toEntityId,
    });
  }
  return canvasEdges;
}
