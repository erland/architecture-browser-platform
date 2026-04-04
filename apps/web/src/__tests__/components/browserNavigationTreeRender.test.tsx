import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { BrowserNavigationTree, buildNavigationChildNodes } from '../../components/browser-navigation/BrowserNavigationTree';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-navigation-tree-render-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-navigation-tree-render',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 4,
  entityCount: 3,
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
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java', 'react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'browser', displayName: 'browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg:child', kind: 'PACKAGE', name: 'browser.ui', displayName: 'browser.ui', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'scope:file', kind: 'FILE', name: 'src/pages/Home.tsx', displayName: 'Home.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:controller', kind: 'CONTROLLER', origin: 'java', name: 'BrowserController', displayName: 'BrowserController', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'SERVICE', origin: 'java', name: 'BrowserService', displayName: 'BrowserService', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'HomePage', displayName: 'HomePage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'HomeLayout', displayName: 'HomeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
      { externalId: 'entity:route', kind: 'ENDPOINT', origin: 'react-router', name: 'homeRoute', displayName: 'homeRoute', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-navigation-node'] } },
      { externalId: 'entity:memberHook', kind: 'HOOK', origin: 'react', name: 'useHomeLayoutData', displayName: 'useHomeLayoutData', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:file-layout-page', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:page', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:file-layout-route', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:route', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:file-layout-hook', kind: 'CONTAINS', fromEntityId: 'entity:layout', toEntityId: 'entity:memberHook', label: null, sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}


function createLargeScopePayload(): FullSnapshotPayload {
  return {
    ...createPayload(),
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg:large', kind: 'PACKAGE', name: 'browser.large', displayName: 'browser.large', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: Array.from({ length: 30 }, (_, index) => ({
      externalId: `entity:service:${index + 1}`,
      kind: 'SERVICE',
      origin: 'java',
      name: `LargeService${index + 1}`,
      displayName: `LargeService${index + 1}`,
      scopeId: 'scope:pkg:large',
      sourceRefs: [],
      metadata: {},
    })),
    relationships: [],
  };
}

function createViewpointBiasPayload(): FullSnapshotPayload {
  return {
    ...createPayload(),
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg:handlers', kind: 'PACKAGE', name: 'browser.handlers', displayName: 'browser.handlers', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:repoAccess', kind: 'REPOSITORY', origin: 'java', name: 'BrowserRepository', displayName: 'BrowserRepository', scopeId: 'scope:pkg:handlers', sourceRefs: [], metadata: { architecturalRoles: ['persistence-access'] } },
      { externalId: 'entity:serviceFlow', kind: 'SERVICE', origin: 'java', name: 'BrowserFlowService', displayName: 'BrowserFlowService', scopeId: 'scope:pkg:handlers', sourceRefs: [], metadata: { architecturalRoles: ['application-service'] } },
      { externalId: 'entity:endpoint', kind: 'ENDPOINT', origin: 'java', name: 'BrowserEndpoint', displayName: 'BrowserEndpoint', scopeId: 'scope:pkg:handlers', sourceRefs: [], metadata: { architecturalRoles: ['api-entrypoint'] } },
    ],
    relationships: [],
  };
}

describe('BrowserNavigationTree entity-aware rendering', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('caps very large sibling groups behind a show-more control', () => {
    const index = buildBrowserSnapshotIndex(createLargeScopePayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:pkg:large',
      selectedEntityIds: [],
      treeMode: 'advanced',
      onSelectScope: () => {},
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
    }));

    expect(markup).toContain('Show 5 more');
    expect((markup.match(/browser-tree__node-button browser-tree__node-button--entity/g) ?? []).length).toBe(25);
    expect(markup).toContain('LargeService30');
  });

  test('does not cap filtered search paths even when the scope is large', () => {
    const index = buildBrowserSnapshotIndex(createLargeScopePayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:pkg:large',
      selectedEntityIds: [],
      treeMode: 'advanced',
      onSelectScope: () => {},
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
      searchQuery: 'largeservice30',
      searchResults: [
        {
          kind: 'entity',
          id: 'entity:service:30',
          title: 'LargeService30',
          subtitle: 'scope:pkg:large',
          scopeId: 'scope:pkg:large',
          score: 100,
        },
      ],
    }));

    expect(markup).toContain('Filtered by local search');
    expect(markup).toContain('LargeService30');
    expect(markup).not.toContain('Show 5 more');
  });


  test('restores persisted tree expansion state when provided', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:file',
      selectedEntityIds: ['entity:page'],
      treeMode: 'filesystem',
      onSelectScope: () => {},
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
      persistedTreeState: {
        expandedScopeIds: ['scope:repo', 'scope:file'],
        expandedCategories: ['REPOSITORY'],
        expandedEntityIds: ['entity:layout'],
        expandedChildListNodeIds: [],
      },
    }));

    expect(markup).toContain('Collapse Home.tsx');
    expect(markup).toContain('Collapse HomeLayout');
    expect(markup).toContain('HomePage');
  });

  test('renders mixed scope and entity children under an expanded scope in stable order', () => {    const index = buildBrowserSnapshotIndex(createPayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:pkg',
      treeMode: 'advanced',
      onSelectScope: () => {},
      selectedEntityIds: [],
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
    }));

    const childPackageIndex = markup.indexOf('browser.ui');
    const controllerIndex = markup.indexOf('BrowserController');
    const serviceIndex = markup.indexOf('BrowserService');

    expect(markup).toContain('data-node-type="scope"');
    expect(markup).toContain('data-node-type="entity"');
    expect(markup).toContain('browser-tree__row--entity');
    expect(markup).toContain('browser-tree__node-kind--entity');
    expect(markup).toContain('Pkg');
    expect(markup).toContain('Ent');
    expect(markup).toContain('Svc');
    expect(childPackageIndex).toBeGreaterThan(-1);
    expect(controllerIndex).toBeGreaterThan(childPackageIndex);
    expect(serviceIndex).toBeGreaterThan(controllerIndex);
  });

  test('renders entity rows with direct add-to-canvas affordances', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:file',
      treeMode: 'filesystem',
      onSelectScope: () => {},
      selectedEntityIds: ['entity:layout'],
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
    }));

    expect(markup).toContain('HomeLayout');
    expect(markup).toContain('browser-tree__toggle browser-tree__toggle--entity');
    expect(markup).toContain('Add HomeLayout to canvas');
    expect(markup).toContain('HomeLayout — select entity');
    expect(markup).toContain('browser-tree__row browser-tree__row--entity browser-tree__row--active');
    expect(markup).toContain('UI');
  });



  test('filters the tree to matched entity paths when local search is active', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:file',
      selectedEntityIds: [],
      treeMode: 'filesystem',
      onSelectScope: () => {},
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
      searchQuery: 'homeroute',
      searchResults: [
        {
          kind: 'entity',
          id: 'entity:route',
          title: 'homeRoute',
          subtitle: 'scope:file',
          scopeId: 'scope:file',
          score: 100,
        },
      ],
    }));

    expect(markup).toContain('Filtered by local search');
    expect(markup).toContain('Expand HomeLayout');
    expect(markup).toContain('Home.tsx');
    expect(markup).toContain('HomeLayout');
    expect(markup).not.toContain('BrowserController');
  });

  test('biases entity ordering and highlighting by viewpoint without hiding other entity kinds', () => {
    const index = buildBrowserSnapshotIndex(createViewpointBiasPayload());
    const children = buildNavigationChildNodes(index, 'scope:pkg:handlers', 'advanced', { viewpointId: 'request-handling' });
    const entityChildren = children.filter((child) => child.nodeType === 'entity');

    expect(entityChildren.map((child) => child.displayName)).toEqual([
      'BrowserEndpoint',
      'BrowserFlowService',
      'BrowserRepository',
    ]);
    expect(entityChildren.slice(0, 2).every((child) => child.isViewpointPreferred)).toBe(true);
    expect(entityChildren[2]?.isViewpointPreferred).toBe(false);

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:pkg:handlers',
      selectedEntityIds: [],
      treeMode: 'advanced',
      onSelectScope: () => {},
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
      selectedViewpointId: 'request-handling',
    }));

    expect(markup).toContain('Biased by viewpoint');
    expect(markup).toContain('BrowserRepository');
  });

  test('shows expand affordance only for safely expandable entity containers', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    const markup = renderToStaticMarkup(createElement(BrowserNavigationTree, {
      index,
      selectedScopeId: 'scope:file',
      treeMode: 'filesystem',
      onSelectScope: () => {},
      selectedEntityIds: ['entity:page'],
      onAddScopeEntitiesToCanvas: () => {},
      onSelectEntity: () => {},
      onAddEntityToCanvas: () => {},
      onTreeModeChange: () => {},
    }));

    expect(markup).toContain('Collapse HomeLayout');
    expect(markup).toContain('HomePage has no child nodes');
    expect(markup).not.toContain('Expand useHomeLayoutData');
  });
});
