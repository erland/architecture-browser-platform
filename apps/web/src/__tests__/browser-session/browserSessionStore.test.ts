import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { addDependenciesToCanvas, addEntityToCanvas, addScopeToCanvas, addPrimaryEntitiesForScope, clearCanvas, isolateCanvasSelection, arrangeAllCanvasNodes, arrangeCanvasAroundFocus, removeCanvasSelection, removeEntityFromCanvas, requestFitCanvasView, moveCanvasNode, setCanvasViewport, selectCanvasEntity, setCanvasEntityClassPresentationMode, toggleCanvasEntityClassPresentationMembers, toggleCanvasNodePin } from '../../browser-session/canvas-api';
import { createEmptyBrowserSessionState, createPersistedBrowserSessionState, hydrateBrowserSessionState } from '../../browser-session/state';
import { focusBrowserElement, openFactsPanel } from '../../browser-session/facts-panel-api';
import { openSnapshotSession } from '../../browser-session/lifecycle-api';
import { applySelectedViewpoint, setSelectedViewpoint, setViewpointApplyMode, setViewpointPresentationPreference, setViewpointScopeMode } from '../../browser-session/viewpoints-api';
import { selectBrowserScope, setBrowserSearch } from '../../browser-session/navigation-api';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-session-1',
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
  scopeCount: 2,
  entityCount: 10,
  relationshipCount: 9,
  diagnosticCount: 1,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createClassPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:repo', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
      { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:save', kind: 'METHOD', origin: 'java', name: 'save', displayName: 'save()', scopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:order:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:order:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
    ],
    viewpoints: [
      {
        id: 'persistence-model',
        title: 'Persistence model',
        description: 'Shows persistence-centric entities.',
        availability: 'available',
        confidence: 0.8,
        seedEntityIds: ['entity:order'],
        seedRoleIds: ['persistent-entity'],
        expandViaSemantics: [],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

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
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['api-entrypoint'] } },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['application-service'] } },
      { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'LayoutTab', displayName: 'LayoutTab', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
      { externalId: 'entity:adapter', kind: 'COMPONENT', origin: 'java', name: 'ExternalSyncAdapter', displayName: 'ExternalSyncAdapter', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['integration-adapter'] } },
      { externalId: 'entity:external', kind: 'SYSTEM', origin: 'external', name: 'CrmSystem', displayName: 'CRM System', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['external-dependency'] } },
      { externalId: 'entity:web-module', kind: 'MODULE', origin: 'react', name: 'WebModule', displayName: 'Web Module', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['module-boundary'] } },
      { externalId: 'entity:api-module', kind: 'MODULE', origin: 'java', name: 'ApiModule', displayName: 'API Module', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['module-boundary'] } },
      { externalId: 'entity:ui-layout', kind: 'COMPONENT', origin: 'react', name: 'AppShell', displayName: 'App Shell', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['ui-layout'] } },
      { externalId: 'entity:ui-dashboard-page', kind: 'COMPONENT', origin: 'react', name: 'DashboardPage', displayName: 'Dashboard Page', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      { externalId: 'entity:ui-settings-page', kind: 'COMPONENT', origin: 'react', name: 'SettingsPage', displayName: 'Settings Page', scopeId: 'scope:web', sourceRefs: [], metadata: { architecturalRoles: ['ui-page', 'ui-navigation-node'] } },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:search', label: 'uses', sourceRefs: [], metadata: { architecturalSemantics: ['serves-request'] } },
      { externalId: 'rel:2', kind: 'USES', fromEntityId: 'entity:layout', toEntityId: 'entity:browser', label: 'calls', sourceRefs: [], metadata: { architecturalSemantics: ['accesses-persistence'] } },
      { externalId: 'rel:3', kind: 'CALLS', fromEntityId: 'entity:search', toEntityId: 'entity:adapter', label: 'calls adapter', sourceRefs: [], metadata: { architecturalSemantics: ['invokes-use-case'] } },
      { externalId: 'rel:4', kind: 'CALLS', fromEntityId: 'entity:adapter', toEntityId: 'entity:external', label: 'calls external', sourceRefs: [], metadata: { architecturalSemantics: ['calls-external-system'] } },
      { externalId: 'rel:5', kind: 'DEPENDS_ON', fromEntityId: 'entity:web-module', toEntityId: 'entity:api-module', label: 'depends on module', sourceRefs: [], metadata: { architecturalSemantics: ['depends-on-module'] } },
      { externalId: 'rel:6', kind: 'CONTAINS', fromEntityId: 'entity:ui-layout', toEntityId: 'entity:ui-dashboard-page', label: 'contains route', sourceRefs: [], metadata: { architecturalSemantics: ['contains-route'] } },
      { externalId: 'rel:7', kind: 'NAVIGATES_TO', fromEntityId: 'entity:ui-dashboard-page', toEntityId: 'entity:ui-settings-page', label: 'navigates to settings', sourceRefs: [], metadata: { architecturalSemantics: ['navigates-to'] } },
      { externalId: 'rel:8', kind: 'REDIRECTS_TO', fromEntityId: 'entity:ui-settings-page', toEntityId: 'entity:ui-dashboard-page', label: 'redirects to dashboard', sourceRefs: [], metadata: { architecturalSemantics: ['redirects-to'] } },
      { externalId: 'rel:9', kind: 'GUARDS', fromEntityId: 'entity:ui-layout', toEntityId: 'entity:ui-settings-page', label: 'guards route', sourceRefs: [], metadata: { architecturalSemantics: ['guards-route'] } },
    ],
    viewpoints: [
      {
        id: 'request-handling',
        title: 'Request handling',
        description: 'Shows API entrypoints and collaborating services.',
        availability: 'available',
        confidence: 0.9,
        seedEntityIds: [],
        seedRoleIds: ['api-entrypoint', 'application-service'],
        expandViaSemantics: ['serves-request'],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
      {
        id: 'api-surface',
        title: 'API surface',
        description: 'Shows API entrypoints and their immediate neighbors.',
        availability: 'available',
        confidence: 0.88,
        seedEntityIds: [],
        seedRoleIds: ['api-entrypoint'],
        expandViaSemantics: ['serves-request'],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
      {
        id: 'persistence-model',
        title: 'Persistence model',
        description: 'Shows persistence-centric entities.',
        availability: 'available',
        confidence: 0.8,
        seedEntityIds: ['entity:layout'],
        seedRoleIds: ['persistent-entity'],
        expandViaSemantics: ['accesses-persistence'],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
      {
        id: 'integration-map',
        title: 'Integration map',
        description: 'Shows integration adapters and external dependencies.',
        availability: 'available',
        confidence: 0.82,
        seedEntityIds: [],
        seedRoleIds: ['integration-adapter'],
        expandViaSemantics: ['calls-external-system'],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
      {
        id: 'module-dependencies',
        title: 'Module dependencies',
        description: 'Shows module boundaries and their dependency edges.',
        availability: 'available',
        confidence: 0.84,
        seedEntityIds: [],
        seedRoleIds: ['module-boundary'],
        expandViaSemantics: ['depends-on-module'],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
      {
        id: 'ui-navigation',
        title: 'UI navigation',
        description: 'Shows layouts, pages, and route/navigation flows.',
        availability: 'available',
        confidence: 0.86,
        seedEntityIds: [],
        seedRoleIds: ['ui-layout', 'ui-page', 'ui-navigation-node'],
        expandViaSemantics: ['contains-route', 'navigates-to', 'redirects-to', 'guards-route'],
        preferredDependencyViews: ['default'],
        evidenceSources: ['test'],
      },
    ],
    diagnostics: [
      { externalId: 'diag:1', severity: 'WARN', phase: 'MODEL', code: 'TEST', message: 'Test diagnostic', fatal: false, filePath: null, scopeId: 'scope:web', entityId: 'entity:browser', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserSessionStore', () => {


  test('class-like entities get a default class presentation policy when added to the canvas', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        entities: [
          { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
          { externalId: 'entity:service', kind: 'COMPONENT', origin: 'java', name: 'OrderService', displayName: 'OrderService', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
        ],
        relationships: [],
      },
    });

    const withClass = addEntityToCanvas(opened, 'entity:order');
    const withComponent = addEntityToCanvas(withClass, 'entity:service');

    expect(withComponent.canvasNodes.find((node) => node.id === 'entity:order')).toMatchObject({
      kind: 'entity',
      id: 'entity:order',
      classPresentation: {
        mode: 'simple',
        showFields: true,
        showFunctions: true,
      },
    });
    expect(withComponent.canvasNodes.find((node) => node.id === 'entity:service')?.classPresentation).toBeUndefined();
  });


  test('updates selected class node presentation mode and member toggles through dedicated canvas mutations', () => {
    const payload = createPayload();
    payload.entities = [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ];
    payload.relationships = [];

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:order');
    state = selectCanvasEntity(state, 'entity:order');

    state = setCanvasEntityClassPresentationMode(state, ['entity:order'], 'compartments');
    state = toggleCanvasEntityClassPresentationMembers(state, ['entity:order'], 'functions');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'compartments',
      showFields: true,
      showFunctions: false,
    });
  });


  test('class presentation changes refresh routes conservatively without moving unrelated canvas nodes', () => {
    const payload = createPayload();
    payload.entities = [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'COMPONENT', origin: 'java', name: 'OrderService', displayName: 'OrderService', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:field:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ];
    payload.relationships = [
      {
        externalId: 'rel:contains-field',
        fromEntityId: 'entity:order',
        toEntityId: 'entity:field:id',
        kind: 'CONTAINS',
        label: null,
        sourceRefs: [],
        metadata: { metadata: {} },
      },
    ];

    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });
    state = addEntityToCanvas(state, 'entity:order');
    state = addEntityToCanvas(state, 'entity:service');
    state = moveCanvasNode(state, { kind: 'entity', id: 'entity:service' }, { x: 920, y: 180 });

    const serviceBefore = state.canvasNodes.find((node) => node.id === 'entity:service');
    const routeRefreshBefore = state.routeRefreshRequestedAt;

    const expanded = setCanvasEntityClassPresentationMode(state, ['entity:order'], 'expanded');
    const serviceAfterExpand = expanded.canvasNodes.find((node) => node.id === 'entity:service');

    expect(expanded.routeRefreshRequestedAt).not.toBeNull();
    expect(expanded.routeRefreshRequestedAt).not.toBe(routeRefreshBefore);
    expect(serviceAfterExpand?.x).toBe(serviceBefore?.x);
    expect(serviceAfterExpand?.y).toBe(serviceBefore?.y);

    const collapsed = setCanvasEntityClassPresentationMode(expanded, ['entity:order'], 'simple');
    const serviceAfterCollapse = collapsed.canvasNodes.find((node) => node.id === 'entity:service');

    expect(collapsed.routeRefreshRequestedAt).not.toBeNull();
    expect(typeof collapsed.routeRefreshRequestedAt).toBe('string');
    expect(serviceAfterCollapse?.x).toBe(serviceBefore?.x);
    expect(serviceAfterCollapse?.y).toBe(serviceBefore?.y);
  });

  test('opening a snapshot normalizes persisted class nodes into the explicit class presentation policy', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        entities: [
          { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
        ],
        relationships: [],
      },
    });

    const reopened = openSnapshotSession({
      ...opened,
      canvasNodes: [{ kind: 'entity', id: 'entity:order', x: 120, y: 180 }],
    }, {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        entities: [
          { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
        ],
        relationships: [],
      },
      keepViewState: true,
    });

    expect(reopened.canvasNodes).toEqual([
      expect.objectContaining({
        kind: 'entity',
        id: 'entity:order',
        classPresentation: {
          mode: 'simple',
          showFields: true,
          showFunctions: true,
        },
      }),
    ]);
  });
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('openSnapshotSession opens a prepared local snapshot as the active Browser session', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    expect(opened.activeSnapshot?.snapshotId).toBe(snapshotSummary.id);
    expect(opened.index?.snapshotId).toBe(snapshotSummary.id);
    expect(opened.selectedScopeId).toBe('scope:repo');
    expect(opened.treeMode).toBe('filesystem');
  });


  test('openSnapshotSession chooses package tree mode by default for Java-oriented snapshots', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
        scopes: [
          { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
          { externalId: 'scope:module', kind: 'MODULE', name: 'backend', displayName: 'Backend', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
          { externalId: 'scope:pkg:root', kind: 'PACKAGE', name: 'com.example', displayName: 'com.example', parentScopeId: 'scope:module', sourceRefs: [], metadata: {} },
          { externalId: 'scope:file', kind: 'FILE', name: 'src/main/java/com/example/Browser.java', displayName: 'Browser.java', parentScopeId: 'scope:pkg:root', sourceRefs: [], metadata: {} },
        ],
      },
    });

    expect(opened.treeMode).toBe('package');
  });

  test('scope selection and local search stay inside the Browser session store', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const withScope = selectBrowserScope(opened, 'scope:web');
    const withSearch = setBrowserSearch(withScope, 'search', 'scope:web');

    expect(withSearch.selectedScopeId).toBe('scope:web');
    expect(withSearch.searchResults.map((result) => result.id)).toContain('entity:search');
    expect(withSearch.focusedElement).toEqual({ kind: 'scope', id: 'scope:web' });
  });

  test('canvas graph actions add entities, expand dependencies, and clear consistently', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const withEntity = addEntityToCanvas(opened, 'entity:browser');
    const expanded = addDependenciesToCanvas(withEntity, 'entity:browser', 'ALL');
    const afterRemoval = removeEntityFromCanvas(expanded, 'entity:search');
    const cleared = clearCanvas(afterRemoval);

    expect(withEntity.canvasNodes.map((node) => node.id)).toContain('entity:browser');
    expect(expanded.canvasEdges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:1', 'rel:2']);
    expect(afterRemoval.canvasNodes.map((node) => node.id)).not.toContain('entity:search');
    expect(cleared.canvasNodes).toEqual([]);
    expect(cleared.canvasEdges).toEqual([]);
  });



  test('adding related entities automatically shows meaningful relationships already present between visible nodes', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    expect(state.canvasEdges).toEqual([]);

    state = addEntityToCanvas(state, 'entity:search');

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:search']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:1']);
  });

  test('adding a third related entity keeps previously visible edges and adds newly visible meaningful relationships', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:layout');
    state = addEntityToCanvas(state, 'entity:browser');
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:2']);

    state = addEntityToCanvas(state, 'entity:search');

    expect(state.canvasEdges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:1', 'rel:2']);
  });


  test('reopening a snapshot with kept view state restores meaningful relationships between visible entities', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    state = addEntityToCanvas(state, 'entity:search');

    const persisted = createPersistedBrowserSessionState({
      ...state,
      canvasEdges: [],
    });
    const hydrated = hydrateBrowserSessionState(persisted);
    const reopened = openSnapshotSession(hydrated, {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
      keepViewState: true,
    });

    expect(reopened.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:search']);
    expect(reopened.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:1']);
  });

  test('scope add defaults can resolve to primary entities instead of scope nodes', () => {
    const payload = {
      ...createPayload(),
      scopes: [
        { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
        { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
        { externalId: 'scope:file-browser', kind: 'FILE', name: 'src/BrowserView.tsx', displayName: 'src/BrowserView.tsx', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      ],
      entities: [
        { externalId: 'entity:module-browser', kind: 'MODULE', origin: 'react', name: 'BrowserView.tsx', displayName: 'BrowserView.tsx', scopeId: 'scope:file-browser', sourceRefs: [], metadata: {} },
        { externalId: 'entity:function-render', kind: 'FUNCTION', origin: 'react', name: 'renderBrowser', displayName: 'renderBrowser', scopeId: 'scope:file-browser', sourceRefs: [], metadata: {} },
      ],
      relationships: [],
      viewpoints: [],
    diagnostics: [],
    } satisfies FullSnapshotPayload;

    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload,
    });

    const next = addPrimaryEntitiesForScope(opened, 'scope:file-browser');

    expect(next.selectedScopeId).toBe('scope:file-browser');
    expect(next.canvasNodes).toHaveLength(1);
    expect(next.canvasNodes[0]).toMatchObject({ kind: 'entity', id: 'entity:module-browser' });
    expect(next.canvasNodes[0].x).toBeGreaterThanOrEqual(0);
    expect(next.canvasNodes[0].y).toBeGreaterThanOrEqual(0);
    expect(next.selectedEntityIds).toEqual(['entity:module-browser']);
    expect(next.focusedElement).toEqual({ kind: 'entity', id: 'entity:module-browser' });
    expect(next.factsPanelMode).toBe('entity');
  });


  test('incremental placement keeps existing nodes stable and places peer entities near their shared scope', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    const browserNodeBefore = state.canvasNodes.find((node) => node.id === 'entity:browser');
    expect(browserNodeBefore).toBeDefined();

    state = addEntityToCanvas(state, 'entity:search');
    const browserNodeAfter = state.canvasNodes.find((node) => node.id === 'entity:browser');
    const searchNode = state.canvasNodes.find((node) => node.id === 'entity:search');

    expect(browserNodeAfter?.x).toBe(browserNodeBefore?.x);
    expect(browserNodeAfter?.y).toBe(browserNodeBefore?.y);
    expect(searchNode?.x).not.toBe(browserNodeAfter?.x);
    expect(Math.abs((searchNode?.y ?? 0) - (browserNodeAfter?.y ?? 0))).toBeLessThanOrEqual(160);
  });

  test('dependency expansion places inbound neighbors to the left and outbound neighbors to the right of the focus entity', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    const focusNode = state.canvasNodes.find((node) => node.id === 'entity:browser');
    const expanded = addDependenciesToCanvas(state, 'entity:browser', 'ALL');
    const inboundNode = expanded.canvasNodes.find((node) => node.id === 'entity:layout');
    const outboundNode = expanded.canvasNodes.find((node) => node.id === 'entity:search');

    expect(focusNode).toBeDefined();
    expect(inboundNode).toBeDefined();
    expect(outboundNode).toBeDefined();
    expect(inboundNode!.x).toBeLessThan(focusNode!.x);
    expect(outboundNode!.x).toBeGreaterThan(focusNode!.x);
  });


  test('viewpoint presentation preference defaults to auto and can be changed locally', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    expect(opened.viewpointPresentationPreference).toBe('auto');

    const updated = setViewpointPresentationPreference(opened, 'entity-graph');
    expect(updated.viewpointPresentationPreference).toBe('entity-graph');
    expect(updated.viewpointSelection).toEqual(opened.viewpointSelection);
  });

  test('viewpoint selection tracks viewpoint id, scope mode, and derived applied graph state', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const selected = setSelectedViewpoint(opened, 'request-handling');
    const scoped = setViewpointScopeMode(selected, 'selected-subtree');
    const merged = setViewpointApplyMode(scoped, 'merge');

    expect(selected.viewpointSelection.viewpointId).toBe('request-handling');
    expect(selected.appliedViewpoint?.viewpoint.id).toBe('request-handling');
    expect(scoped.viewpointSelection.scopeMode).toBe('selected-subtree');
    expect(scoped.appliedViewpoint?.scopeMode).toBe('selected-subtree');
    expect(merged.viewpointSelection.applyMode).toBe('merge');
  });


  test('addEntityToCanvas normalizes compact UML add-time defaults into persisted class presentation policy', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createClassPayload(),
    });

    state = setSelectedViewpoint(state, 'persistence-model');
    state = addEntityToCanvas(state, 'entity:order');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'compartments',
      showFields: true,
      showFunctions: false,
    });

    state = setCanvasEntityClassPresentationMode(state, ['entity:order'], 'expanded');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'expanded',
      showFields: true,
      showFunctions: false,
    });
  });

  test('openSnapshotSession backfills missing class presentation from compact UML add-time defaults', () => {
    const reopened = openSnapshotSession({
      ...createEmptyBrowserSessionState(),
      viewpointSelection: {
        ...createEmptyBrowserSessionState().viewpointSelection,
        viewpointId: 'persistence-model',
      },
      canvasNodes: [
        { kind: 'entity', id: 'entity:order', x: 56, y: 64 },
      ],
    }, {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createClassPayload(),
      keepViewState: true,
    });

    expect(reopened.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'compartments',
      showFields: true,
      showFunctions: false,
    });
  });

  test('setCanvasEntityClassPresentationMode enables fields when compartments is selected with both member toggles hidden', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createClassPayload(),
    });

    state = addEntityToCanvas(state, 'entity:order');
    state = toggleCanvasEntityClassPresentationMembers(state, ['entity:order'], 'fields');
    state = toggleCanvasEntityClassPresentationMembers(state, ['entity:order'], 'functions');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'simple',
      showFields: false,
      showFunctions: false,
    });

    state = setCanvasEntityClassPresentationMode(state, ['entity:order'], 'compartments');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'compartments',
      showFields: true,
      showFunctions: false,
    });
  });


  test('request-handling defaults newly added classes to operation-focused compartments', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createClassPayload(),
        viewpoints: [
          {
            id: 'request-handling',
            title: 'Request handling',
            description: 'Trace requests across services.',
            availability: 'available',
            confidence: 0.91,
            seedEntityIds: [],
            seedRoleIds: ['api-entrypoint'],
            expandViaSemantics: ['serves-request'],
            preferredDependencyViews: ['runtime-dependencies'],
            evidenceSources: ['test'],
          },
        ],
      },
    });

    state = setSelectedViewpoint(state, 'request-handling');
    state = addEntityToCanvas(state, 'entity:order');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'compartments',
      showFields: false,
      showFunctions: true,
    });
  });

  test('module-dependencies keeps simple class defaults for newly added classes', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createClassPayload(),
        viewpoints: [
          {
            id: 'module-dependencies',
            title: 'Module dependencies',
            description: 'Show high-level module coupling.',
            availability: 'available',
            confidence: 0.88,
            seedEntityIds: [],
            seedRoleIds: ['module-boundary'],
            expandViaSemantics: ['depends-on-module'],
            preferredDependencyViews: ['module-dependencies'],
            evidenceSources: ['test'],
          },
        ],
      },
    });

    state = setSelectedViewpoint(state, 'module-dependencies');
    state = addEntityToCanvas(state, 'entity:order');

    expect(state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:order')?.classPresentation).toEqual({
      mode: 'simple',
      showFields: true,
      showFunctions: true,
    });
  });

  test('applySelectedViewpoint replaces canvas contents with seeded nodes and semantic edges', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'request-handling');
    state = applySelectedViewpoint(state);

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:search']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:1']);
    expect(state.selectedEntityIds).toEqual(['entity:browser', 'entity:search']);
    expect(state.appliedViewpoint?.viewpoint.id).toBe('request-handling');
    expect(state.canvasLayoutMode).toBe('radial');
  });


  test('api-surface apply focuses on entrypoints and immediate service neighbors', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'api-surface');
    state = applySelectedViewpoint(state);

    const entrypoint = state.canvasNodes.find((node) => node.id === 'entity:browser');
    const service = state.canvasNodes.find((node) => node.id === 'entity:search');
    const persistence = state.canvasNodes.find((node) => node.id === 'entity:layout');

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:search']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:1']);
    expect(entrypoint).toBeDefined();
    expect(service).toBeDefined();
    expect(persistence).toBeUndefined();
    expect(entrypoint!.x).toBeLessThan(service!.x);
    expect(state.appliedViewpoint?.recommendedLayout).toBe('api-surface');
  });

  test('request-handling apply uses a readable left-to-right flow layout', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'request-handling');
    state = setViewpointScopeMode(state, 'whole-snapshot');
    state = applySelectedViewpoint(state);

    const entrypoint = state.canvasNodes.find((node) => node.id === 'entity:browser');
    const service = state.canvasNodes.find((node) => node.id === 'entity:search');
    expect(entrypoint).toBeDefined();
    expect(service).toBeDefined();
    expect(entrypoint!.x).toBeLessThan(service!.x);
    expect(state.appliedViewpoint?.recommendedLayout).toBe('request-flow');
  });

  test('persistence-model apply uses a readable service-to-data layout', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'persistence-model');
    state = setViewpointScopeMode(state, 'whole-snapshot');
    state = applySelectedViewpoint(state);

    const service = state.canvasNodes.find((node) => node.id === 'entity:browser');
    const persistence = state.canvasNodes.find((node) => node.id === 'entity:layout');

    expect(service).toBeDefined();
    expect(persistence).toBeDefined();
    expect(service!.x).toBeLessThan(persistence!.x);
    expect(state.appliedViewpoint?.recommendedLayout).toBe('persistence-model');
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:2']);
  });

  test('integration-map apply uses a readable caller-to-adapter-to-external layout', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'integration-map');
    state = setViewpointScopeMode(state, 'whole-snapshot');
    state = applySelectedViewpoint(state);

    const caller = state.canvasNodes.find((node) => node.id === 'entity:search');
    const adapter = state.canvasNodes.find((node) => node.id === 'entity:adapter');
    const external = state.canvasNodes.find((node) => node.id === 'entity:external');

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:adapter', 'entity:external', 'entity:search']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:3', 'rel:4']);
    expect(caller).toBeDefined();
    expect(adapter).toBeDefined();
    expect(external).toBeDefined();
    expect(caller!.x).toBeLessThan(adapter!.x);
    expect(adapter!.x).toBeLessThan(external!.x);
    expect(state.appliedViewpoint?.recommendedLayout).toBe('integration-map');
  });

  test('module-dependencies apply uses a readable module-to-module layout', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'module-dependencies');
    state = setViewpointScopeMode(state, 'whole-snapshot');
    state = applySelectedViewpoint(state);

    const webModule = state.canvasNodes.find((node) => node.id === 'entity:web-module');
    const apiModule = state.canvasNodes.find((node) => node.id === 'entity:api-module');

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:api-module', 'entity:web-module']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:5']);
    expect(webModule).toBeDefined();
    expect(apiModule).toBeDefined();
    expect(webModule!.x).not.toBe(apiModule!.x);
    expect(state.appliedViewpoint?.recommendedLayout).toBe('module-dependencies');
  });


  test('ui-navigation apply uses a readable layout-to-page flow layout', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setSelectedViewpoint(state, 'ui-navigation');
    state = setViewpointScopeMode(state, 'whole-snapshot');
    state = applySelectedViewpoint(state);

    const layout = state.canvasNodes.find((node) => node.id === 'entity:ui-layout');
    const dashboard = state.canvasNodes.find((node) => node.id === 'entity:ui-dashboard-page');
    const settings = state.canvasNodes.find((node) => node.id === 'entity:ui-settings-page');

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:ui-dashboard-page', 'entity:ui-layout', 'entity:ui-settings-page']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:6', 'rel:9', 'rel:7', 'rel:8']);
    expect(layout).toBeDefined();
    expect(dashboard).toBeDefined();
    expect(settings).toBeDefined();
    expect(layout!.x).toBeLessThan(dashboard!.x);
    expect(dashboard!.x).toBeLessThanOrEqual(settings!.x);
    expect(state.appliedViewpoint?.recommendedLayout).toBe('ui-navigation');
  });

  test('applySelectedViewpoint can merge with existing canvas content', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:layout');
    state = setSelectedViewpoint(state, 'request-handling');
    state = setViewpointApplyMode(state, 'merge');
    state = applySelectedViewpoint(state);

    expect(state.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:layout', 'entity:search']);
    expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:1']);
  });

  test('adding an entity while its scope node is visible places the entity near the scope container', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    const scopeNode = state.canvasNodes.find((node) => node.kind === 'scope' && node.id === 'scope:web');
    const entityNode = state.canvasNodes.find((node) => node.kind === 'entity' && node.id === 'entity:browser');

    expect(scopeNode).toBeDefined();
    expect(entityNode).toBeDefined();
    expect(entityNode!.x).toBeGreaterThanOrEqual(scopeNode!.x);
    expect(entityNode!.y).toBeGreaterThan(scopeNode!.y);
  });

  test('moving a canvas node persists coordinates and marks it as manually placed', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    const initialNode = state.canvasNodes.find((node) => node.id === 'entity:browser');
    expect(initialNode).toBeDefined();

    const moved = moveCanvasNode(state, { kind: 'entity', id: 'entity:browser' }, {
      x: (initialNode?.x ?? 0) + 140,
      y: (initialNode?.y ?? 0) + 36,
    });
    const movedNode = moved.canvasNodes.find((node) => node.id === 'entity:browser');

    expect(movedNode?.x).toBe((initialNode?.x ?? 0) + 140);
    expect(movedNode?.y).toBe((initialNode?.y ?? 0) + 36);
    expect(movedNode?.manuallyPlaced).toBe(true);
  });

  test('facts panel focus and fit-view requests are session actions, not component-local state', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const focused = focusBrowserElement(opened, { kind: 'entity', id: 'entity:browser' });
    const factsOpen = openFactsPanel(focused, 'entity', 'bottom');
    const fitRequested = requestFitCanvasView(factsOpen);

    expect(factsOpen.factsPanelMode).toBe('entity');
    expect(factsOpen.factsPanelLocation).toBe('bottom');
    expect(fitRequested.fitViewRequestedAt).not.toBeNull();
  });

  test('canvas interaction helpers support multi-select, isolate, remove, pin, and explicit arrange commands', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:browser' });
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:search', true);

    const isolated = isolateCanvasSelection(state);
    const arrangedAroundFocus = arrangeCanvasAroundFocus(isolated);
    const arrangedAll = arrangeAllCanvasNodes(arrangedAroundFocus);
    const afterRemoval = removeCanvasSelection(arrangedAll);

    expect(isolated.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:browser', 'entity:search']);
    expect(isolated.canvasEdges.map((edge) => edge.relationshipId)).toEqual(['rel:1']);
    expect(isolated.canvasNodes.find((node) => node.id === 'entity:browser')?.pinned).toBe(true);
    expect(arrangedAroundFocus.canvasLayoutMode).toBe('radial');
    expect(arrangedAll.canvasLayoutMode).toBe('structure');
    expect(arrangedAroundFocus.routeRefreshRequestedAt).not.toBeNull();
    expect(arrangedAll.routeRefreshRequestedAt).not.toBeNull();
    expect(afterRemoval.canvasNodes).toEqual([]);
    expect(afterRemoval.selectedEntityIds).toEqual([]);
  });



  test('arrange commands keep pinned and manually placed nodes stable while moving only eligible nodes', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = moveCanvasNode(state, { kind: 'entity', id: 'entity:search' }, { x: 920, y: 180 });
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:layout' });

    const searchBefore = state.canvasNodes.find((node) => node.id === 'entity:search');
    const layoutBefore = state.canvasNodes.find((node) => node.id === 'entity:layout');

    const arrangedAll = arrangeAllCanvasNodes(state);
    const arrangedSearch = arrangedAll.canvasNodes.find((node) => node.id === 'entity:search');
    const arrangedLayout = arrangedAll.canvasNodes.find((node) => node.id === 'entity:layout');
    const arrangedBrowser = arrangedAll.canvasNodes.find((node) => node.id === 'entity:browser');

    expect(arrangedSearch?.x).toBe(searchBefore?.x);
    expect(arrangedSearch?.y).toBe(searchBefore?.y);
    expect(arrangedSearch?.manuallyPlaced).toBe(true);
    expect(arrangedLayout?.x).toBe(layoutBefore?.x);
    expect(arrangedLayout?.y).toBe(layoutBefore?.y);
    expect(arrangedLayout?.pinned).toBe(true);
    expect(arrangedBrowser?.x).toBe(state.canvasNodes.find((node) => node.id === 'entity:browser')?.x);
    expect(arrangedBrowser?.y).toBe(state.canvasNodes.find((node) => node.id === 'entity:browser')?.y);
  });

  test('focused arrange uses the anchored focus position when the focus entity was manually placed', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = moveCanvasNode(state, { kind: 'entity', id: 'entity:browser' }, { x: 840, y: 420 });

    const arranged = arrangeCanvasAroundFocus(state);
    const focusNode = arranged.canvasNodes.find((node) => node.id === 'entity:browser');

    expect(focusNode).toMatchObject({ x: 840, y: 420, manuallyPlaced: true });
  });


  test('session state seeds conservative routing/layout defaults and preserves them through persistence', () => {
    const state = createEmptyBrowserSessionState();

    expect(state.routingLayoutConfig.features).toEqual({
      orthogonalRouting: true,
      laneSeparation: true,
      postLayoutCleanup: true,
    });
    expect(state.routingLayoutConfig.defaults).toMatchObject({
      gridSize: 20,
      obstacleMargin: 10,
      laneSpacing: 16,
      maxChannelShiftSteps: 12,
      endpointStubLength: 10,
      maxLaneCountForSpacing: 5,
    });

    const opened = openSnapshotSession(state, {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    const customized = {
      ...opened,
      routingLayoutConfig: {
        ...opened.routingLayoutConfig,
        features: {
          ...opened.routingLayoutConfig.features,
          postLayoutCleanup: false,
        },
        defaults: {
          ...opened.routingLayoutConfig.defaults,
          laneSpacing: 24,
        },
      },
    };

    const persisted = createPersistedBrowserSessionState(customized);
    const hydrated = hydrateBrowserSessionState(persisted);

    expect(hydrated.routingLayoutConfig.features.postLayoutCleanup).toBe(false);
    expect(hydrated.routingLayoutConfig.defaults.laneSpacing).toBe(24);
  });

  test('hydration normalizes partial routing/layout config to conservative defaults', () => {
    const hydrated = hydrateBrowserSessionState({
      routingLayoutConfig: {
        features: { orthogonalRouting: false },
        defaults: { laneSpacing: -12, maxLaneCountForSpacing: 0 },
      } as never,
    });

    expect(hydrated.routingLayoutConfig.features.orthogonalRouting).toBe(false);
    expect(hydrated.routingLayoutConfig.features.laneSeparation).toBe(true);
    expect(hydrated.routingLayoutConfig.features.postLayoutCleanup).toBe(true);
    expect(hydrated.routingLayoutConfig.defaults.laneSpacing).toBe(0);
    expect(hydrated.routingLayoutConfig.defaults.maxLaneCountForSpacing).toBe(1);
    expect(hydrated.routingLayoutConfig.defaults.obstacleMargin).toBe(10);
  });

  test('arrange commands can skip post-layout cleanup when the conservative flag is disabled', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = {
      ...state,
      routingLayoutConfig: {
        ...state.routingLayoutConfig,
        features: {
          ...state.routingLayoutConfig.features,
          postLayoutCleanup: false,
        },
      },
    };

    const arranged = arrangeAllCanvasNodes(state);

    expect(arranged.routeRefreshRequestedAt).not.toBeNull();
    expect(arranged.routingLayoutConfig.features.postLayoutCleanup).toBe(false);
  });

  test('viewport state persists pan and zoom in the Browser session store', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const zoomed = setCanvasViewport(opened, { zoom: 1.35, offsetX: 120, offsetY: 48 });

    expect(zoomed.canvasViewport).toEqual({ zoom: 1.35, offsetX: 120, offsetY: 48 });
  });

  test('persisted session state can be hydrated without carrying stale payload data', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    const mutated = requestFitCanvasView(openFactsPanel(addEntityToCanvas(opened, 'entity:browser'), 'entity', 'right'));

    const persisted = createPersistedBrowserSessionState(mutated);
    const hydrated = hydrateBrowserSessionState(persisted);

    expect(hydrated.activeSnapshot?.snapshotId).toBe(snapshotSummary.id);
    expect(hydrated.canvasNodes.map((node) => node.id)).toEqual(['entity:browser']);
    expect(hydrated.canvasLayoutMode).toBe('grid');
    expect(hydrated.payload).toBeNull();
    expect(hydrated.index).toBeNull();
  });
});
