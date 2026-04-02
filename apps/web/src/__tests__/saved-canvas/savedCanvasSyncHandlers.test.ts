import { HttpError } from '../../api/httpClient';
import { createSavedCanvasDocument } from '../../saved-canvas';
import {
  buildConflictMessage,
  getRemoteLocation,
  isConflictError,
  isNotFoundError,
  isRetryableError,
  toRecoveryMessage,
  withSingleRetry,
} from '../../saved-canvas/application/sync-impl/helpers';

function createRecord(overrides?: Partial<ReturnType<typeof createSavedCanvasDocument>>) {
  const document = createSavedCanvasDocument({
    canvasId: 'canvas-1',
    name: 'Orders canvas',
    originSnapshot: {
      snapshotId: 'snap-1',
      snapshotKey: 'repo@main#1',
      workspaceId: 'ws-1',
      repositoryRegistrationId: 'repo-1',
      repositoryKey: 'repo-key',
      repositoryName: 'Repo',
      sourceBranch: 'main',
      sourceRevision: 'abc123',
      importedAt: '2026-03-24T10:00:00Z',
    },
  });
  const merged = {
    ...document,
    ...overrides,
    sync: {
      ...document.sync,
      ...(overrides?.sync ?? {}),
    },
    bindings: {
      ...document.bindings,
      ...(overrides?.bindings ?? {}),
    },
  };
  return {
    canvasId: merged.canvasId,
    name: merged.name,
    workspaceId: merged.bindings.originSnapshot.workspaceId,
    repositoryRegistrationId: merged.bindings.originSnapshot.repositoryRegistrationId,
    originSnapshotId: merged.bindings.originSnapshot.snapshotId,
    currentTargetSnapshotId: merged.bindings.currentTargetSnapshot?.snapshotId ?? merged.bindings.originSnapshot.snapshotId,
    snapshotKey: merged.bindings.currentTargetSnapshot?.snapshotKey ?? merged.bindings.originSnapshot.snapshotKey,
    syncState: merged.sync.state,
    localVersion: merged.sync.localVersion,
    backendVersion: merged.sync.backendVersion ?? null,
    updatedAt: merged.metadata.updatedAt,
    lastModifiedAt: merged.sync.lastModifiedAt,
    lastSyncedAt: merged.sync.lastSyncedAt ?? null,
    document: merged,
  };
}

describe('savedCanvasSync helpers', () => {
  test('resolves remote location from current target snapshot when present', () => {
    const record = createRecord({
      bindings: {
        ...createSavedCanvasDocument({
          canvasId: 'x',
          name: 'x',
          originSnapshot: {
            snapshotId: 'snap-1', snapshotKey: 'repo@main#1', workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1', repositoryKey: 'repo-key', repositoryName: 'Repo', sourceBranch: 'main', sourceRevision: 'abc123', importedAt: '2026-03-24T10:00:00Z',
          },
        }).bindings,
        currentTargetSnapshot: {
          snapshotId: 'snap-2',
          snapshotKey: 'repo@main#2',
          workspaceId: 'ws-2',
          repositoryRegistrationId: 'repo-1',
          repositoryKey: 'repo-key',
          repositoryName: 'Repo',
          sourceBranch: 'main',
          sourceRevision: 'def456',
          importedAt: '2026-03-25T10:00:00Z',
        },
      },
    });

    expect(getRemoteLocation(record)).toEqual({ workspaceId: 'ws-2', snapshotId: 'snap-2' });
  });

  test('classifies retryable and typed HTTP errors', () => {
    expect(isConflictError(new HttpError(409, 'Conflict'))).toBe(true);
    expect(isNotFoundError(new HttpError(404, 'Missing'))).toBe(true);
    expect(isRetryableError(new HttpError(503, 'Unavailable'))).toBe(true);
    expect(isRetryableError(new Error('offline temporarily'))).toBe(true);
    expect(isRetryableError(new Error('validation failed'))).toBe(false);
  });

  test('retries a transient operation only once', async () => {
    let attempts = 0;
    const result = await withSingleRetry(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new HttpError(503, 'Unavailable');
      }
      return 'ok';
    });

    expect(result).toEqual({ value: 'ok', retried: true });
    expect(attempts).toBe(2);
  });

  test('builds recovery and conflict messages from remote state', () => {
    const record = createRecord({
      sync: {
        state: 'LOCALLY_MODIFIED',
        localVersion: 2,
        backendVersion: '6',
        lastModifiedAt: '2026-03-24T12:30:00Z',
        lastSyncedAt: '2026-03-24T12:00:00Z',
        lastSyncError: null,
        conflict: null,
      },
    });

    expect(toRecoveryMessage(record, new Error('offline'))).toContain('recovered by creating a new backend copy');
    expect(buildConflictMessage(record, {
      canvasId: 'canvas-1',
      workspaceId: 'ws-1',
      snapshotId: 'snap-1',
      name: 'Orders canvas',
      document: record.document,
      documentVersion: 7,
      backendVersion: '7',
      createdAt: '2026-03-24T10:00:00Z',
      updatedAt: '2026-03-24T12:00:00Z',
    })).toContain('Backend version 7');
  });
});
