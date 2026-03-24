import type { FullSnapshotPayload, SnapshotSummary } from './appModel';
import { restoreSavedCanvasToBrowserSession } from './savedCanvasSessionMapping';
import { toSavedCanvasSnapshotRef, type SavedCanvasDocument } from './savedCanvasModel';

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

  const restored = restoreSavedCanvasToBrowserSession({
    document: reboundDocument,
    payload,
    preparedAt: reviewedAt,
  });

  const totalItems = document.content.nodes.length + document.content.edges.length;
  const unresolvedCount = restored.unresolvedNodeIds.length + restored.unresolvedEdgeIds.length;
  const exactMatchCount = Math.max(0, totalItems - unresolvedCount);
  const rebindingState = unresolvedCount === 0
    ? 'EXACT'
    : exactMatchCount > 0
      ? 'PARTIAL'
      : 'UNRESOLVED';

  const unresolvedNodeIds = restored.unresolvedNodeIds.map((canvasNodeId) => {
    const unresolvedNode = document.content.nodes.find((node) => node.canvasNodeId === canvasNodeId);
    return unresolvedNode?.reference.originalSnapshotLocalId ?? canvasNodeId;
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
          remappedCount: 0,
          unresolvedCount,
          reviewedAt,
        },
      },
    },
    exactMatchCount,
    remappedCount: 0,
    unresolvedCount,
    unresolvedNodeIds,
    unresolvedEdgeIds: restored.unresolvedEdgeIds,
  };
}
