import { HttpError } from '../../../api/httpClient';
import type { SavedCanvasLocalRecord, SavedCanvasRemoteRecord } from '../ports/storage';

export type SavedCanvasRemoteLocation = {
  workspaceId: string;
  snapshotId: string;
};

export function getRemoteLocation(record: SavedCanvasLocalRecord): SavedCanvasRemoteLocation {
  const snapshotRef = record.document.bindings.currentTargetSnapshot ?? record.document.bindings.originSnapshot;
  return {
    workspaceId: snapshotRef.workspaceId,
    snapshotId: snapshotRef.snapshotId,
  };
}

export function isConflictError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 409;
}

export function isNotFoundError(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 404;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 429 || error.status >= 500;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes('offline')
    || message.includes('network')
    || message.includes('timeout')
    || message.includes('temporar')
    || message.includes('fetch failed');
}

export async function withSingleRetry<T>(operation: () => Promise<T>): Promise<{ value: T; retried: boolean }> {
  try {
    return { value: await operation(), retried: false };
  } catch (error) {
    if (!isRetryableError(error)) {
      throw error;
    }
    return { value: await operation(), retried: true };
  }
}

export function toRecoveryMessage(record: SavedCanvasLocalRecord, error: unknown): string {
  const suffix = error instanceof Error ? error.message : 'remote copy no longer exists.';
  return `Saved canvas ${record.name} was recovered by creating a new backend copy because the previous remote record could not be updated (${suffix}).`;
}

export function buildConflictMessage(record: SavedCanvasLocalRecord, remoteRecord: SavedCanvasRemoteRecord | null): string {
  const remoteVersion = remoteRecord?.backendVersion ?? null;
  const base = remoteVersion
    ? `Saved canvas conflict detected. Backend version ${remoteVersion} differs from local expected version ${record.document.sync.backendVersion ?? 'none'}.`
    : 'Saved canvas conflict detected because the backend copy changed.';
  if (remoteRecord?.updatedAt) {
    return `${base} Remote copy was updated at ${remoteRecord.updatedAt}.`;
  }
  return base;
}
