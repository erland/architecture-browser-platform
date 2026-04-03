import { buildSavedCanvasUpsertRequest, type RepositoryCreateRequest, type RunRequest } from '../../app-model';
import { createSavedCanvasDocument, toSavedCanvasSnapshotRef } from '../../saved-canvas';

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

describe('appModel contracts', () => {
  test('repository and run request contracts keep shared cross-layer literals stable', () => {
    const repositoryRequest: RepositoryCreateRequest = {
      repositoryKey: 'browser-platform',
      name: 'Architecture Browser Platform',
      sourceType: 'GIT',
      localPath: '',
      remoteUrl: 'https://example.com/platform.git',
      defaultBranch: 'main',
      metadataJson: '{"team":"ea"}',
    };
    const runRequest: RunRequest = {
      triggerType: 'MANUAL',
      requestedSchemaVersion: 'indexer-ir-v1',
      requestedIndexerVersion: 'step4-stub',
      metadataJson: '{"requestedBy":"web-ui"}',
      requestedResult: 'SUCCESS',
    };

    expect(repositoryRequest.sourceType).toBe('GIT');
    expect(runRequest.triggerType).toBe('MANUAL');
    expect(runRequest.requestedResult).toBe('SUCCESS');
  });

  test('saved canvas upsert contract omits expectedBackendVersion when not provided', () => {
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });

    expect(buildSavedCanvasUpsertRequest(document)).toEqual({
      name: 'Orders canvas',
      document,
    });
  });

  test('saved canvas upsert contract includes expectedBackendVersion when provided', () => {
    const document = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Orders canvas',
      originSnapshot: snapshotRef,
    });

    expect(buildSavedCanvasUpsertRequest(document, '4')).toEqual({
      name: 'Orders canvas',
      document,
      expectedBackendVersion: '4',
    });
  });
});
