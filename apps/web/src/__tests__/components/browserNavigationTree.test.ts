import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, canExpandEntityInNavigationTree, clearBrowserSnapshotIndex, detectDefaultBrowserTreeMode, getScopeTreeNodesForMode } from '../../browser-snapshot';
import { buildNavigationChildNodes, buildNavigationEntityChildNodes, buildScopeCategoryGroups, collectAncestorScopeIds, computeCollapsedAutoExpandState, computeDefaultExpandedCategories, computeDefaultExpandedScopeIds, computeFocusExpandedState, computeSingleChildAutoExpandState } from '../../components/browser-navigation/BrowserNavigationTree';
import { collectNavigationSearchVisibility } from '../../components/browser-navigation/browserNavigationTree.model';

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
    viewpoints: [],
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

  test('filesystem mode bubbles directory and file nodes above repository wrappers', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:web', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/main.tsx', displayName: 'src/main.tsx', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      ],
    });

    expect(getScopeTreeNodesForMode(index, null, 'filesystem').map((node) => node.scopeId)).toEqual(['scope:src']);
    expect(getScopeTreeNodesForMode(index, 'scope:src', 'filesystem').map((node) => node.scopeId)).toEqual(['scope:file']);
  });

  test('package mode filters the tree to package scopes and uses visible ancestors for expansion', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:module', kind: 'MODULE', name: 'backend', displayName: 'Backend', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:root', kind: 'PACKAGE', name: 'com.example', displayName: 'com.example', parentScopeId: 'scope:module', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:child', kind: 'PACKAGE', name: 'com.example.browser', displayName: 'com.example.browser', parentScopeId: 'scope:pkg:root', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/main/java/com/example/browser/Browser.java', displayName: 'Browser.java', parentScopeId: 'scope:pkg:child', sourceRefs: [], metadata: {} },
      ],
    });

    expect(getScopeTreeNodesForMode(index, null, 'package').map((node) => node.scopeId)).toEqual(['scope:pkg:root']);
    expect(collectAncestorScopeIds(index, 'scope:pkg:child', 'package')).toEqual(['scope:pkg:root']);
    expect(computeDefaultExpandedScopeIds(index, 'scope:pkg:child', 'package')).toEqual(['scope:pkg:root', 'scope:pkg:child']);
  });


  test('computeFocusExpandedState keeps only the selected branch expanded', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:module', kind: 'MODULE', name: 'backend', displayName: 'Backend', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:root', kind: 'PACKAGE', name: 'com.example', displayName: 'com.example', parentScopeId: 'scope:module', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:child', kind: 'PACKAGE', name: 'com.example.browser', displayName: 'com.example.browser', parentScopeId: 'scope:pkg:root', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:other', kind: 'PACKAGE', name: 'com.example.other', displayName: 'com.example.other', parentScopeId: 'scope:pkg:root', sourceRefs: [], metadata: {} },
      ],
    });

    expect(computeFocusExpandedState(index, 'scope:pkg:child', [], 'package')).toEqual({
      scopeIds: ['scope:pkg:root', 'scope:pkg:child'],
      entityIds: [],
    });
  });

  test('computeFocusExpandedState falls back to collapsed auto-expand when nothing is selected', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:browser', kind: 'PACKAGE', name: 'browser', displayName: 'Browser', parentScopeId: 'scope:web', sourceRefs: [], metadata: {} },
      ],
    });

    expect(computeFocusExpandedState(index, null, [], 'filesystem')).toEqual(computeCollapsedAutoExpandState(index, 'filesystem'));
  });



  test('computeFocusExpandedState keeps the selected scope path and expandable entity ancestors only', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/pages/Home.tsx', displayName: 'Home.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'HomeLayout', displayName: 'HomeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'HomePage', displayName: 'HomePage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
        { externalId: 'entity:route', kind: 'ENDPOINT', origin: 'react-router', name: 'homeRoute', displayName: 'homeRoute', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
        { externalId: 'entity:hook', kind: 'HOOK', origin: 'react', name: 'useHomeData', displayName: 'useHomeData', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      ],
      relationships: [
        { externalId: 'rel:layout-page', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:layout-route', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:route', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:layout-hook', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:hook', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    expect(computeFocusExpandedState(index, 'scope:file', ['entity:page'], 'filesystem')).toEqual({
      scopeIds: ['scope:file'],
      entityIds: ['entity:layout'],
    });
  });

  test('computeSingleChildAutoExpandState stops at the first branching scope level', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'browser', displayName: 'browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:a', kind: 'PACKAGE', name: 'browser.a', displayName: 'browser.a', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:b', kind: 'PACKAGE', name: 'browser.b', displayName: 'browser.b', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      ],
      entities: [],
    });

    expect(computeSingleChildAutoExpandState(index, 'advanced', { scopeId: 'scope:repo' })).toEqual({
      scopeIds: ['scope:pkg'],
      entityIds: [],
    });
  });

  test('computeSingleChildAutoExpandState follows a single-child entity chain until branching occurs', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/pages/Home.tsx', displayName: 'Home.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'HomeLayout', displayName: 'HomeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
        { externalId: 'entity:routeGroup', kind: 'ENDPOINT', origin: 'react-router', name: 'homeRouteGroup', displayName: 'homeRouteGroup', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
        { externalId: 'entity:routeA', kind: 'ENDPOINT', origin: 'react-router', name: 'homeRouteA', displayName: 'homeRouteA', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
        { externalId: 'entity:routeB', kind: 'ENDPOINT', origin: 'react-router', name: 'homeRouteB', displayName: 'homeRouteB', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
      ],
      relationships: [
        { externalId: 'rel:layout-group', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:routeGroup', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:group-a', kind: 'CONTAINS', fromEntityId: 'entity:routeGroup', toEntityId: 'entity:routeA', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:group-b', kind: 'CONTAINS', fromEntityId: 'entity:routeGroup', toEntityId: 'entity:routeB', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    expect(computeSingleChildAutoExpandState(index, 'filesystem', { entityId: 'entity:layout' })).toEqual({
      scopeIds: [],
      entityIds: ['entity:routeGroup'],
    });
  });

  test('collectNavigationSearchVisibility keeps the matched entity path visible through scope and entity ancestors', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/pages/Home.tsx', displayName: 'Home.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'HomeLayout', displayName: 'HomeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'HomePage', displayName: 'HomePage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
        { externalId: 'entity:route', kind: 'ENDPOINT', origin: 'react-router', name: 'homeRoute', displayName: 'homeRoute', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
      ],
      relationships: [
        { externalId: 'rel:layout-page', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:layout-route', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:route', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    const visibility = collectNavigationSearchVisibility(index, 'filesystem', [
      {
        kind: 'entity',
        id: 'entity:page',
        title: 'HomePage',
        subtitle: 'scope:file',
        scopeId: 'scope:file',
        score: 100,
      },
    ]);

    expect([...visibility.scopeIds]).toEqual(['scope:file']);
    expect([...visibility.entityIds]).toEqual(['entity:page', 'entity:layout']);
  });

  test('detects package mode as the default for Java/package-heavy snapshots', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:root', kind: 'PACKAGE', name: 'com.example', displayName: 'com.example', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:child', kind: 'PACKAGE', name: 'com.example.browser', displayName: 'com.example.browser', parentScopeId: 'scope:pkg:root', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/main/java/com/example/browser/Browser.java', displayName: 'Browser.java', parentScopeId: 'scope:pkg:child', sourceRefs: [], metadata: {} },
      ],
    });

    expect(detectDefaultBrowserTreeMode(index)).toBe('package');
  });

  test('falls back to filesystem mode for frontend snapshots', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/App.tsx', displayName: 'src/App.tsx', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      ],
    });

    expect(detectDefaultBrowserTreeMode(index)).toBe('filesystem');
  });


  test('buildNavigationChildNodes returns an empty collection for empty scopes', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:empty', kind: 'PACKAGE', name: 'empty', displayName: 'empty', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [],
    });

    expect(buildNavigationChildNodes(index, 'scope:empty', 'advanced')).toEqual([]);
  });

  test('buildNavigationChildNodes keeps scope children before entity children', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'browser', displayName: 'browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:child', kind: 'PACKAGE', name: 'browser.ui', displayName: 'browser.ui', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:service', kind: 'SERVICE', origin: 'java', name: 'BrowserService', displayName: 'BrowserService', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
        { externalId: 'entity:controller', kind: 'CONTROLLER', origin: 'java', name: 'BrowserController', displayName: 'BrowserController', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      ],
    });

    expect(buildNavigationChildNodes(index, 'scope:pkg', 'advanced').map((node) => [node.nodeType, node.kind, node.displayName])).toEqual([
      ['scope', 'PACKAGE', 'browser.ui'],
      ['entity', 'CONTROLLER', 'BrowserController'],
      ['entity', 'SERVICE', 'BrowserService'],
    ]);
  });

  test('buildNavigationChildNodes includes entity-only branches', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/pages/Home.tsx', displayName: 'Home.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'HomePage', displayName: 'HomePage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
        { externalId: 'entity:hook', kind: 'HOOK', origin: 'react', name: 'useHomeData', displayName: 'useHomeData', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      ],
    });

    expect(buildNavigationChildNodes(index, 'scope:file', 'advanced').map((node) => [node.nodeType, node.kind, node.displayName, node.badgeLabel])).toEqual([
      ['entity', 'COMPONENT', 'HomePage', 'Component'],
      ['entity', 'HOOK', 'useHomeData', 'Hook'],
    ]);
  });

  test('buildNavigationChildNodes uses stable prefixed node ids for mixed frontend and backend nodes', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:api', kind: 'PACKAGE', name: 'api', displayName: 'api', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:web', kind: 'DIRECTORY', name: 'src/pages', displayName: 'pages', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:endpoint', kind: 'ENDPOINT', origin: 'jax-rs', name: 'listSnapshots', displayName: 'listSnapshots', scopeId: 'scope:api', sourceRefs: [], metadata: {} },
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'SnapshotsPage', displayName: 'SnapshotsPage', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      ],
    });

    expect(buildNavigationChildNodes(index, 'scope:api', 'advanced').map((node) => node.nodeId)).toEqual(['entity-node:entity:endpoint']);
    expect(buildNavigationChildNodes(index, 'scope:web', 'advanced').map((node) => node.nodeId)).toEqual(['entity-node:entity:page']);
    expect(buildNavigationChildNodes(index, null, 'advanced').map((node) => node.nodeId)).toEqual(['scope-node:scope:repo']);
  });

  test('buildNavigationEntityChildNodes only expands explicitly contained non-member children', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/BrowserModule.tsx', displayName: 'BrowserModule.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:module', kind: 'MODULE', origin: 'react', name: 'BrowserModule', displayName: 'BrowserModule', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'BrowserPage', displayName: 'BrowserPage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
        { externalId: 'entity:route', kind: 'ENDPOINT', origin: 'react-router', name: 'browserRoute', displayName: 'browserRoute', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
        { externalId: 'entity:hook', kind: 'HOOK', origin: 'react', name: 'useBrowserData', displayName: 'useBrowserData', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      ],
      relationships: [
        { externalId: 'rel:module-page', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:module-route', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:route', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:module-hook', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:hook', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    expect(canExpandEntityInNavigationTree(index, 'entity:module')).toBe(true);
    expect(buildNavigationEntityChildNodes(index, 'entity:module', 'scope:file', 1, 'Platform / BrowserModule.tsx / BrowserModule').map((node) => [node.entityId, node.parentEntityId, node.depth])).toEqual([
      ['entity:page', 'entity:module', 2],
      ['entity:route', 'entity:module', 2],
    ]);
  });


  test('auto-expands down a single-child scope and entity chain when expanding a scope', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'browser', displayName: 'browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:module', kind: 'MODULE', origin: 'react', name: 'BrowserModule', displayName: 'BrowserModule', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'BrowserPage', displayName: 'BrowserPage', scopeId: 'scope:pkg', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      ],
      relationships: [
        { externalId: 'rel:module-page', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    expect(computeSingleChildAutoExpandState(index, 'advanced', { scopeId: 'scope:repo' })).toEqual({
      scopeIds: ['scope:pkg'],
      entityIds: [],
    });
  });

  test('collapse keeps the single-child top-level chain expanded', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'browser', displayName: 'browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:module', kind: 'MODULE', origin: 'java', name: 'BrowserModule', displayName: 'BrowserModule', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      ],
      relationships: [],
    });

    expect(computeCollapsedAutoExpandState(index, 'package')).toEqual({
      scopeIds: ['scope:pkg'],
      entityIds: [],
    });
  });

  test('does not expand class entities into member-like fields and functions', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'domain', displayName: 'domain', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
        { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
        { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      ],
      relationships: [
        { externalId: 'rel:contains:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
        { externalId: 'rel:contains:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    expect(canExpandEntityInNavigationTree(index, 'entity:order')).toBe(false);
    expect(buildNavigationEntityChildNodes(index, 'entity:order', 'scope:pkg', 1, 'Platform / domain / Order')).toEqual([]);
  });
});
