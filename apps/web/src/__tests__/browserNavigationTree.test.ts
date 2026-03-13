import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { buildScopeCategoryGroups, collectAncestorScopeIds, computeDefaultExpandedCategories, computeDefaultExpandedScopeIds } from '../components/BrowserNavigationTree';

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

  test('groups root scopes by kind so the left rail can expand categories first', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:module', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:dir', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'main.tsx', displayName: 'main.tsx', parentScopeId: 'scope:dir', sourceRefs: [], metadata: {} },
      ],
    });

    expect(buildScopeCategoryGroups(index.scopeTree).map((group) => [group.kind, group.nodes.map((node) => node.scopeId)])).toEqual([
      ['DIRECTORY', ['scope:dir']],
      ['MODULE', ['scope:module']],
      ['REPOSITORY', ['scope:repo']],
    ]);
  });

  test('keeps category groups expanded when focusing a selected scope branch', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const groups = buildScopeCategoryGroups(index.scopeTree);

    expect(computeDefaultExpandedCategories(groups, index, 'scope:browser')).toEqual(['REPOSITORY']);
  });

  test('compacts file and directory labels to their basename in the tree', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:dir', kind: 'DIRECTORY', name: 'src/__tests__', displayName: 'src/__tests__', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/__tests__/App.test.tsx', displayName: 'src/__tests__/App.test.tsx', parentScopeId: 'scope:dir', sourceRefs: [], metadata: {} },
      ],
    });

    expect(index.scopePathById.get('scope:file')).toBe('Platform / __tests__ / App.test.tsx');
    expect(index.scopeTree[0]?.displayName).toBe('Platform');
    expect(index.scopeNodesByParentId.get('scope:repo')?.[0]?.displayName).toBe('__tests__');
    expect(index.scopeNodesByParentId.get('scope:dir')?.[0]?.displayName).toBe('App.test.tsx');
  });

  test('orders directories before files within the same parent scope', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'README.md', displayName: 'README.md', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:dir', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
    });

    expect(index.scopeNodesByParentId.get('scope:repo')?.map((node) => [node.kind, node.displayName])).toEqual([
      ['DIRECTORY', 'src'],
      ['FILE', 'README.md'],
    ]);
  });
});
