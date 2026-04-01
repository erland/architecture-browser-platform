import { HttpError } from '../httpClient';
import { createSavedCanvasLocalStore } from '../saved-canvas/storage';
import { createSavedCanvasDocument } from '../saved-canvas';
import { createSavedCanvasSyncService, markSavedCanvasPendingSync } from '../saved-canvas/syncing';

function createInMemoryLocalStore() {
  const records = new Map<string, ReturnType<typeof createSavedCanvasDocument>>();
  return createSavedCanvasLocalStore({
    async get(canvasId) {
      const document = records.get(canvasId);
      if (!document) {
        return null;
      }
      return {
        canvasId: document.canvasId,
        name: document.name,
        workspaceId: document.bindings.originSnapshot.workspaceId,
        repositoryRegistrationId: document.bindings.originSnapshot.repositoryRegistrationId,
        originSnapshotId: document.bindings.originSnapshot.snapshotId,
        currentTargetSnapshotId: document.bindings.currentTargetSnapshot?.snapshotId ?? document.bindings.originSnapshot.snapshotId,
        snapshotKey: document.bindings.currentTargetSnapshot?.snapshotKey ?? document.bindings.originSnapshot.snapshotKey,
        syncState: document.sync.state,
        localVersion: document.sync.localVersion,
        backendVersion: document.sync.backendVersion ?? null,
        updatedAt: document.metadata.updatedAt,
        lastModifiedAt: document.sync.lastModifiedAt,
        lastSyncedAt: document.sync.lastSyncedAt ?? null,
        document,
      };
    },
    async put(document) {
      records.set(document.canvasId, structuredClone(document));
      return (await this.get(document.canvasId))!;
    },
    async has(canvasId) {
      return records.has(canvasId);
    },
    async remove(canvasId) {
      records.delete(canvasId);
    },
    async clear() {
      records.clear();
    },
    async list() {
      return Promise.all([...records.keys()].map((canvasId) => this.get(canvasId))) as never;
    },
  });
}

function createDocument(overrides?: Partial<ReturnType<typeof createSavedCanvasDocument>>) {
  const document = createSavedCanvasDocument({
    canvasId: 'local-canvas-1',
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
  return {
    ...document,
    ...overrides,
    sync: {
      ...document.sync,
      ...(overrides?.sync ?? {}),
    },
  };
}

describe('savedCanvasSync', () => {
  test('creates a remote canvas for pending local work and marks it synchronized', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(async (_workspaceId: string, _snapshotId: string, document) => ({
        canvasId: 'remote-canvas-9',
        workspaceId: 'ws-1',
        snapshotId: 'snap-1',
        name: document.name,
        document: { ...document, canvasId: 'remote-canvas-9' },
        documentVersion: 1,
        backendVersion: '1',
        createdAt: document.metadata.createdAt,
        updatedAt: document.metadata.updatedAt,
      })),
      updateCanvas: jest.fn(),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    const document = markSavedCanvasPendingSync(createDocument());
    await localStore.putCanvas(document);

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });
    const synchronized = await localStore.getCanvas('remote-canvas-9');

    expect(result.uploadedCount).toBe(1);
    expect(await localStore.getCanvas('local-canvas-1')).toBeNull();
    expect(synchronized?.syncState).toBe('SYNCHRONIZED');
    expect(synchronized?.backendVersion).toBe('1');
  });


  test('syncs against the current target snapshot after a canvas has been rebound', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(async (_workspaceId: string, snapshotId: string, document) => ({
        canvasId: 'remote-canvas-target',
        workspaceId: 'ws-1',
        snapshotId,
        name: document.name,
        document: { ...document, canvasId: 'remote-canvas-target' },
        documentVersion: 1,
        backendVersion: '1',
        createdAt: document.metadata.createdAt,
        updatedAt: document.metadata.updatedAt,
      })),
      updateCanvas: jest.fn(),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    await localStore.putCanvas(markSavedCanvasPendingSync(createDocument({
      bindings: {
        ...createDocument().bindings,
        currentTargetSnapshot: {
          ...createDocument().bindings.originSnapshot,
          snapshotId: 'snap-2',
          snapshotKey: 'repo@main#2',
          sourceRevision: 'def456',
          importedAt: '2026-03-25T10:00:00Z',
        },
      },
    })));

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });

    expect(result.uploadedCount).toBe(1);
    expect(remoteStore.createCanvas).toHaveBeenCalledWith('ws-1', 'snap-2', expect.objectContaining({ canvasId: 'local-canvas-1' }));
    expect(await localStore.getCanvas('remote-canvas-target')).not.toBeNull();
  });

  test('keeps pending work locally when sync fails', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(async () => {
        throw new Error('offline');
      }),
      updateCanvas: jest.fn(),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    const document = markSavedCanvasPendingSync(createDocument());
    await localStore.putCanvas(document);

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });
    const stillPending = await localStore.getCanvas('local-canvas-1');

    expect(result.failedCount).toBe(1);
    expect(stillPending?.syncState).toBe('PENDING_SYNC');
    expect(stillPending?.document.sync.lastSyncError).toBe('offline');
  });

  test('marks synchronized canvases for deferred delete and removes them after successful sync', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(),
      updateCanvas: jest.fn(),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(async () => undefined),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    const document = createDocument({
      canvasId: 'remote-canvas-2',
      sync: {
        state: 'SYNCHRONIZED',
        localVersion: 2,
        backendVersion: '2',
        lastModifiedAt: '2026-03-24T11:00:00Z',
        lastSyncedAt: '2026-03-24T11:00:00Z',
        lastSyncError: null,
        conflict: null,
      },
    });
    const record = await localStore.putCanvas(document);

    await syncService.markCanvasDeletedPendingSync(record);
    const pendingDelete = await localStore.getCanvas('remote-canvas-2');
    expect(pendingDelete?.syncState).toBe('DELETED_LOCALLY_PENDING_SYNC');

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });
    expect(result.deletedCount).toBe(1);
    expect(await localStore.getCanvas('remote-canvas-2')).toBeNull();
    expect(remoteStore.deleteCanvas).toHaveBeenCalledWith('ws-1', 'snap-1', 'remote-canvas-2', '2');
  });

  test('marks the local canvas conflicted when backend version no longer matches', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(async () => ({
        canvasId: 'remote-canvas-3',
        workspaceId: 'ws-1',
        snapshotId: 'snap-1',
        name: 'Orders canvas',
        document: createDocument({
          canvasId: 'remote-canvas-3',
          sync: {
            state: 'SYNCHRONIZED',
            localVersion: 3,
            backendVersion: '7',
            lastModifiedAt: '2026-03-24T12:00:00Z',
            lastSyncedAt: '2026-03-24T12:00:00Z',
            lastSyncError: null,
            conflict: null,
          },
        }),
        documentVersion: 7,
        backendVersion: '7',
        createdAt: '2026-03-24T10:00:00Z',
        updatedAt: '2026-03-24T12:00:00Z',
      })),
      createCanvas: jest.fn(),
      updateCanvas: jest.fn(async () => {
        throw new HttpError(409, 'Saved canvas version conflict.');
      }),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    const document = markSavedCanvasPendingSync(createDocument({
      canvasId: 'remote-canvas-3',
      sync: {
        state: 'LOCALLY_MODIFIED',
        localVersion: 4,
        backendVersion: '6',
        lastModifiedAt: '2026-03-24T12:30:00Z',
        lastSyncedAt: '2026-03-24T12:00:00Z',
        lastSyncError: null,
        conflict: null,
      },
    }));
    await localStore.putCanvas(document);

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });
    const conflicted = await localStore.getCanvas('remote-canvas-3');

    expect(result.conflictCount).toBe(1);
    expect(conflicted?.syncState).toBe('CONFLICTED');
    expect(conflicted?.backendVersion).toBe('7');
    expect(conflicted?.document.sync.conflict?.message).toContain('Backend version 7');
  });


  test('retries transient create failures once before succeeding', async () => {
    const localStore = createInMemoryLocalStore();
    let attempts = 0;
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(async (_workspaceId: string, _snapshotId: string, document) => {
        attempts += 1;
        if (attempts === 1) {
          throw new HttpError(503, 'Service unavailable');
        }
        return {
          canvasId: 'remote-canvas-retry',
          workspaceId: 'ws-1',
          snapshotId: 'snap-1',
          name: document.name,
          document: { ...document, canvasId: 'remote-canvas-retry' },
          documentVersion: 1,
          backendVersion: '1',
          createdAt: document.metadata.createdAt,
          updatedAt: document.metadata.updatedAt,
        };
      }),
      updateCanvas: jest.fn(),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    await localStore.putCanvas(markSavedCanvasPendingSync(createDocument()));

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });

    expect(result.uploadedCount).toBe(1);
    expect(result.retriedCount).toBe(1);
    expect(await localStore.getCanvas('remote-canvas-retry')).not.toBeNull();
  });

  test('recovers by recreating a missing remote canvas during update', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(async (_workspaceId: string, _snapshotId: string, document) => ({
        canvasId: 'remote-canvas-recreated',
        workspaceId: 'ws-1',
        snapshotId: 'snap-1',
        name: document.name,
        document: { ...document, canvasId: 'remote-canvas-recreated' },
        documentVersion: 1,
        backendVersion: '1',
        createdAt: document.metadata.createdAt,
        updatedAt: document.metadata.updatedAt,
      })),
      updateCanvas: jest.fn(async () => {
        throw new HttpError(404, 'Missing remote copy');
      }),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    await localStore.putCanvas(markSavedCanvasPendingSync(createDocument({
      canvasId: 'remote-canvas-lost',
      sync: {
        state: 'LOCALLY_MODIFIED',
        localVersion: 4,
        backendVersion: '6',
        lastModifiedAt: '2026-03-24T12:30:00Z',
        lastSyncedAt: '2026-03-24T12:00:00Z',
        lastSyncError: null,
        conflict: null,
      },
    })));

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });

    expect(result.uploadedCount).toBe(1);
    expect(result.recoveredCount).toBe(1);
    expect(result.replacedCanvasIds).toEqual([{ previousCanvasId: 'remote-canvas-lost', currentCanvasId: 'remote-canvas-recreated' }]);
    expect(await localStore.getCanvas('remote-canvas-recreated')).not.toBeNull();
    expect(await localStore.getCanvas('remote-canvas-lost')).toBeNull();
  });

  test('treats deleting an already-missing remote canvas as recovered success', async () => {
    const localStore = createInMemoryLocalStore();
    const remoteStore = {
      listCanvases: jest.fn(),
      getCanvas: jest.fn(),
      createCanvas: jest.fn(),
      updateCanvas: jest.fn(),
      duplicateCanvas: jest.fn(),
      deleteCanvas: jest.fn(async () => {
        throw new HttpError(404, 'Already deleted');
      }),
    };
    const syncService = createSavedCanvasSyncService(localStore, remoteStore as never);
    const record = await localStore.putCanvas(createDocument({
      canvasId: 'remote-canvas-gone',
      sync: {
        state: 'SYNCHRONIZED',
        localVersion: 2,
        backendVersion: '2',
        lastModifiedAt: '2026-03-24T11:00:00Z',
        lastSyncedAt: '2026-03-24T11:00:00Z',
        lastSyncError: null,
        conflict: null,
      },
    }));
    await syncService.markCanvasDeletedPendingSync(record);

    const result = await syncService.syncPendingCanvases({ workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1' });

    expect(result.deletedCount).toBe(1);
    expect(result.recoveredCount).toBe(1);
    expect(result.recoveredCanvasIds).toEqual(['remote-canvas-gone']);
    expect(await localStore.getCanvas('remote-canvas-gone')).toBeNull();
  });

});
