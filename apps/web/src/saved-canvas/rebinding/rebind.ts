import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { getOrBuildBrowserSnapshotIndex } from '../../browser-snapshot';
import { restoreSavedCanvasToBrowserSession } from '../browser-state/sessionMapping';
import { toSavedCanvasSnapshotRef, type SavedCanvasDocument } from '../model/document';
import { resolveSavedCanvasReferenceWithFallback } from './stableReferences';

export type SavedCanvasRebindResult = {
  document: SavedCanvasDocument;
  exactMatchCount: number;
  remappedCount: number;
  unresolvedCount: number;
  unresolvedNodeIds: string[];
  unresolvedEdgeIds: string[];
};

export function rebindSavedCanvasToTargetSnapshot(
  document: SavedCanvasDocument,
  targetSnapshot: SnapshotSummary,
  payload: FullSnapshotPayload,
  reviewedAt = new Date().toISOString(),
): SavedCanvasRebindResult {
  const reboundDocument: SavedCanvasDocument = {
    ...document,
    bindings: {
      ...document.bindings,
      currentTargetSnapshot: toSavedCanvasSnapshotRef(targetSnapshot),
    },
  };

  const index = getOrBuildBrowserSnapshotIndex(payload);
  let exactMatchCount = 0;
  let remappedCount = 0;
  const unresolvedNodeIds: string[] = [];
  const unresolvedEdgeIds: string[] = [];

  for (const node of document.content.nodes) {
    const resolution = resolveSavedCanvasReferenceWithFallback(index, node.reference);
    if (!resolution.resolvedId) {
      unresolvedNodeIds.push(node.reference.originalSnapshotLocalId ?? node.canvasNodeId);
    } else if (resolution.strategy === 'DIRECT_ID' || resolution.strategy === 'EXACT_STABLE_KEY') {
      exactMatchCount += 1;
    } else {
      remappedCount += 1;
    }
  }

  for (const edge of document.content.edges) {
    const resolution = resolveSavedCanvasReferenceWithFallback(index, edge.reference);
    if (!resolution.resolvedId) {
      unresolvedEdgeIds.push(edge.reference.originalSnapshotLocalId ?? edge.canvasEdgeId);
    } else if (resolution.strategy === 'DIRECT_ID' || resolution.strategy === 'EXACT_STABLE_KEY') {
      exactMatchCount += 1;
    } else {
      remappedCount += 1;
    }
  }

  const unresolvedCount = unresolvedNodeIds.length + unresolvedEdgeIds.length;
  const rebindingState = unresolvedCount === 0
    ? (remappedCount > 0 ? 'PARTIAL' : 'EXACT')
    : (exactMatchCount > 0 || remappedCount > 0)
      ? 'PARTIAL'
      : 'UNRESOLVED';

  const restored = restoreSavedCanvasToBrowserSession({
    document: reboundDocument,
    payload,
    preparedAt: reviewedAt,
  });

  return {
    document: {
      ...reboundDocument,
      bindings: {
        ...reboundDocument.bindings,
        rebinding: {
          sourceSnapshotId: document.bindings.currentTargetSnapshot?.snapshotId ?? document.bindings.originSnapshot.snapshotId,
          targetSnapshotId: targetSnapshot.id,
          rebindingState,
          exactMatchCount,
          remappedCount,
          unresolvedCount,
          reviewedAt,
        },
      },
    },
    exactMatchCount,
    remappedCount,
    unresolvedCount,
    unresolvedNodeIds: unresolvedNodeIds.length > 0 ? unresolvedNodeIds : restored.unresolvedNodeIds.map((canvasNodeId) => {
      const unresolvedNode = document.content.nodes.find((node) => node.canvasNodeId === canvasNodeId);
      return unresolvedNode?.reference.originalSnapshotLocalId ?? canvasNodeId;
    }),
    unresolvedEdgeIds: unresolvedEdgeIds.length > 0 ? unresolvedEdgeIds : restored.unresolvedEdgeIds,
  };
}
