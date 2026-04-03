import type { FullSnapshotRelationship } from '../app-model';
import type { BrowserAutoLayoutNode } from '../browser-auto-layout';
import type { InsertionDirection } from './incrementalPlacementPhases';

export function resolveInsertionDirection(
  candidateId: string,
  anchorId: string,
  relationships: FullSnapshotRelationship[],
): InsertionDirection {
  const hasCandidateToAnchor = relationships.some((relationship) => relationship.fromEntityId === candidateId && relationship.toEntityId === anchorId);
  const hasAnchorToCandidate = relationships.some((relationship) => relationship.fromEntityId === anchorId && relationship.toEntityId === candidateId);
  if (hasCandidateToAnchor && !hasAnchorToCandidate) {
    return 'left';
  }
  if (hasAnchorToCandidate && !hasCandidateToAnchor) {
    return 'right';
  }
  return 'around';
}

export function compareGraphAnchorCandidates(
  left: string,
  right: string,
  graphNodesById: Map<string, BrowserAutoLayoutNode>,
  requestedAnchorEntityId: string | null,
) {
  if (left === requestedAnchorEntityId) {
    return -1;
  }
  if (right === requestedAnchorEntityId) {
    return 1;
  }
  const leftNode = graphNodesById.get(left);
  const rightNode = graphNodesById.get(right);
  if ((leftNode?.focused ?? false) !== (rightNode?.focused ?? false)) {
    return leftNode?.focused ? -1 : 1;
  }
  if ((leftNode?.selected ?? false) !== (rightNode?.selected ?? false)) {
    return leftNode?.selected ? -1 : 1;
  }
  if ((leftNode?.anchored ?? false) !== (rightNode?.anchored ?? false)) {
    return leftNode?.anchored ? -1 : 1;
  }
  if ((leftNode?.incidentCount ?? 0) !== (rightNode?.incidentCount ?? 0)) {
    return (rightNode?.incidentCount ?? 0) - (leftNode?.incidentCount ?? 0);
  }
  return left.localeCompare(right);
}

export function chooseGraphAnchorCandidate(
  neighborIds: string[],
  graphNodesById: Map<string, BrowserAutoLayoutNode>,
  requestedAnchorEntityId: string | null,
) {
  return [...neighborIds].sort((left, right) => compareGraphAnchorCandidates(left, right, graphNodesById, requestedAnchorEntityId))[0] ?? null;
}
