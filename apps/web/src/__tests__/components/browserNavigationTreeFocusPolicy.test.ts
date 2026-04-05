import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { computeCollapsedAutoExpandState } from '../../components/browser-navigation/BrowserNavigationTree';
import { computeNavigationFocusRevealState } from '../../components/browser-navigation/browserNavigationTree.focusPolicy';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-tree-focus-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-focus-001',
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
      { externalId: 'scope:file', kind: 'FILE', name: 'src/pages/Home.tsx', displayName: 'Home.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:other', kind: 'FILE', name: 'src/pages/Other.tsx', displayName: 'Other.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'HomeLayout', displayName: 'HomeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
      { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'HomePage', displayName: 'HomePage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      { externalId: 'entity:helper', kind: 'FUNCTION', origin: 'typescript', name: 'helper', displayName: 'helper', scopeId: 'scope:other', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:layout-page', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserNavigationTree focus policy', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('reveals only the selected scope chain and expandable ancestor entities', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(computeNavigationFocusRevealState({
      index,
      selectedScopeId: 'scope:file',
      selectedEntityIds: ['entity:page'],
      treeMode: 'filesystem',
    })).toEqual({
      scopeIds: ['scope:file'],
      entityIds: ['entity:layout'],
      hasExplicitFocusTarget: true,
    });
  });

  test('falls back to collapsed auto-expand when there is no visible focus target', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(computeNavigationFocusRevealState({
      index,
      selectedScopeId: null,
      selectedEntityIds: [],
      treeMode: 'filesystem',
    })).toEqual({
      ...computeCollapsedAutoExpandState(index, 'filesystem'),
      hasExplicitFocusTarget: false,
    });
  });
});
