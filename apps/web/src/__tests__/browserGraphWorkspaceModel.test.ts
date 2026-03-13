import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { buildBrowserGraphWorkspaceModel } from '../browserGraphWorkspaceModel';
import { createEmptyBrowserSessionState, openSnapshotSession, addScopeToCanvas, addEntityToCanvas, addDependenciesToCanvas, focusBrowserElement } from '../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-graph-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-graph',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 2,
  entityCount: 3,
  relationshipCount: 2,
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
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'BrowserTopSearch', displayName: 'BrowserTopSearch', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
      { externalId: 'rel:2', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:search', label: 'queries', sourceRefs: [], metadata: {} },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserGraphWorkspaceModel', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('builds positioned scope/entity nodes and dependency edges from the browser session canvas', () => {
    const payload = createPayload();
    const index = buildBrowserSnapshotIndex(payload);
    expect(index.snapshotId).toBe('snap-graph-1');

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = focusBrowserElement(state, { kind: 'relationship', id: 'rel:1' });

    const model = buildBrowserGraphWorkspaceModel(state);

    expect(model.nodes.map((node) => node.id)).toEqual(['scope:web', 'entity:browser', 'entity:tree', 'entity:search']);
    expect(model.edges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:1', 'rel:2']);
    expect(model.nodes.find((node) => node.id === 'entity:browser')?.focused).toBe(false);
    expect(model.edges.find((edge) => edge.relationshipId === 'rel:1')?.focused).toBe(true);
    expect(model.width).toBeGreaterThan(600);
    expect(model.height).toBeGreaterThan(300);
  });
});
