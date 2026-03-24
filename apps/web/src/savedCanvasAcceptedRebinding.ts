import type { SavedCanvasDocument } from './savedCanvasModel';

export function buildAcceptedSavedCanvasRebindingDocument(options: {
  baseline: SavedCanvasDocument;
  rebound: SavedCanvasDocument;
  acceptedAt?: string;
}): SavedCanvasDocument {
  const acceptedAt = options.acceptedAt ?? new Date().toISOString();
  const reboundRebinding = options.rebound.bindings.rebinding;

  return {
    ...options.rebound,
    canvasId: options.baseline.canvasId,
    name: options.baseline.name,
    bindings: {
      ...options.rebound.bindings,
      originSnapshot: options.baseline.bindings.originSnapshot,
      currentTargetSnapshot: options.rebound.bindings.currentTargetSnapshot ?? options.baseline.bindings.currentTargetSnapshot ?? options.baseline.bindings.originSnapshot,
      rebinding: reboundRebinding
        ? {
            ...reboundRebinding,
            reviewedAt: reboundRebinding.reviewedAt ?? acceptedAt,
          }
        : options.baseline.bindings.rebinding ?? null,
    },
    sync: {
      ...options.baseline.sync,
      state: options.baseline.sync.backendVersion ? 'LOCALLY_MODIFIED' : options.baseline.sync.state,
      localVersion: (options.baseline.sync.localVersion ?? 0) + 1,
      lastModifiedAt: acceptedAt,
      lastSyncError: null,
      conflict: null,
    },
    metadata: {
      createdAt: options.baseline.metadata.createdAt,
      updatedAt: acceptedAt,
    },
  };
}
