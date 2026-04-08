import type { FullSnapshotRelationship } from '../../app-model';
import { getArchitecturalSemantics, getCanonicalRelationshipEvidenceIds, resolvePersistentEntityAssociationRelationships } from '../../browser-snapshot/support';
import { hasAssociationDisplayMetadata, hasAssociationSemantics } from '../../browser-graph/presentation/browserRelationshipSemantics';
import type { BrowserSessionState } from '../model/types';
import { upsertCanvasEdge } from './nodes';

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

function isPersistentEntityRelationsViewActive(state: BrowserSessionState) {
  return (state.appliedViewpoint?.viewpoint.id === 'persistence-model' && state.appliedViewpoint.variant === 'show-entity-relations')
    || (state.viewpointSelection.viewpointId === 'persistence-model' && state.viewpointSelection.variant === 'show-entity-relations');
}

function collectSuppressedEvidenceRelationshipIds(state: BrowserSessionState, visibleEntityIds: Set<string>) {
  if (!state.index || visibleEntityIds.size < 2 || !isPersistentEntityRelationsViewActive(state)) {
    return new Set<string>();
  }

  const canonicalRelationships = resolvePersistentEntityAssociationRelationships(state.index, [...visibleEntityIds]);
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
  return suppressedRelationshipIds;
}

export function syncMeaningfulCanvasEdges(state: BrowserSessionState, canvasNodes = state.canvasNodes) {
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
