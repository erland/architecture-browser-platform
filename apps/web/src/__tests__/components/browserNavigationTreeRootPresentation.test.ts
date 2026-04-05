import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../../browser-snapshot';
import {
  BROWSABLE_TREE_MODES,
  computeNavigationRootPresentation,
  filterNavigationRootsForVisibility,
  resolveBrowsableNavigationTreeMode,
} from '../../components/browser-navigation/browserNavigationTree.rootPresentation';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-tree-root-1',
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
  scopeCount: 4,
  entityCount: 0,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(detectedTechnologies: string[] = ['react']): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:file', kind: 'FILE', name: 'src/App.tsx', displayName: 'src/App.tsx', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'com.example', displayName: 'com.example', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserNavigationTree root presentation', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('limits top-level browsing modes to filesystem and package', () => {
    expect(BROWSABLE_TREE_MODES).toEqual(['filesystem', 'package']);
  });

  test('resolves legacy advanced mode to filesystem for frontend-oriented snapshots', () => {
    const index = buildBrowserSnapshotIndex(createPayload(['react']));
    expect(resolveBrowsableNavigationTreeMode(index, 'advanced')).toBe('filesystem');
  });

  test('resolves legacy advanced mode to package for java-oriented snapshots', () => {
    const index = buildBrowserSnapshotIndex(createPayload(['java']));
    expect(resolveBrowsableNavigationTreeMode(index, 'advanced')).toBe('package');
  });

  test('filters top-level roots against current visible scope paths', () => {
    const index = buildBrowserSnapshotIndex(createPayload(['react']));
    const presentation = computeNavigationRootPresentation({
      index,
      treeMode: 'advanced',
      roots: index.scopeTree,
      visibleScopeIds: new Set(['scope:repo']),
    });

    expect(presentation.effectiveTreeMode).toBe('filesystem');
    expect(presentation.roots.map((node) => node.scopeId)).toEqual(['scope:repo']);
    expect(filterNavigationRootsForVisibility(index.scopeTree, new Set(['scope:repo'])).map((node) => node.scopeId)).toEqual(['scope:repo']);
  });
});
