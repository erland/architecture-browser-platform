import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../../saved-canvas';
import {
  InMemorySavedCanvasLocalStorage,
  createSavedCanvasLocalStore,
} from '../../saved-canvas/storage';
import type { SnapshotSummary } from '../../app-model/appModel.api';

const snapshotA: SnapshotSummary = {
  id: 'snapshot-a',
  workspaceId: 'workspace-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-a',
  snapshotKey: 'platform-main-001',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-24T00:00:00Z',
  scopeCount: 10,
  entityCount: 20,
  relationshipCount: 30,
  diagnosticCount: 0,
  indexedFileCount: 4,
  totalFileCount: 4,
  degradedFileCount: 0,
};

const snapshotB: SnapshotSummary = {
  ...snapshotA,
  id: 'snapshot-b',
  runId: 'run-b',
  snapshotKey: 'platform-main-002',
  sourceRevision: 'def456',
  importedAt: '2026-03-25T00:00:00Z',
};

function createDocument(args: {
  canvasId: string;
  name: string;
  snapshot?: SnapshotSummary;
  localVersion?: number;
  lastModifiedAt?: string;
  updatedAt?: string;
  syncState?: 'LOCAL_ONLY' | 'PENDING_SYNC' | 'SYNCHRONIZED';
}) {
  return createSavedCanvasDocument({
    canvasId: args.canvasId,
    name: args.name,
    originSnapshot: toSavedCanvasSnapshotRef(args.snapshot ?? snapshotA),
    localVersion: args.localVersion,
    lastModifiedAt: args.lastModifiedAt,
    updatedAt: args.updatedAt,
    syncState: args.syncState,
  });
}

describe('savedCanvasLocalStore', () => {
  test('stores and retrieves a saved canvas locally', async () => {
    const store = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());
    const document = createDocument({
      canvasId: 'canvas-1',
      name: 'Browser structure',
      localVersion: 2,
      lastModifiedAt: '2026-03-24T10:00:00Z',
      syncState: 'PENDING_SYNC',
    });

    const stored = await store.putCanvas(document);
    const loaded = await store.getCanvas('canvas-1');

    expect(stored.canvasId).toBe('canvas-1');
    expect(stored.originSnapshotId).toBe('snapshot-a');
    expect(stored.syncState).toBe('PENDING_SYNC');
    expect(loaded?.document.name).toBe('Browser structure');
    expect(loaded?.document.sync.localVersion).toBe(2);
  });

  test('lists canvases ordered by last modified time descending', async () => {
    const store = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());

    await store.putCanvas(createDocument({
      canvasId: 'canvas-older',
      name: 'Older',
      lastModifiedAt: '2026-03-24T08:00:00Z',
      updatedAt: '2026-03-24T08:00:00Z',
    }));
    await store.putCanvas(createDocument({
      canvasId: 'canvas-newer',
      name: 'Newer',
      lastModifiedAt: '2026-03-24T11:00:00Z',
      updatedAt: '2026-03-24T11:00:00Z',
    }));

    const listed = await store.listCanvases();
    expect(listed.map((record) => record.canvasId)).toEqual(['canvas-newer', 'canvas-older']);
  });

  test('filters local canvases by workspace, repository, and snapshot', async () => {
    const store = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());

    await store.putCanvas(createDocument({
      canvasId: 'canvas-a',
      name: 'Snapshot A',
      snapshot: snapshotA,
    }));
    await store.putCanvas(createDocument({
      canvasId: 'canvas-b',
      name: 'Snapshot B',
      snapshot: snapshotB,
    }));

    const workspaceFiltered = await store.listCanvases({ workspaceId: 'workspace-1' });
    const snapshotFiltered = await store.listCanvases({ snapshotId: 'snapshot-b' });
    const repositoryFiltered = await store.listCanvases({ repositoryRegistrationId: 'repo-1' });

    expect(workspaceFiltered).toHaveLength(2);
    expect(repositoryFiltered).toHaveLength(2);
    expect(snapshotFiltered.map((record) => record.canvasId)).toEqual(['canvas-b']);
  });

  test('deletes saved canvases from local storage', async () => {
    const store = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());

    await store.putCanvas(createDocument({
      canvasId: 'canvas-delete',
      name: 'Delete me',
    }));
    expect(await store.hasCanvas('canvas-delete')).toBe(true);

    await store.deleteCanvas('canvas-delete');

    expect(await store.hasCanvas('canvas-delete')).toBe(false);
    expect(await store.getCanvas('canvas-delete')).toBeNull();
  });
});


test('listCanvases hides deleted-pending-sync tombstones unless requested', async () => {
  const storage = new Map<string, any>();
  const store = createSavedCanvasLocalStore({
    async get(canvasId) { return storage.get(canvasId) ?? null; },
    async put(document) {
      const record = {
        canvasId: document.canvasId,
        name: document.name,
        workspaceId: document.bindings.originSnapshot.workspaceId,
        repositoryRegistrationId: document.bindings.originSnapshot.repositoryRegistrationId,
        originSnapshotId: document.bindings.originSnapshot.snapshotId,
        currentTargetSnapshotId: document.bindings.currentTargetSnapshot?.snapshotId ?? document.bindings.originSnapshot.snapshotId,
        snapshotKey: document.bindings.originSnapshot.snapshotKey,
        syncState: document.sync.state,
        localVersion: document.sync.localVersion,
        backendVersion: document.sync.backendVersion ?? null,
        lastModifiedAt: document.sync.lastModifiedAt,
        lastSyncedAt: document.sync.lastSyncedAt ?? null,
        document,
      };
      storage.set(document.canvasId, record);
      return record;
    },
    async has(canvasId) { return storage.has(canvasId); },
    async remove(canvasId) { storage.delete(canvasId); },
    async clear() { storage.clear(); },
    async list() { return [...storage.values()]; },
  });

  await store.putCanvas(createSavedCanvasDocument({
    canvasId: 'canvas-deleted',
    name: 'Deleted',
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
    syncState: 'DELETED_LOCALLY_PENDING_SYNC',
  }));

  expect((await store.listCanvases()).length).toBe(0);
  expect((await store.listCanvases({ includeDeletedPendingSync: true })).length).toBe(1);
});
