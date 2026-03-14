import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  addScopeToCanvas,
  addPrimaryEntitiesForScope,
  clearCanvas,
  createEmptyBrowserSessionState,
  createPersistedBrowserSessionState,
  focusBrowserElement,
  hydrateBrowserSessionState,
  isolateCanvasSelection,
  openSnapshotSession,
  openFactsPanel,
  arrangeAllCanvasNodes,
  arrangeCanvasAroundFocus,
  removeCanvasSelection,
  removeEntityFromCanvas,
  requestFitCanvasView,
  moveCanvasNode,
  setCanvasViewport,
  selectBrowserScope,
  selectCanvasEntity,
  setBrowserSearch,
  toggleCanvasNodePin,
} from '../browserSessionStore';
import { clearBrowserSnapshotIndex } from '../browserSnapshotIndex';

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
  entityCount: 3,
  relationshipCount: 2,
  diagnosticCount: 1,
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
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:layout', kind: 'COMPONENT', origin: 'react', name: 'LayoutTab', displayName: 'LayoutTab', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:search', label: 'uses', sourceRefs: [], metadata: {} },
      { externalId: 'rel:2', kind: 'USES', fromEntityId: 'entity:layout', toEntityId: 'entity:browser', label: 'calls', sourceRefs: [], metadata: {} },
    ],
    diagnostics: [
      { externalId: 'diag:1', severity: 'WARN', phase: 'MODEL', code: 'TEST', message: 'Test diagnostic', fatal: false, filePath: null, scopeId: 'scope:web', entityId: 'entity:browser', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserSessionStore', () => {
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
    expect(arrangedAll.canvasLayoutMode).toBe('grid');
    expect(afterRemoval.canvasNodes).toEqual([]);
    expect(afterRemoval.selectedEntityIds).toEqual([]);
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
