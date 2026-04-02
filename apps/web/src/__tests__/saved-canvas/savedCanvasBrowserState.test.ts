import type { FullSnapshotPayload } from '../../app-model';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browserSessionStore';
import { buildSavedCanvasDocumentForSave, defaultSavedCanvasName } from '../../saved-canvas/browserState';
import { createSavedCanvasDocument } from '../../saved-canvas';

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: {
      id: 'snap-1',
      workspaceId: 'ws-1',
      repositoryRegistrationId: 'repo-1',
      repositoryKey: 'platform',
      repositoryName: 'Platform',
      runId: 'run-1',
      snapshotKey: 'platform-main-001',
      status: 'READY',
      completenessStatus: 'COMPLETE',
      derivedRunOutcome: 'SUCCESS',
      schemaVersion: '1.0.0',
      indexerVersion: '0.1.0',
      sourceRevision: 'abc123',
      sourceBranch: 'main',
      importedAt: '2026-03-24T10:00:00Z',
      scopeCount: 1,
      entityCount: 1,
      relationshipCount: 0,
      diagnosticCount: 0,
      indexedFileCount: 1,
      totalFileCount: 1,
      degradedFileCount: 0,
    },
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: [] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [{ externalId: 'scope:root', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} }],
    entities: [{ externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:root', sourceRefs: [], metadata: {} }],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('savedCanvasBrowserState', () => {
  test('creates a sensible default name', () => {
    expect(defaultSavedCanvasName('platform-main-001')).toBe('Saved canvas — platform-main-001');
  });

  test('builds a new saved canvas document for save', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [{ kind: 'entity', id: 'entity:browser', x: 10, y: 20, pinned: true, manuallyPlaced: true }],
    };

    const document = buildSavedCanvasDocumentForSave({
      state,
      name: 'My canvas',
      now: '2026-03-24T12:00:00Z',
    });

    expect(document.canvasId).toBeTruthy();
    expect(document.name).toBe('My canvas');
    expect(document.sync.localVersion).toBe(1);
    expect(document.sync.state).toBe('LOCAL_ONLY');
  });

  test('increments version when saving an existing canvas', () => {
    const existing = createSavedCanvasDocument({
      canvasId: 'canvas-1',
      name: 'Existing canvas',
      originSnapshot: {
        snapshotId: 'snap-1',
        snapshotKey: 'platform-main-001',
        workspaceId: 'ws-1',
        repositoryRegistrationId: 'repo-1',
        repositoryKey: 'platform',
        repositoryName: 'Platform',
        sourceBranch: 'main',
        sourceRevision: 'abc123',
        importedAt: '2026-03-24T10:00:00Z',
      },
      syncState: 'SYNCHRONIZED',
      localVersion: 3,
      backendVersion: 'v3',
      createdAt: '2026-03-24T11:00:00Z',
      updatedAt: '2026-03-24T11:00:00Z',
      lastModifiedAt: '2026-03-24T11:00:00Z',
    });

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [{ kind: 'entity', id: 'entity:browser', x: 10, y: 20, pinned: true, manuallyPlaced: true }],
    };

    const document = buildSavedCanvasDocumentForSave({
      state,
      name: 'Existing canvas',
      existing,
      now: '2026-03-24T12:00:00Z',
    });

    expect(document.canvasId).toBe('canvas-1');
    expect(document.sync.localVersion).toBe(4);
    expect(document.sync.state).toBe('LOCALLY_MODIFIED');
    expect(document.sync.backendVersion).toBe('v3');
    expect(document.metadata.createdAt).toBe('2026-03-24T11:00:00Z');
  });
});
