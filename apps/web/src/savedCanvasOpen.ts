import type { FullSnapshotPayload } from './appModel';
import type { SnapshotCache } from './snapshotCache';
import type { SavedCanvasDocument, SavedCanvasSnapshotRef } from './savedCanvasModel';
import { platformApi } from './platformApi';

export type SavedCanvasOpenMode = 'original' | 'currentTarget';

export type SavedCanvasOpenSnapshotResult = {
  snapshotRef: SavedCanvasSnapshotRef;
  payload: FullSnapshotPayload;
  preparedAt: string;
  availability: 'local-cache' | 'fetched-remotely';
};

function isOfflineEnvironment() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function buildUnavailableOfflineMessage(snapshotRef: SavedCanvasSnapshotRef, mode: SavedCanvasOpenMode) {
  const modeLabel = mode === 'original' ? 'original snapshot' : 'target snapshot';
  const snapshotLabel = snapshotRef.snapshotKey || snapshotRef.snapshotId;
  return `The saved canvas ${modeLabel} ${snapshotLabel} is not available locally and cannot be fetched while offline.`;
}

export async function loadSavedCanvasSnapshotForOpen(
  document: SavedCanvasDocument,
  cache: SnapshotCache,
  mode: SavedCanvasOpenMode,
): Promise<SavedCanvasOpenSnapshotResult> {
  const snapshotRef = mode === 'original'
    ? document.bindings.originSnapshot
    : (document.bindings.currentTargetSnapshot ?? document.bindings.originSnapshot);

  const cached = await cache.getSnapshot(snapshotRef.snapshotId);
  if (cached) {
    return {
      snapshotRef,
      payload: cached.payload,
      preparedAt: cached.cachedAt,
      availability: 'local-cache',
    };
  }

  if (isOfflineEnvironment()) {
    throw new Error(buildUnavailableOfflineMessage(snapshotRef, mode));
  }

  try {
    const payload = await platformApi.getFullSnapshotPayload<FullSnapshotPayload>(snapshotRef.workspaceId, snapshotRef.snapshotId);
    const stored = await cache.putSnapshot({
      workspaceId: snapshotRef.workspaceId,
      repositoryId: snapshotRef.repositoryRegistrationId,
      snapshotKey: snapshotRef.snapshotKey,
      cacheVersion: cache.buildCacheVersion(payload.snapshot),
      payload,
    });
    return {
      snapshotRef,
      payload,
      preparedAt: stored.cachedAt,
      availability: 'fetched-remotely',
    };
  } catch (error) {
    if (isOfflineEnvironment()) {
      throw new Error(buildUnavailableOfflineMessage(snapshotRef, mode));
    }
    const message = error instanceof Error ? error.message : 'Unknown snapshot loading error.';
    throw new Error(`Failed to load ${mode === 'original' ? 'original' : 'target'} snapshot ${snapshotRef.snapshotKey || snapshotRef.snapshotId} for saved canvas open. ${message}`);
  }
}
