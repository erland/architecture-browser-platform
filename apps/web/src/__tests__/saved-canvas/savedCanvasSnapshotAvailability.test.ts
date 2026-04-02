import { createSnapshotCache, InMemorySnapshotCacheStorage } from '../../api/snapshotCache';
import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../../saved-canvas';
import type { SnapshotSummary } from '../../app-model/appModel.api';
import { buildSavedCanvasOfflineUnavailableMessage, getSavedCanvasOfflineAvailability } from '../../saved-canvas/opening';
import type { SavedCanvasLocalRecord } from '../../saved-canvas/storage';

const originSnapshot: SnapshotSummary = {
  id: 'snap-a',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-a',
  snapshotKey: 'platform-main-a',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-24T00:00:00Z',
  scopeCount: 1,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

const currentSnapshot: SnapshotSummary = {
  ...originSnapshot,
  id: 'snap-b',
  snapshotKey: 'platform-main-b',
  sourceRevision: 'def456',
  importedAt: '2026-03-25T00:00:00Z',
};

const selectedSnapshot: SnapshotSummary = {
  ...originSnapshot,
  id: 'snap-c',
  snapshotKey: 'platform-main-c',
  sourceRevision: 'ghi789',
  importedAt: '2026-03-26T00:00:00Z',
};

function buildRecord(): SavedCanvasLocalRecord {
  const document = createSavedCanvasDocument({
    canvasId: 'canvas-1',
    name: 'Orders canvas',
    originSnapshot: toSavedCanvasSnapshotRef(originSnapshot),
  });
  document.bindings.currentTargetSnapshot = toSavedCanvasSnapshotRef(currentSnapshot);
  document.sync.lastModifiedAt = '2026-03-26T10:00:00Z';
  document.metadata.updatedAt = '2026-03-26T10:00:00Z';
  return {
    canvasId: document.canvasId,
    name: document.name,
    workspaceId: 'ws-1',
    repositoryRegistrationId: 'repo-1',
    originSnapshotId: 'snap-a',
    currentTargetSnapshotId: 'snap-b',
    snapshotKey: 'platform-main-a',
    syncState: document.sync.state,
    localVersion: document.sync.localVersion,
    backendVersion: document.sync.backendVersion,
    updatedAt: document.metadata.updatedAt,
    lastModifiedAt: document.sync.lastModifiedAt,
    lastSyncedAt: document.sync.lastSyncedAt,
    document,
  };
}

describe('savedCanvasSnapshotAvailability', () => {
  test('reports offline availability for original, current target, and selected snapshot', async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: originSnapshot.snapshotKey,
      cacheVersion: cache.buildCacheVersion(originSnapshot),
      payload: {
        snapshot: originSnapshot,
        source: { repositoryId: 'repo-1', acquisitionType: null, path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
        run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: [] },
        completeness: { status: 'COMPLETE', indexedFileCount: 0, totalFileCount: 0, degradedFileCount: 0, omittedPaths: [], notes: [] },
        scopes: [], entities: [], relationships: [], viewpoints: [], diagnostics: [], metadata: { metadata: {} }, warnings: [],
      },
    });
    await cache.putSnapshot({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotKey: selectedSnapshot.snapshotKey,
      cacheVersion: cache.buildCacheVersion(selectedSnapshot),
      payload: {
        snapshot: selectedSnapshot,
        source: { repositoryId: 'repo-1', acquisitionType: null, path: null, remoteUrl: null, branch: 'main', revision: 'ghi789', acquiredAt: null },
        run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: [] },
        completeness: { status: 'COMPLETE', indexedFileCount: 0, totalFileCount: 0, degradedFileCount: 0, omittedPaths: [], notes: [] },
        scopes: [], entities: [], relationships: [], viewpoints: [], diagnostics: [], metadata: { metadata: {} }, warnings: [],
      },
    });

    const summary = await getSavedCanvasOfflineAvailability(buildRecord(), cache, selectedSnapshot);

    expect(summary.origin.availableOffline).toBe(true);
    expect(summary.currentTarget?.availableOffline).toBe(false);
    expect(summary.selected?.availableOffline).toBe(true);
    expect(summary.availableAlternativeModes).toEqual(['original', 'selected']);
  });

  test('builds an alternative-mode message for offline unavailable snapshots', () => {
    const message = buildSavedCanvasOfflineUnavailableMessage({
      canvasId: 'canvas-1',
      origin: { snapshotId: 'snap-a', snapshotLabel: 'platform-main-a', availableOffline: true },
      currentTarget: { snapshotId: 'snap-b', snapshotLabel: 'platform-main-b', availableOffline: false },
      selected: { snapshotId: 'snap-c', snapshotLabel: 'platform-main-c', availableOffline: true },
      availableAlternativeModes: ['original', 'selected'],
    }, 'currentTarget');

    expect(message).toContain('not available offline');
    expect(message).toContain('Open original (platform-main-a)');
    expect(message).toContain('Open selected (platform-main-c)');
  });
});
