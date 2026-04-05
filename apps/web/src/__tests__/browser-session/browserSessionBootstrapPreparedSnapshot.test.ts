import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { createSnapshotCache, InMemorySnapshotCacheStorage } from '../../api/snapshotCache';
import { acquirePreparedSnapshotForBrowserSession } from '../../hooks/useBrowserSessionBootstrap.preparedSnapshot';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browser-session';

describe('browser session bootstrap prepared snapshot acquisition', () => {
  const snapshotSummary: SnapshotSummary = {
    id: 'snap-1',
    workspaceId: 'ws-1',
    repositoryRegistrationId: 'repo-1',
    repositoryKey: 'repo-1',
    repositoryName: 'Platform',
    runId: 'run-1',
    snapshotKey: 'platform-main-bootstrap',
    status: 'READY',
    completenessStatus: 'COMPLETE',
    derivedRunOutcome: 'SUCCESS',
    importedAt: '2026-03-13T00:00:00Z',
    sourceRevision: 'abc123',
    schemaVersion: '2026.03',
    indexerVersion: '1.0.0',
    sourceBranch: 'main',
    scopeCount: 2,
    entityCount: 2,
    relationshipCount: 1,
    diagnosticCount: 0,
    indexedFileCount: 1,
    totalFileCount: 1,
    degradedFileCount: 0,
  };

  function createPayload(): FullSnapshotPayload {
    return {
      snapshot: { ...snapshotSummary },
      source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
      run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
      completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      ],
      entities: [],
      relationships: [],
      viewpoints: [],
      diagnostics: [],
      metadata: { metadata: {} },
      warnings: [],
    };
  }

  test('returns a cached prepared snapshot record when one exists', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    const result = await acquirePreparedSnapshotForBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: createEmptyBrowserSessionState(),
    });

    expect(result.status).toBe('ready');
    expect(result.source).toBe('cache');
    expect(result.record?.snapshotId).toBe(snapshotSummary.id);
  });

  test('fetches and caches a prepared snapshot when missing locally', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());

    const result = await acquirePreparedSnapshotForBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState: createEmptyBrowserSessionState(),
      fetchFullSnapshotPayload: async () => createPayload(),
    });

    expect(result.status).toBe('ready');
    expect(result.source).toBe('fetched');
    await expect(cache.getSnapshot(snapshotSummary.id)).resolves.toMatchObject({
      snapshotId: snapshotSummary.id,
      repositoryId: 'repo-1',
    });
  });

  test('returns fetch failure details and stale-session clear intent when preparation fails', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    const currentState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-old',
      payload: {
        ...createPayload(),
        snapshot: { ...createPayload().snapshot, id: 'snap-old', repositoryRegistrationId: 'repo-old', snapshotKey: 'old-snapshot' },
        source: { ...createPayload().source, repositoryId: 'repo-old' },
      },
    });

    const result = await acquirePreparedSnapshotForBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: snapshotSummary,
      currentState,
      fetchFullSnapshotPayload: async () => {
        throw new Error('fetch disabled');
      },
    });

    expect(result).toMatchObject({
      status: 'failed',
      source: 'fetch-error',
      shouldClearStaleSession: true,
    });
    expect(result.message).toContain('Failed to prepare snapshot');
  });
});
