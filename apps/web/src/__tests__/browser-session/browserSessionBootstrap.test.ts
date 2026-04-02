import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { bootstrapPreparedBrowserSession } from '../../hooks/useBrowserSessionBootstrap';
import { createSnapshotCache, InMemorySnapshotCacheStorage } from '../../api/snapshotCache';
import { createEmptyBrowserSessionState, openSnapshotSession, setBrowserSearch } from '../../browser-session';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-bootstrap-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-bootstrap',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
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
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser session bootstrap', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('opens a prepared local snapshot into the Browser session', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    let currentState = createEmptyBrowserSessionState();
    const outcome = await bootstrapPreparedBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
      currentState,
      openSnapshotSession: (options) => {
        currentState = openSnapshotSession(currentState, options);
      },
    });

    expect(outcome.status).toBe('ready');
    expect(outcome.opened).toBe(true);
    expect(currentState.activeSnapshot?.snapshotId).toBe(snapshotSummary.id);
    expect(currentState.index?.snapshotId).toBe(snapshotSummary.id);
  });

  test('keeps existing Browser view state when reopening the same prepared snapshot', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    let currentState = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    currentState = setBrowserSearch(currentState, 'tree', 'scope:web');

    const outcome = await bootstrapPreparedBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
      currentState,
      openSnapshotSession: (options) => {
        currentState = openSnapshotSession(currentState, options);
      },
    });

    expect(outcome.status).toBe('ready');
    expect(currentState.searchQuery).toBe('tree');
    expect(currentState.searchScopeId).toBe('scope:web');
  });


  test('fails cleanly when a cached snapshot is stale for the selected summary', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    const stalePayload = createPayload();
    stalePayload.snapshot.sourceRevision = 'old-revision';
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: cache.buildCacheVersion(stalePayload.snapshot),
      payload: stalePayload,
    });

    let currentState = createEmptyBrowserSessionState();
    const outcome = await bootstrapPreparedBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
      currentState,
      openSnapshotSession: (options) => {
        currentState = openSnapshotSession(currentState, options);
      },
    });

    expect(outcome.status).toBe('failed');
    expect(outcome.opened).toBe(false);
    expect(outcome.message).toContain('not prepared locally yet');
    expect(currentState.activeSnapshot).toBeNull();
  });

  test('fails cleanly when the selected snapshot is not prepared locally', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    let currentState = createEmptyBrowserSessionState();

    const outcome = await bootstrapPreparedBrowserSession({
      cache,
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshot: { ...snapshotSummary },
      currentState,
      openSnapshotSession: (options) => {
        currentState = openSnapshotSession(currentState, options);
      },
    });

    expect(outcome.status).toBe('failed');
    expect(outcome.opened).toBe(false);
    expect(outcome.message).toContain('not prepared locally yet');
    expect(currentState.activeSnapshot).toBeNull();
  });
});
