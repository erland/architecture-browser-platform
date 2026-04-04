import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, canExpandEntityInNavigationTree, clearBrowserSnapshotIndex, detectDefaultBrowserTreeMode, getScopeTreeNodesForMode } from '../../browser-snapshot';
import { buildNavigationChildNodes, buildNavigationEntityChildNodes, buildScopeCategoryGroups, collectAncestorScopeIds, collectSingleChildAutoExpansion, computeDefaultExpandedCategories, computeDefaultExpandedScopeIds } from '../../components/browser-navigation/BrowserNavigationTree';

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




  test('collectSingleChildAutoExpansion expands single-child scope chains until branching', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:one', kind: 'PACKAGE', name: 'browser', displayName: 'browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:pkg:two', kind: 'PACKAGE', name: 'browser.ui', displayName: 'browser.ui', parentScopeId: 'scope:pkg:one', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file:a', kind: 'FILE', name: 'src/A.tsx', displayName: 'A.tsx', parentScopeId: 'scope:pkg:two', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file:b', kind: 'FILE', name: 'src/B.tsx', displayName: 'B.tsx', parentScopeId: 'scope:pkg:two', sourceRefs: [], metadata: {} },
      ],
      entities: [],
      relationships: [],
    });

    expect(collectSingleChildAutoExpansion(index, 'advanced', ['scope:repo'], [])).toEqual({
      scopeIds: ['scope:pkg:one', 'scope:pkg:two'],
      entityIds: [],
    });
  });

  test('collectSingleChildAutoExpansion continues from a single-child scope into entity containers', () => {
    const index = buildBrowserSnapshotIndex({
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:file', kind: 'FILE', name: 'src/App.tsx', displayName: 'App.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'AppLayout', displayName: 'AppLayout', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
        { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'AppPage', displayName: 'AppPage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      ],
      relationships: [
        { externalId: 'rel:layout-page', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
      ],
    });

    expect(collectSingleChildAutoExpansion(index, 'advanced', ['scope:repo', 'scope:file'], [])).toEqual({
      scopeIds: ['scope:file'],
      entityIds: ['entity:layout', 'entity:page'],
    });
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
