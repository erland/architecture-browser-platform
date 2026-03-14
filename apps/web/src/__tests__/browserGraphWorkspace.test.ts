import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { BrowserGraphWorkspace, buildEntitySelectionActions } from '../components/BrowserGraphWorkspace';
import { createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, selectBrowserScope } from '../browserSessionStore';

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
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('BrowserViewModule');
    expect(markup).not.toContain('src/BrowserView.tsx');
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
      onArrangeAllCanvasNodes: () => {},
      onArrangeCanvasAroundFocus: () => {},
      onClearCanvas: () => {},
      onFitView: () => {},
      onMoveCanvasNode: () => {},
      onSetCanvasViewport: () => {},
    }));

    expect(markup).toContain('Advanced scope node');
    expect(markup).toContain('Show selected scope as container');
    expect(markup).not.toContain('>Add scope node<');
    expect(markup).not.toContain('>Pin scope<');
  });
});
