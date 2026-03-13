import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { collectAncestorScopeIds, computeDefaultExpandedScopeIds } from '../components/BrowserNavigationTree';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-tree-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-001',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 3,
  entityCount: 2,
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
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:browser', kind: 'PACKAGE', name: 'browser', displayName: 'Browser', parentScopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser-view', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:browser', sourceRefs: [], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:browser', sourceRefs: [], metadata: {} },
    ],
    relationships: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserNavigationTree helpers', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('collectAncestorScopeIds returns the full ancestor chain for the selected scope', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(collectAncestorScopeIds(index, 'scope:browser')).toEqual(['scope:repo', 'scope:web']);
  });

  test('computeDefaultExpandedScopeIds keeps roots and the selected branch expanded', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(computeDefaultExpandedScopeIds(index, 'scope:browser')).toEqual(['scope:repo', 'scope:web', 'scope:browser']);
  });
});
