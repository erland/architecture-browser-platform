import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../../saved-canvas';
import { createSavedCanvasLocalStore, InMemorySavedCanvasLocalStorage } from '../../saved-canvas';
import { defaultSavedCanvasName } from '../../saved-canvas';
import { runOpenSavedCanvasDialogWorkflow } from '../../views/saved-canvas-controller/savedCanvasDialogWorkflows';
import type { SnapshotSummary } from '../../app-model';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-dialog-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-dialog',
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

describe('savedCanvasDialogWorkflows safety baseline', () => {
  test('opens the dialog with the current saved canvas name and refreshes records after a silent sync', async () => {
    const savedCanvasStore = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());
    await savedCanvasStore.putCanvas(createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: toSavedCanvasSnapshotRef(snapshotSummary),
      createdAt: '2026-03-31T12:00:00Z',
      updatedAt: '2026-03-31T12:00:00Z',
      lastModifiedAt: '2026-03-31T12:00:00Z',
    }));

    const syncResult = { syncedCount: 1 };
    const ports = {
      currentSavedCanvasId: 'canvas-1',
      savedCanvasStore,
      selectedSnapshotLabel: snapshotSummary.snapshotKey,
      setSavedCanvasDraftName: jest.fn(),
      setSavedCanvasStatusMessage: jest.fn(),
      setIsSavedCanvasDialogOpen: jest.fn(),
      applySavedCanvasSyncResult: jest.fn(),
      runSavedCanvasSync: jest.fn(async () => syncResult),
      loadSavedCanvasRecords: jest.fn(async () => []),
    };

    await runOpenSavedCanvasDialogWorkflow(ports);

    expect(ports.setSavedCanvasDraftName).toHaveBeenCalledWith('Orders canvas');
    expect(ports.setSavedCanvasStatusMessage).toHaveBeenCalledWith(null);
    expect(ports.setIsSavedCanvasDialogOpen).toHaveBeenCalledWith(true);
    expect(ports.runSavedCanvasSync).toHaveBeenCalledWith({ silent: true });
    expect(ports.applySavedCanvasSyncResult).toHaveBeenCalledWith(syncResult);
    expect(ports.loadSavedCanvasRecords).toHaveBeenCalledTimes(1);
  });

  test('falls back to the default snapshot-derived name when no saved canvas is currently open', async () => {
    const savedCanvasStore = createSavedCanvasLocalStore(new InMemorySavedCanvasLocalStorage());
    const ports = {
      currentSavedCanvasId: null,
      savedCanvasStore,
      selectedSnapshotLabel: snapshotSummary.snapshotKey,
      setSavedCanvasDraftName: jest.fn(),
      setSavedCanvasStatusMessage: jest.fn(),
      setIsSavedCanvasDialogOpen: jest.fn(),
      applySavedCanvasSyncResult: jest.fn(),
      runSavedCanvasSync: jest.fn(async () => ({ syncedCount: 0 })),
      loadSavedCanvasRecords: jest.fn(async () => []),
    };

    await runOpenSavedCanvasDialogWorkflow(ports);

    expect(ports.setSavedCanvasDraftName).toHaveBeenCalledWith(defaultSavedCanvasName(snapshotSummary.snapshotKey));
  });
});
