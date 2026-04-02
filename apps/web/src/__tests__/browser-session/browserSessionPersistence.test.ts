import { createEmptyBrowserSessionState, addEntityToCanvas, openFactsPanel, openSnapshotSession, requestFitCanvasView } from '../../browser-session';
import { persistBrowserSession, readPersistedBrowserSession } from '../../browser-session';
import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-persist-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-persist',
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

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser session persistence safety net', () => {
  test('persists only the durable Browser session shell without live payload/index data', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = requestFitCanvasView(openFactsPanel(addEntityToCanvas(state, 'entity:browser'), 'entity', 'right'));

    const storage = {
      setItem: jest.fn(),
    };

    persistBrowserSession(state, storage);

    const [storageKey, rawPayload] = storage.setItem.mock.calls[0];
    const persisted = JSON.parse(rawPayload);

    expect(storageKey).toBe('architecture-browser-platform.browser-session.v2');
    expect(persisted.activeSnapshot).toEqual({
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      snapshotId: 'snap-persist-1',
      snapshotKey: 'platform-main-persist',
      preparedAt: expect.any(String),
    });
    expect(persisted.canvasNodes.map((node: { id: string }) => node.id)).toEqual(['entity:browser']);
    expect(persisted.factsPanelMode).toBe('entity');
    expect(persisted.fitViewRequestedAt).toBeUndefined();
    expect(persisted.payload).toBeUndefined();
    expect(persisted.index).toBeUndefined();
    expect(persisted.searchResults).toBeUndefined();
  });

  test('reads persisted Browser session records defensively when storage is empty or malformed', () => {
    expect(readPersistedBrowserSession({ getItem: () => null })).toBeNull();
    expect(readPersistedBrowserSession({ getItem: () => '{bad json' })).toBeNull();
  });
});
