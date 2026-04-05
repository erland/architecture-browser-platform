import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex } from '../../browser-snapshot';
import { computeSingleChildAutoExpandTraversalState } from '../../components/browser-navigation/browserNavigationTree.autoExpandTraversal';
import { buildNavigationChildNodes, computeSingleChildAutoExpandState } from '../../components/browser-navigation/BrowserNavigationTree';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-tree-auto-expand-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-auto-expand-001',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 0,
  entityCount: 0,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(overrides: Partial<FullSnapshotPayload>): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [],
    entities: [],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
    ...overrides,
  };
}

describe('browserNavigationTree auto-expand traversal utility', () => {
  test('follows only-single-child scope and entity chains deterministically', () => {
    const index = buildBrowserSnapshotIndex(createPayload({
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'repo', displayName: 'repo', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:web', kind: 'DIRECTORY', name: 'web', displayName: 'web', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'Layout', displayName: 'Layout', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
        { externalId: 'entity:screen', kind: 'COMPONENT', origin: 'react', name: 'Screen', displayName: 'Screen', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      ],
      relationships: [
        { externalId: 'rel:layout-screen', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:screen', label: null, sourceRefs: [], metadata: {} },
      ],
    }));

    const state = computeSingleChildAutoExpandTraversalState({
      index,
      treeMode: 'filesystem',
      parent: { scopeId: 'scope:repo' },
      getScopeChildren: (scopeId, treeMode) => buildNavigationChildNodes(index, scopeId, treeMode),
    });

    expect(state).toEqual({
      scopeIds: ['scope:src', 'scope:web'],
      entityIds: ['entity:layout'],
    });
    expect(computeSingleChildAutoExpandState(index, 'filesystem', { scopeId: 'scope:repo' })).toEqual(state);
  });

  test('stops when the first branching scope level is reached', () => {
    const index = buildBrowserSnapshotIndex(createPayload({
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'repo', displayName: 'repo', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:web', kind: 'DIRECTORY', name: 'web', displayName: 'web', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
        { externalId: 'scope:api', kind: 'DIRECTORY', name: 'api', displayName: 'api', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      ],
    }));

    expect(computeSingleChildAutoExpandTraversalState({
      index,
      treeMode: 'filesystem',
      parent: { scopeId: 'scope:repo' },
      getScopeChildren: (scopeId, treeMode) => buildNavigationChildNodes(index, scopeId, treeMode),
    })).toEqual({
      scopeIds: ['scope:src'],
      entityIds: [],
    });
  });
});
