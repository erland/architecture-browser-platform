import type { FullSnapshotPayload, SnapshotSummary } from '../../../app-model';
import type { SavedCanvasSnapshotCachePort } from '../ports/snapshotCache';
import type { SavedCanvasDocument, SavedCanvasSnapshotRef } from '../../domain/model/document';
import { platformApi } from '../../../api/platformApi';

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


async function loadSnapshotRefPayload(snapshotRef: SavedCanvasSnapshotRef, cache: SavedCanvasSnapshotCachePort): Promise<SavedCanvasOpenSnapshotResult> {
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
    throw new Error(buildUnavailableOfflineMessage(snapshotRef, 'currentTarget'));
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
      throw new Error(buildUnavailableOfflineMessage(snapshotRef, 'currentTarget'));
    }
    const message = error instanceof Error ? error.message : 'Unknown snapshot loading error.';
    throw new Error(`Failed to load target snapshot ${snapshotRef.snapshotKey || snapshotRef.snapshotId} for saved canvas open. ${message}`);
  }
}

export async function loadSelectedTargetSnapshotForSavedCanvasOpen(targetSnapshot: SnapshotSummary, cache: SavedCanvasSnapshotCachePort): Promise<SavedCanvasOpenSnapshotResult> {
  return loadSnapshotRefPayload({
    snapshotId: targetSnapshot.id,
    snapshotKey: targetSnapshot.snapshotKey,
    workspaceId: targetSnapshot.workspaceId,
    repositoryRegistrationId: targetSnapshot.repositoryRegistrationId,
    repositoryKey: targetSnapshot.repositoryKey,
    repositoryName: targetSnapshot.repositoryName,
    sourceBranch: targetSnapshot.sourceBranch,
    sourceRevision: targetSnapshot.sourceRevision,
    importedAt: targetSnapshot.importedAt,
  }, cache);
}

export async function loadSavedCanvasSnapshotForOpen(
  document: SavedCanvasDocument,
  cache: SavedCanvasSnapshotCachePort,
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
