import type { SavedCanvasBrowserSessionState } from './browserSessionPort';
import type { SavedCanvasDocument } from '../../domain/model/document';
import { createSavedCanvasDocumentFromBrowserSession } from './sessionMapping';

export function buildSavedCanvasTrackedDocument(options: {
  state: SavedCanvasBrowserSessionState;
  baseline: SavedCanvasDocument;
}): SavedCanvasDocument {
  const mapped = createSavedCanvasDocumentFromBrowserSession({
    state: options.state,
    canvasId: options.baseline.canvasId,
    name: options.baseline.name,
    syncState: options.baseline.sync.state,
    localVersion: options.baseline.sync.localVersion,
    backendVersion: options.baseline.sync.backendVersion ?? null,
    createdAt: options.baseline.metadata.createdAt,
    updatedAt: options.baseline.metadata.updatedAt,
    lastModifiedAt: options.baseline.sync.lastModifiedAt,
    lastSyncedAt: options.baseline.sync.lastSyncedAt ?? null,
    lastSyncError: options.baseline.sync.lastSyncError ?? null,
  });

  return {
    ...mapped,
    bindings: {
      ...mapped.bindings,
      originSnapshot: options.baseline.bindings.originSnapshot,
      currentTargetSnapshot: options.baseline.bindings.currentTargetSnapshot ?? mapped.bindings.currentTargetSnapshot,
      rebinding: options.baseline.bindings.rebinding ?? null,
    },
    sync: {
      ...mapped.sync,
      state: options.baseline.sync.state,
      localVersion: options.baseline.sync.localVersion,
      backendVersion: options.baseline.sync.backendVersion ?? null,
      lastModifiedAt: options.baseline.sync.lastModifiedAt,
      lastSyncedAt: options.baseline.sync.lastSyncedAt ?? null,
      lastSyncError: options.baseline.sync.lastSyncError ?? null,
      conflict: options.baseline.sync.conflict ?? null,
    },
    metadata: {
      createdAt: options.baseline.metadata.createdAt,
      updatedAt: options.baseline.metadata.updatedAt,
    },
  };
}

export function hasSavedCanvasTrackedNameEdit(draftName: string, baseline: SavedCanvasDocument | null | undefined) {
  if (!baseline) {
    return false;
  }
  return draftName.trim() !== baseline.name.trim();
}

export function hasSavedCanvasTrackedContentEdits(options: {
  state: SavedCanvasBrowserSessionState;
  baseline: SavedCanvasDocument | null | undefined;
}): boolean {
  if (!options.baseline || !options.state.activeSnapshot || !options.state.payload || !options.state.index) {
    return false;
  }
  const current = buildSavedCanvasTrackedDocument({
    state: options.state,
    baseline: options.baseline,
  });
  return normalizeSavedCanvasForEditTracking(current) !== normalizeSavedCanvasForEditTracking(options.baseline);
}

export function normalizeSavedCanvasForEditTracking(document: SavedCanvasDocument): string {
  return JSON.stringify({
    canvasId: document.canvasId,
    name: document.name.trim(),
    bindings: {
      originSnapshotId: document.bindings.originSnapshot.snapshotId,
      currentTargetSnapshotId: document.bindings.currentTargetSnapshot?.snapshotId ?? null,
      rebinding: document.bindings.rebinding
        ? {
            sourceSnapshotId: document.bindings.rebinding.sourceSnapshotId,
            targetSnapshotId: document.bindings.rebinding.targetSnapshotId,
            rebindingState: document.bindings.rebinding.rebindingState,
            exactMatchCount: document.bindings.rebinding.exactMatchCount,
            remappedCount: document.bindings.rebinding.remappedCount,
            unresolvedCount: document.bindings.rebinding.unresolvedCount,
            reviewedAt: document.bindings.rebinding.reviewedAt ?? null,
          }
        : null,
    },
    nodes: [...document.content.nodes]
      .sort((left, right) => left.canvasNodeId.localeCompare(right.canvasNodeId))
      .map((node) => ({
        canvasNodeId: node.canvasNodeId,
        stableKey: node.reference.stableKey,
        targetType: node.reference.targetType,
        originalSnapshotLocalId: node.reference.originalSnapshotLocalId ?? null,
        position: node.position,
        size: node.size ?? null,
        presentation: node.presentation,
        annotationIds: [...node.annotationIds].sort(),
        metadata: sortUnknownRecord(node.metadata),
      })),
    edges: [...document.content.edges]
      .sort((left, right) => left.canvasEdgeId.localeCompare(right.canvasEdgeId))
      .map((edge) => ({
        canvasEdgeId: edge.canvasEdgeId,
        stableKey: edge.reference.stableKey,
        targetType: edge.reference.targetType,
        originalSnapshotLocalId: edge.reference.originalSnapshotLocalId ?? null,
        sourceCanvasNodeId: edge.sourceCanvasNodeId,
        targetCanvasNodeId: edge.targetCanvasNodeId,
        presentation: edge.presentation,
        annotationIds: [...edge.annotationIds].sort(),
        metadata: sortUnknownRecord(edge.metadata),
      })),
    annotations: [...document.content.annotations]
      .sort((left, right) => left.annotationId.localeCompare(right.annotationId))
      .map((annotation) => ({
        annotationId: annotation.annotationId,
        kind: annotation.kind,
        text: annotation.text,
        anchor: annotation.anchor,
        metadata: sortUnknownRecord(annotation.metadata),
      })),
    presentation: {
      viewport: document.presentation.viewport,
      activeViewpointId: document.presentation.activeViewpointId ?? null,
      layoutMode: document.presentation.layoutMode ?? null,
      filters: {
        hiddenNodeIds: [...document.presentation.filters.hiddenNodeIds].sort(),
        hiddenEdgeIds: [...document.presentation.filters.hiddenEdgeIds].sort(),
      },
    },
  });
}

function sortUnknownRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}
