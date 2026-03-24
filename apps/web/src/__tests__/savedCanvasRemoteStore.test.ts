import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../savedCanvasModel';
import { createSavedCanvasRemoteStore, type SavedCanvasBackendResponse } from '../savedCanvasRemoteStore';

describe('savedCanvasRemoteStore', () => {
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
