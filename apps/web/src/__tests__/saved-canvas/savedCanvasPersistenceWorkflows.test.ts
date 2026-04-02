import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../../saved-canvas';
import { createSavedCanvasLocalStore, InMemorySavedCanvasLocalStorage } from '../../saved-canvas';
import { runDeleteSavedCanvasWorkflow } from '../../views/saved-canvas-controller/savedCanvasPersistenceWorkflows';
import { createEmptySavedCanvasSyncResult } from '../../saved-canvas/application/sync-impl/model';
import type { SnapshotSummary } from '../../app-model';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-delete-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-delete',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-31T00:00:00Z',
  scopeCount: 1,
  entityCount: 1,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

describe('savedCanvasPersistenceWorkflows safety baseline', () => {
  test('deleting a local-only current canvas clears current and rebinding state before refreshing records', async () => {
    const savedCanvasStore = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());
    await savedCanvasStore.putCanvas(createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: toSavedCanvasSnapshotRef(snapshotSummary),
      createdAt: '2026-03-31T12:00:00Z',
      updatedAt: '2026-03-31T12:00:00Z',
      lastModifiedAt: '2026-03-31T12:00:00Z',
      syncState: 'LOCAL_ONLY',
    }));

    const syncResult = { deletedCount: 0 };
    const ports = {
      savedCanvasStore,
      savedCanvasSyncService: {
        markCanvasPendingSync: jest.fn(async () => { throw new Error('not used in this test'); }),
        markCanvasDeletedPendingSync: jest.fn(async () => undefined),
        syncPendingCanvases: jest.fn(async () => createEmptySavedCanvasSyncResult()),
      },
      currentSavedCanvasId: 'canvas-1',
      rebindingCanvasId: 'canvas-1',
      setCurrentSavedCanvasId: jest.fn(),
      setCurrentSavedCanvasBaseline: jest.fn(),
      setSavedCanvasDraftName: jest.fn(),
      setRebindingCanvasId: jest.fn(),
      setRebindingSummary: jest.fn(),
      selectedSnapshotLabel: snapshotSummary.snapshotKey,
      loadSavedCanvasRecords: jest.fn(async () => []),
      setSavedCanvasStatusMessage: jest.fn(),
      applySavedCanvasSyncResult: jest.fn(),
      runSavedCanvasSync: jest.fn(async () => syncResult),
    };

    await runDeleteSavedCanvasWorkflow(ports, 'canvas-1');

    expect(ports.savedCanvasSyncService.markCanvasDeletedPendingSync).toHaveBeenCalledTimes(1);
    expect(ports.setCurrentSavedCanvasId).toHaveBeenCalledWith(null);
    expect(ports.setCurrentSavedCanvasBaseline).toHaveBeenCalledWith(null);
    expect(ports.setSavedCanvasDraftName).toHaveBeenCalledWith('Saved canvas — platform-main-delete');
    expect(ports.setRebindingCanvasId).toHaveBeenCalledWith(null);
    expect(ports.setRebindingSummary).toHaveBeenCalledWith(null);
    expect(ports.loadSavedCanvasRecords).toHaveBeenCalledTimes(1);
    expect(ports.setSavedCanvasStatusMessage).toHaveBeenCalledWith('Saved canvas deleted locally.');
    expect(ports.runSavedCanvasSync).toHaveBeenCalledWith({ silent: false });
    expect(ports.applySavedCanvasSyncResult).toHaveBeenCalledWith(syncResult);
  });
});
