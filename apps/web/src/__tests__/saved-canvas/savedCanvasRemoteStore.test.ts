import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../../saved-canvas';
import { createSavedCanvasRemoteStore, type SavedCanvasBackendResponse } from '../../saved-canvas';

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
  indexerVersion: 'step4',
  scopeCount: 0,
  entityCount: 0,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 0,
  totalFileCount: 0,
  degradedFileCount: 0,
});

describe('savedCanvasRemoteStore', () => {
  test('parses backend saved canvas responses into saved canvas documents', async () => {
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });

    const listSavedCanvases = jest.fn(async () => [toResponse(document)]);
    const store = createSavedCanvasRemoteStore({
      listSavedCanvases,
      getSavedCanvas: jest.fn(),
      createSavedCanvas: jest.fn(),
      updateSavedCanvas: jest.fn(),
      duplicateSavedCanvas: jest.fn(),
      deleteSavedCanvas: jest.fn(),
    } as never);

    const records = await store.listCanvases('ws-1', 'snap-1');

    expect(listSavedCanvases).toHaveBeenCalledWith('ws-1', 'snap-1');
    expect(records[0]?.canvasId).toBe('canvas-1');
    expect(records[0]?.document.name).toBe('Orders canvas');
    expect(records[0]?.document.canvasId).toBe('canvas-1');
    expect(records[0]?.backendVersion).toBe('1');
  });

  test('passes expected backend version on update and delete operations', async () => {
    const updateSavedCanvas = jest.fn(async () => toResponse(createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    })));
    const deleteSavedCanvas = jest.fn(async () => undefined);
    const store = createSavedCanvasRemoteStore({
      listSavedCanvases: jest.fn(),
      getSavedCanvas: jest.fn(),
      createSavedCanvas: jest.fn(),
      updateSavedCanvas,
      duplicateSavedCanvas: jest.fn(),
      deleteSavedCanvas,
    } as never);

    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
      backendVersion: '4',
    });

    await store.updateCanvas('ws-1', 'snap-1', document, '4');
    await store.deleteCanvas('ws-1', 'snap-1', 'canvas-1', '4');

    expect(updateSavedCanvas).toHaveBeenCalledWith('ws-1', 'snap-1', 'canvas-1', expect.objectContaining({ expectedBackendVersion: '4' }));
    expect(deleteSavedCanvas).toHaveBeenCalledWith('ws-1', 'snap-1', 'canvas-1', '4');
  });
});

function toResponse(document: ReturnType<typeof createSavedCanvasDocument>): SavedCanvasBackendResponse {
  return {
    id: 'canvas-1',
    workspaceId: document.bindings.originSnapshot.workspaceId,
    snapshotId: document.bindings.originSnapshot.snapshotId,
    name: document.name,
    documentJson: JSON.stringify(document),
    documentVersion: 1,
    backendVersion: '1',
    createdAt: document.metadata.createdAt,
    updatedAt: document.metadata.updatedAt,
  };
}
