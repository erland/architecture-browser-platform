import type { SnapshotSummary } from '../../app-model';
import { findPreferredPreparedSnapshotId, loadPreparedSnapshotRecordForSummary, type PreparedSnapshotCacheReadPort } from '../../browser-snapshot';

function buildSnapshot(id: string, importedAt: string): SnapshotSummary {
  return {
    id,
    workspaceId: 'ws-1',
    repositoryRegistrationId: 'repo-1',
    repositoryKey: 'platform',
    repositoryName: 'Platform',
    runId: `run-${id}`,
    snapshotKey: `${id}-key`,
    status: 'READY',
    completenessStatus: 'COMPLETE',
    derivedRunOutcome: 'SUCCESS',
    schemaVersion: '1.0.0',
    indexerVersion: '0.1.0',
    sourceRevision: id,
    sourceBranch: 'main',
    importedAt,
    scopeCount: 1,
    entityCount: 1,
    relationshipCount: 0,
    diagnosticCount: 0,
    indexedFileCount: 1,
    totalFileCount: 1,
    degradedFileCount: 0,
  };
}

describe('prepared snapshot application helpers', () => {
  test('returns only current prepared records for a snapshot summary', async () => {
    const snapshot = buildSnapshot('snap-1', '2026-03-28T00:00:00Z');
    const cache: PreparedSnapshotCacheReadPort = {
      getSnapshot: jest.fn(async () => ({
        snapshotId: snapshot.id,
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        snapshotKey: snapshot.snapshotKey,
        cacheVersion: 'v1',
        cachedAt: '2026-03-29T00:00:00Z',
        lastAccessedAt: '2026-03-29T00:00:00Z',
        payload: { snapshot } as any,
      })),
      isSnapshotCurrent: jest.fn(() => true),
    };

    const result = await loadPreparedSnapshotRecordForSummary(cache, snapshot);
    expect(result?.snapshotId).toBe(snapshot.id);
  });

  test('prefers the newest current prepared snapshot and falls back when none are prepared', async () => {
    const newest = buildSnapshot('snap-newest', '2026-03-30T00:00:00Z');
    const prepared = buildSnapshot('snap-prepared', '2026-03-28T00:00:00Z');
    const cache: PreparedSnapshotCacheReadPort = {
      getSnapshot: jest.fn(async (snapshotId: string) => snapshotId === prepared.id ? ({
        snapshotId: prepared.id,
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        snapshotKey: prepared.snapshotKey,
        cacheVersion: 'v1',
        cachedAt: '2026-03-29T00:00:00Z',
        lastAccessedAt: '2026-03-29T00:00:00Z',
        payload: { snapshot: prepared } as any,
      }) : null),
      isSnapshotCurrent: jest.fn((snapshot, record) => Boolean(record) && snapshot.id === prepared.id),
    };

    await expect(findPreferredPreparedSnapshotId({
      cache,
      snapshots: [newest, prepared],
      fallbackSnapshotId: newest.id,
    })).resolves.toBe(prepared.id);

    const emptyCache: PreparedSnapshotCacheReadPort = {
      getSnapshot: jest.fn(async () => null),
      isSnapshotCurrent: jest.fn(() => false),
    };

    await expect(findPreferredPreparedSnapshotId({
      cache: emptyCache,
      snapshots: [newest, prepared],
      fallbackSnapshotId: newest.id,
    })).resolves.toBe(newest.id);
  });
});
