import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from "../saved-canvas";
import { createSnapshotCache, InMemorySnapshotCacheStorage } from "../snapshotCache";
import { loadSavedCanvasSnapshotForOpen, loadSelectedTargetSnapshotForSavedCanvasOpen } from "../saved-canvas/opening";
import { platformApi } from "../platformApi";
import type { FullSnapshotPayload } from "../appModel";

const snapshotRef = toSavedCanvasSnapshotRef({
  id: 'snap-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'repo-key',
  repositoryName: 'Repo',
  snapshotKey: 'repo@main#1',
  sourceBranch: 'main',
  sourceRevision: 'abc123',
  importedAt: '2026-03-24T10:00:00Z',
  runId: null,
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: 'indexer-ir-v1',
  indexerVersion: 'step8',
  scopeCount: 0,
  entityCount: 0,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 0,
  totalFileCount: 0,
  degradedFileCount: 0,
});

function buildPayload(): FullSnapshotPayload {
  return {
    snapshot: {
      id: snapshotRef.snapshotId,
      workspaceId: snapshotRef.workspaceId,
      repositoryRegistrationId: snapshotRef.repositoryRegistrationId,
      repositoryKey: snapshotRef.repositoryKey,
      repositoryName: snapshotRef.repositoryName,
      snapshotKey: snapshotRef.snapshotKey,
      sourceBranch: snapshotRef.sourceBranch,
      sourceRevision: snapshotRef.sourceRevision,
      importedAt: snapshotRef.importedAt ?? '2026-03-24T10:00:00Z',
      runId: null,
      status: 'READY',
      completenessStatus: 'COMPLETE',
      derivedRunOutcome: 'SUCCESS',
      schemaVersion: 'indexer-ir-v1',
      indexerVersion: 'step8',
      scopeCount: 0,
      entityCount: 0,
      relationshipCount: 0,
      diagnosticCount: 0,
      indexedFileCount: 0,
      totalFileCount: 0,
      degradedFileCount: 0,
    },
    source: { repositoryId: 'repo-1', acquisitionType: null, path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: [] },
    completeness: { status: 'COMPLETE', indexedFileCount: 0, totalFileCount: 0, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [],
    entities: [],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('savedCanvasOpen', () => {
  const originalGetFullSnapshotPayload = platformApi.getFullSnapshotPayload;
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    platformApi.getFullSnapshotPayload = originalGetFullSnapshotPayload;
    if (originalNavigator === undefined) {
      // @ts-expect-error test-only navigator cleanup
      delete globalThis.navigator;
    } else {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: originalNavigator,
      });
    }
  });

  test('loads original snapshot from local cache when available', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: snapshotRef.workspaceId,
      repositoryId: snapshotRef.repositoryRegistrationId,
      snapshotKey: snapshotRef.snapshotKey,
      cacheVersion: cache.buildCacheVersion(buildPayload().snapshot),
      payload: buildPayload(),
    });
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });

    const result = await loadSavedCanvasSnapshotForOpen(document, cache, 'original');

    expect(result.snapshotRef.snapshotId).toBe('snap-1');
    expect(result.availability).toBe('local-cache');
    expect(result.payload.snapshot.id).toBe('snap-1');
  });

  test('fetches original snapshot remotely and caches it when not already cached', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    const payload = buildPayload();
    platformApi.getFullSnapshotPayload = jest.fn(async () => payload) as typeof platformApi.getFullSnapshotPayload;
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });

    const result = await loadSavedCanvasSnapshotForOpen(document, cache, 'original');

    expect(platformApi.getFullSnapshotPayload).toHaveBeenCalledWith('ws-1', 'snap-1');
    expect(result.availability).toBe('fetched-remotely');
    expect((await cache.getSnapshot('snap-1'))?.payload.snapshot.id).toBe('snap-1');
  });


  test('loads the current target snapshot when the saved canvas was rebound', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    const targetSnapshotRef = {
      ...snapshotRef,
      snapshotId: 'snap-2',
      snapshotKey: 'repo@main#2',
      sourceRevision: 'def456',
      importedAt: '2026-03-25T10:00:00Z',
    };
    const targetPayload = {
      ...buildPayload(),
      snapshot: {
        ...buildPayload().snapshot,
        id: 'snap-2',
        snapshotKey: 'repo@main#2',
        sourceRevision: 'def456',
        importedAt: '2026-03-25T10:00:00Z',
      },
    };
    platformApi.getFullSnapshotPayload = jest.fn(async () => targetPayload) as typeof platformApi.getFullSnapshotPayload;
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });
    document.bindings.currentTargetSnapshot = targetSnapshotRef;

    const result = await loadSavedCanvasSnapshotForOpen(document, cache, 'currentTarget');

    expect(platformApi.getFullSnapshotPayload).toHaveBeenCalledWith('ws-1', 'snap-2');
    expect(result.snapshotRef.snapshotId).toBe('snap-2');
    expect(result.payload.snapshot.id).toBe('snap-2');
  });

  test('fails with an offline target-snapshot message when the rebound target is not cached locally', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });
    document.bindings.currentTargetSnapshot = {
      ...snapshotRef,
      snapshotId: 'snap-2',
      snapshotKey: 'repo@main#2',
    };

    await expect(loadSavedCanvasSnapshotForOpen(document, cache, 'currentTarget')).rejects.toThrow(
      'The saved canvas target snapshot repo@main#2 is not available locally and cannot be fetched while offline.',
    );
  });

  test('loads a selected target snapshot for rebinding and caches it when needed', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    const payload = buildPayload();
    const targetSnapshot = { ...payload.snapshot, id: 'snap-2', snapshotKey: 'repo@main#2', sourceRevision: 'def456', importedAt: '2026-03-25T10:00:00Z' };
    const targetPayload = { ...payload, snapshot: targetSnapshot };
    platformApi.getFullSnapshotPayload = jest.fn(async () => targetPayload) as typeof platformApi.getFullSnapshotPayload;

    const result = await loadSelectedTargetSnapshotForSavedCanvasOpen(targetSnapshot, cache);

    expect(platformApi.getFullSnapshotPayload).toHaveBeenCalledWith('ws-1', 'snap-2');
    expect(result.snapshotRef.snapshotId).toBe('snap-2');
    expect(result.availability).toBe('fetched-remotely');
    expect((await cache.getSnapshot('snap-2'))?.payload.snapshot.id).toBe('snap-2');
  });
});
