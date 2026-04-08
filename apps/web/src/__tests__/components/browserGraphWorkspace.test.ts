import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { BrowserGraphWorkspace, buildEntitySelectionActions } from '../../components/browser-graph-workspace/BrowserGraphWorkspace';
import { BrowserGraphWorkspaceEdgeLayer } from '../../components/browser-graph-workspace/BrowserGraphWorkspaceEdgeLayer';
import { resolveRenderedEdgeGeometry } from '../../components/browser-graph-workspace/BrowserGraphWorkspace.sections';
import { createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, selectBrowserScope, setSelectedViewpoint } from '../../browser-session';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-canvas-toolbar-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-canvas-toolbar',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 4,
  entityCount: 8,
  relationshipCount: 6,
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
      { externalId: 'scope:file', kind: 'FILE', name: 'src/BrowserView.tsx', displayName: 'src/BrowserView.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'info.example.browser', displayName: 'info.example.browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg.sub', kind: 'PACKAGE', name: 'info.example.browser.sub', displayName: 'info.example.browser.sub', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:module', kind: 'MODULE', origin: 'react', name: 'BrowserViewModule', displayName: 'BrowserViewModule', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:function.render', kind: 'FUNCTION', origin: 'react', name: 'renderBrowser', displayName: 'renderBrowser', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:function.layout', kind: 'FUNCTION', origin: 'react', name: 'computeLayout', displayName: 'computeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:package', kind: 'PACKAGE', origin: 'java', name: 'info.example.browser', displayName: 'info.example.browser', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:subpackage', kind: 'PACKAGE', origin: 'java', name: 'info.example.browser.sub', displayName: 'info.example.browser.sub', scopeId: 'scope:pkg.sub', sourceRefs: [], metadata: {} },
      { externalId: 'entity:class', kind: 'CLASS', origin: 'java', name: 'BrowserController', displayName: 'BrowserController', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:interface', kind: 'INTERFACE', origin: 'java', name: 'BrowserContract', displayName: 'BrowserContract', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'SERVICE', origin: 'java', name: 'BrowserService', displayName: 'BrowserService', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:module:function1', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:function.render', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:module:function2', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:function.layout', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:package:subpackage', kind: 'CONTAINS', fromEntityId: 'entity:package', toEntityId: 'entity:subpackage', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:package:class', kind: 'CONTAINS', fromEntityId: 'entity:package', toEntityId: 'entity:class', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:function:calls', kind: 'CALLS', fromEntityId: 'entity:function.render', toEntityId: 'entity:service', label: 'calls', sourceRefs: [], metadata: {} },
      { externalId: 'rel:service:uses-function', kind: 'USES', fromEntityId: 'entity:service', toEntityId: 'entity:function.render', label: 'uses', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('BrowserGraphWorkspace entity-first toolbar helpers', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });



  test('builds module actions around containment and dependencies', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const entity = index.entitiesById.get('entity:module')!;

    expect(buildEntitySelectionActions(index, entity).map((action) => action.label)).toEqual([
      'Contained (2)',
      'Functions (2)',
      'Dependencies',
      'Used by',
      'Remove',
      'Pin',
    ]);
  });

  test('builds package actions around subpackages and subtree analysis', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const entity = index.entitiesById.get('entity:package')!;

    expect(buildEntitySelectionActions(index, entity).map((action) => action.label)).toEqual([
      'Subpackages (1)',
      'Contained (2)',
      'Modules',
      'Classes (2)',
      'Remove',
      'Pin',
    ]);
    expect(buildEntitySelectionActions(index, entity).map((action) => action.disabled)).toEqual([
      false,
      false,
      true,
      false,
      undefined,
      undefined,
    ]);
  });

  test('builds function actions around calls, callers, and same-module peers', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const entity = index.entitiesById.get('entity:function.render')!;

    expect(buildEntitySelectionActions(index, entity).map((action) => action.label)).toEqual([
      'Calls (1)',
      'Called by (2)',
      'Same module (1)',
      'Remove',
      'Pin',
    ]);
  });


  test('renders canvas nodes with only the display label and without subtitle/path text', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [{ id: 'entity:module', kind: 'entity', x: 56, y: 64, pinned: false }],
      focusedElement: { kind: 'entity', id: 'entity:module' },
      selectedEntityIds: ['entity:module'],
    };

    const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Layout',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('BrowserViewModule');
    expect(markup).not.toContain('src/BrowserView.tsx');
  });

  test('renders interactive canvas toolbar controls for arrange and viewport affordances', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [
        { id: 'entity:module', kind: 'entity', x: 56, y: 64, pinned: true },
        { id: 'entity:function.render', kind: 'entity', x: 320, y: 64 },
      ],
      selectedEntityIds: ['entity:module'],
      focusedElement: { kind: 'entity', id: 'entity:module' },
      canvasViewport: { zoom: 1.25, offsetX: 32, offsetY: 48 },
    };

    const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Analysis',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('Arrange all');
    expect(markup).toContain('Arrange around focus');
    expect(markup).toContain('Fit view');
    expect(markup).toContain('Zoom');
    expect(markup).toContain('125%');
    expect(markup).toContain('1 pinned');
  });


  test('renders routed SVG paths, arrowheads, and edge labels for visible relationships', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [
        { id: 'entity:function.render', kind: 'entity', x: 56, y: 64 },
        { id: 'entity:service', kind: 'entity', x: 320, y: 160 },
      ],
      focusedElement: { kind: 'relationship', id: 'rel:function:calls' },
    };

    const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Analysis',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('marker-end="url(#browser-canvas-arrow)"');
    expect(markup).toContain('browser-canvas__edge browser-canvas__edge--focused');
    expect(markup).toContain('browser-canvas__edge-hitbox');
    expect(markup).toContain('calls');
    expect(markup).toContain('<path d="M ');
  });

  test('falls back to default endpoint path rendering when route geometry is invalid', () => {
    const fallback = resolveRenderedEdgeGeometry({
      relationshipId: 'rel:fallback',
      fromEntityId: 'entity:function.render',
      toEntityId: 'entity:service',
      label: 'calls',
      focused: false,
      route: {
        kind: 'polyline',
        points: [],
        path: '',
        labelPosition: { x: Number.NaN, y: Number.NaN },
      },
      routingInput: {
        relationshipId: 'rel:fallback',
        fromNodeId: 'entity:function.render',
        toNodeId: 'entity:service',
        sourceRect: { nodeId: 'entity:function.render', kind: 'entity', x: 56, y: 64, width: 160, height: 88 },
        targetRect: { nodeId: 'entity:service', kind: 'entity', x: 320, y: 160, width: 160, height: 88 },
        defaultStart: { x: 216, y: 108 },
        defaultEnd: { x: 320, y: 204 },
        preferredStartSide: 'right',
        preferredEndSide: 'left',
        selfLoop: false,
        obstacleNodeIds: [],
        obstacles: [],
      },
      laneIndex: 0,
      laneOffset: 0,
    });

    expect(fallback.path).toBe('M 216 108 L 320 204');
    expect(fallback.hitboxPath).toBe('M 216 108 L 320 204');
    expect(fallback.labelPosition).toEqual({ x: 216, y: 108 });
  });


  test('renders compact UML class nodes with attribute and operation compartments', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        entities: [
          { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
          { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
          { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
        ],
        relationships: [
          { externalId: 'rel:contains:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: 'contains', sourceRefs: [], metadata: {} },
          { externalId: 'rel:contains:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: 'contains', sourceRefs: [], metadata: {} },
        ],
        viewpoints: [
          { id: 'persistence-model', title: 'Persistence model', description: 'Show entities and repositories.', availability: 'available', confidence: 0.93, seedEntityIds: ['entity:order'], seedRoleIds: ['persistent-structure'], expandViaSemantics: ['reads-persistence'], preferredDependencyViews: ['structural-dependencies'], evidenceSources: ['java-jpa'] },
        ],
      },
    });
    state = setSelectedViewpoint(state, 'persistence-model');
    state = {
      ...state,
      canvasNodes: [{ id: 'entity:order', kind: 'entity', x: 56, y: 64, pinned: false }],
      focusedElement: { kind: 'entity', id: 'entity:order' },
      selectedEntityIds: ['entity:order'],
    };

    const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Viewpoint',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('class');
    expect(markup).toContain('Order');
    expect(markup).toContain('attributes');
    expect(markup).toContain('operations');
    expect(markup).toContain('id');
    expect(markup).toContain('save');
    expect(markup).toContain('field');
    expect(markup).toContain('function');
  });


  test('demotes scope-node canvas actions behind an advanced affordance', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = selectBrowserScope(state, 'scope:file');
    state = focusBrowserElement(state, { kind: 'scope', id: 'scope:file' });

    const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Layout',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('Advanced scope node');
    expect(markup).toContain('Show selected scope as container');
    expect(markup).not.toContain('>Add scope node<');
    expect(markup).not.toContain('>Pin scope<');
  });


  test('renders a routing revision marker that changes with graph geometry', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = {
      ...state,
      canvasNodes: [
        { id: 'entity:function.render', kind: 'entity', x: 56, y: 64, pinned: false },
        { id: 'entity:service', kind: 'entity', x: 320, y: 64, pinned: false },
      ],
      canvasEdges: [
        { relationshipId: 'rel:function:calls', fromEntityId: 'entity:function.render', toEntityId: 'entity:service' },
      ],
    };

    const initialMarkup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state,
      activeModeLabel: 'Layout',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    const movedState = {
      ...state,
      canvasNodes: state.canvasNodes.map((node) =>
        node.id === 'entity:service' ? { ...node, x: node.x + 160, y: node.y + 80 } : node,
      ),
    };

    const movedMarkup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
      state: movedState,
      activeModeLabel: 'Layout',
      onShowScopeContainer: () => {},
      onAddScopeAnalysis: () => {},
      onAddContainedEntities: () => {},
      onAddPeerEntities: () => {},
      onFocusScope: () => {},
      onFocusEntity: () => {},
      onSelectEntity: () => {},
      onFocusRelationship: () => {},
      onExpandEntityDependencies: () => {},
      onExpandInboundDependencies: () => {},
      onExpandOutboundDependencies: () => {},
      onRemoveEntity: () => {},
      onRemoveSelection: () => {},
      onIsolateSelection: () => {},
      onTogglePinNode: () => {},
      onSetClassPresentationMode: () => {},
      onToggleClassPresentationMembers: () => {},
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onReconcileCanvasNodePositions: () => {},
      onSetCanvasViewport: () => {},
    }));

    const initialRevision = initialMarkup.match(/data-routing-revision="([^"]+)"/)?.[1];
    const movedRevision = movedMarkup.match(/data-routing-revision="([^"]+)"/)?.[1];

    expect(initialRevision).toBeTruthy();
    expect(movedRevision).toBeTruthy();
    expect(movedRevision).not.toBe(initialRevision);
  });


});


test('renders class presentation controls for selected class entities in the toolbar', () => {
  let state = openSnapshotSession(createEmptyBrowserSessionState(), {
    workspaceId: 'ws-1',
    repositoryId: 'repo-1',
    payload: createPayload(),
  });
  state = {
    ...state,
    index: {
      ...state.index!,
      entitiesById: new Map(state.index!.entitiesById),
    },
  };
  const classEntity = state.index!.entitiesById.get('entity:module');
  if (classEntity) {
    state.index!.entitiesById.set('entity:module', { ...classEntity, kind: 'CLASS' });
  }
  state = {
    ...state,
    canvasNodes: [{ id: 'entity:module', kind: 'entity', x: 56, y: 64, classPresentation: { mode: 'compartments', showFields: true, showFunctions: true } }],
    focusedElement: { kind: 'entity', id: 'entity:module' },
    selectedEntityIds: ['entity:module'],
  };

  const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
    state,
    activeModeLabel: 'Analysis',
    onShowScopeContainer: () => {},
    onAddScopeAnalysis: () => {},
    onAddContainedEntities: () => {},
    onAddPeerEntities: () => {},
    onFocusScope: () => {},
    onFocusEntity: () => {},
    onSelectEntity: () => {},
    onFocusRelationship: () => {},
    onExpandEntityDependencies: () => {},
    onExpandInboundDependencies: () => {},
    onExpandOutboundDependencies: () => {},
    onRemoveEntity: () => {},
    onRemoveSelection: () => {},
    onSelectAllEntities: () => {},
    onIsolateSelection: () => {},
    onTogglePinNode: () => {},
    onSetClassPresentationMode: () => {},
    onToggleClassPresentationMembers: () => {},
    onArrangeAllCanvasNodes: () => {},
    onArrangeCanvasAroundFocus: () => {},
    onClearCanvas: () => {},
    onFitView: () => {},
    onMoveCanvasNode: () => {},
    onReconcileCanvasNodePositions: () => {},
    onSetCanvasViewport: () => {},
  }));

  expect(markup).toContain('Class presentation');
  expect(markup).toContain('Select all');
  expect(markup).not.toContain('>Compartments<');
  expect(markup).toContain('>Simple<');
  expect(markup).not.toContain('Expanded');
  expect(markup).toContain('Hide fields');
  expect(markup).toContain('Hide functions');
});


test('hides field and function toggles for a single selected class in simple mode', () => {
  let state = openSnapshotSession(createEmptyBrowserSessionState(), {
    workspaceId: 'ws-1',
    repositoryId: 'repo-1',
    payload: createPayload(),
  });
  state = {
    ...state,
    index: {
      ...state.index!,
      entitiesById: new Map(state.index!.entitiesById),
    },
  };
  const classEntity = state.index!.entitiesById.get('entity:module');
  if (classEntity) {
    state.index!.entitiesById.set('entity:module', { ...classEntity, kind: 'CLASS' });
  }
  state = {
    ...state,
    canvasNodes: [{ id: 'entity:module', kind: 'entity', x: 56, y: 64, classPresentation: { mode: 'simple', showFields: true, showFunctions: true } }],
    focusedElement: { kind: 'entity', id: 'entity:module' },
    selectedEntityIds: ['entity:module'],
  };

  const markup = renderToStaticMarkup(createElement(BrowserGraphWorkspace, {
    state,
    activeModeLabel: 'Analysis',
    onShowScopeContainer: () => {},
    onAddScopeAnalysis: () => {},
    onAddContainedEntities: () => {},
    onAddPeerEntities: () => {},
    onFocusScope: () => {},
    onFocusEntity: () => {},
    onSelectEntity: () => {},
    onFocusRelationship: () => {},
    onExpandEntityDependencies: () => {},
    onExpandInboundDependencies: () => {},
    onExpandOutboundDependencies: () => {},
    onRemoveEntity: () => {},
    onRemoveSelection: () => {},
    onSelectAllEntities: () => {},
    onIsolateSelection: () => {},
    onTogglePinNode: () => {},
    onSetClassPresentationMode: () => {},
    onToggleClassPresentationMembers: () => {},
    onArrangeAllCanvasNodes: () => {},
    onArrangeCanvasAroundFocus: () => {},
    onClearCanvas: () => {},
    onFitView: () => {},
    onMoveCanvasNode: () => {},
    onReconcileCanvasNodePositions: () => {},
    onSetCanvasViewport: () => {},
  }));

  expect(markup).toContain('Compartments');
  expect(markup).not.toContain('Hide fields');
  expect(markup).not.toContain('Show fields');
  expect(markup).not.toContain('Hide functions');
  expect(markup).not.toContain('Show functions');
});


test('renders multiplicity labels at both ends of relationship edges when present', () => {
  const onActivateRelationship = jest.fn();

  const markup = renderToStaticMarkup(createElement(
    'svg',
    null,
    createElement(BrowserGraphWorkspaceEdgeLayer, {
      edges: [{
        relationshipId: 'rel:test',
        fromEntityId: 'entity:a',
        toEntityId: 'entity:b',
        label: '',
        fromLabel: '1',
        toLabel: '0..*',
        semanticStyle: undefined,
        focused: false,
        laneIndex: 0,
        laneOffset: 0,
        routingInput: {
          relationshipId: 'rel:test',
          fromNodeId: 'entity:a',
          toNodeId: 'entity:b',
          sourceRect: { nodeId: 'entity:a', kind: 'entity', x: 0, y: 0, width: 40, height: 40 },
          targetRect: { nodeId: 'entity:b', kind: 'entity', x: 100, y: 0, width: 40, height: 40 },
          defaultStart: { x: 20, y: 20 },
          defaultEnd: { x: 120, y: 20 },
          preferredStartSide: 'right',
          preferredEndSide: 'left',
          selfLoop: false,
          obstacleNodeIds: [],
          obstacles: [],
        },
        route: {
          kind: 'straight',
          points: [{ x: 20, y: 20 }, { x: 120, y: 20 }],
          path: 'M 20 20 L 120 20',
          labelPosition: { x: 70, y: 20 },
        },
      }],
      onActivateRelationship,
    }),
  ));

  expect(markup).toContain('>1<');
  expect(markup).toContain('>0..*<');
});


test('renders containment relationship styling and label in edge layer', () => {
  const onActivateRelationship = jest.fn();

  const markup = renderToStaticMarkup(createElement(
    'svg',
    null,
    createElement(BrowserGraphWorkspaceEdgeLayer, {
      edges: [{
        relationshipId: 'rel:containment',
        fromEntityId: 'entity:parent',
        toEntityId: 'entity:child',
        label: 'containment',
        fromLabel: '1',
        toLabel: '0..*',
        semanticStyle: 'containment',
        focused: false,
        laneIndex: 0,
        laneOffset: 0,
        routingInput: {
          relationshipId: 'rel:containment',
          fromNodeId: 'entity:parent',
          toNodeId: 'entity:child',
          sourceRect: { nodeId: 'entity:parent', kind: 'entity', x: 0, y: 20, width: 40, height: 40 },
          targetRect: { nodeId: 'entity:child', kind: 'entity', x: 120, y: 20, width: 40, height: 40 },
          defaultStart: { x: 20, y: 40 },
          defaultEnd: { x: 140, y: 40 },
          preferredStartSide: 'right',
          preferredEndSide: 'left',
          selfLoop: false,
          obstacleNodeIds: [],
          obstacles: [],
        },
        route: {
          kind: 'straight',
          points: [{ x: 20, y: 40 }, { x: 140, y: 40 }],
          path: 'M 20 40 L 140 40',
          labelPosition: { x: 80, y: 40 },
        },
      }],
      onActivateRelationship,
    }),
  ));

  expect(markup).toContain('>containment<');
  expect(markup).toContain('browser-canvas__edge--containment');
});


test('shows relationship legend hints when multiplicity and containment semantics are present', () => {
  const onActivateRelationship = jest.fn();

  const markup = renderToStaticMarkup(createElement(
    'svg',
    null,
    createElement(BrowserGraphWorkspaceEdgeLayer, {
      edges: [{
        relationshipId: 'rel:containment',
        fromEntityId: 'entity:parent',
        toEntityId: 'entity:child',
        label: 'containment',
        fromLabel: '1',
        toLabel: '0..*',
        semanticStyle: 'containment',
        focused: false,
        laneIndex: 0,
        laneOffset: 0,
        routingInput: {
          relationshipId: 'rel:containment',
          fromNodeId: 'entity:parent',
          toNodeId: 'entity:child',
          sourceRect: { nodeId: 'entity:parent', kind: 'entity', x: 0, y: 20, width: 40, height: 40 },
          targetRect: { nodeId: 'entity:child', kind: 'entity', x: 120, y: 20, width: 40, height: 40 },
          defaultStart: { x: 20, y: 40 },
          defaultEnd: { x: 140, y: 40 },
          preferredStartSide: 'right',
          preferredEndSide: 'left',
          selfLoop: false,
          obstacleNodeIds: [],
          obstacles: [],
        },
        route: {
          kind: 'straight',
          points: [{ x: 20, y: 40 }, { x: 140, y: 40 }],
          path: 'M 20 40 L 140 40',
          labelPosition: { x: 80, y: 40 },
        },
      }],
      onActivateRelationship: onActivateRelationship,
    }),
  ));

  expect(markup).toContain('<title>');
  expect(markup).toContain('containment');
  expect(markup).toContain('>1<');
  expect(markup).toContain('>0..*<');
});
