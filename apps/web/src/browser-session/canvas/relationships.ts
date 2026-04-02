import type { FullSnapshotRelationship } from '../../app-model';
import { getArchitecturalSemantics } from '../../browser-snapshot/support';
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

function isRelationshipMeaningfulForCanvas(relationship: FullSnapshotRelationship) {
  if (getArchitecturalSemantics(relationship).length > 0) {
    return true;
  }
  if (hasAssociationSemantics(relationship) || hasAssociationDisplayMetadata(relationship)) {
    return true;
  }
  return AUTO_VISIBLE_RELATIONSHIP_KINDS.has(relationship.kind);
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
  let canvasEdges = state.canvasEdges.filter((edge) => visibleEntityIds.has(edge.fromEntityId) && visibleEntityIds.has(edge.toEntityId));
  if (visibleEntityIds.size < 2) {
    return canvasEdges;
  }
  for (const relationship of state.index.relationshipsById.values()) {
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
