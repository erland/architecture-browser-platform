import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  addScopeToCanvas,
  createEmptyBrowserSessionState,
  isolateCanvasSelection,
  moveCanvasNode,
  openSnapshotSession,
  reconcileCanvasNodePositions,
  removeCanvasSelection,
  removeEntityFromCanvas,
  selectAllCanvasEntities,
  selectCanvasEntity,
  setSelectedViewpoint,
  toggleCanvasNodePin,
} from '../../browser-session';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { clearCanvasSelection } from '../../browser-session/canvas/mutations';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-session-mutations',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Platform',
  runId: 'run-1',
  snapshotKey: 'snap-session-mutations',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.3.0',
  indexerVersion: 'test',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-04-05T10:00:00Z',
  scopeCount: 2,
  entityCount: 3,
  relationshipCount: 2,
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
    viewpoints: [
      {
        id: 'request-handling',
        title: 'Request handling',
        description: 'Shows API entrypoints and collaborating services.',
        availability: 'available',
        confidence: 0.9,
        seedEntityIds: [],
        seedRoleIds: [],
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

describe('browser-session canvas mutations', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('removeEntityFromCanvas prunes nodes, edges, selection, focus, and applied viewpoint together', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:browser');
    state = setSelectedViewpoint(state, 'request-handling');

    const next = removeEntityFromCanvas(state, 'entity:browser');

    expect(next.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:layout', 'entity:search']);
    expect(next.canvasEdges).toEqual([]);
    expect(next.selectedEntityIds).toEqual([]);
    expect(next.focusedElement).toBeNull();
    expect(next.factsPanelMode).toBe('hidden');
    expect(next.appliedViewpoint).toBeNull();
  });

  test('isolateCanvasSelection keeps the focused scope container while pruning unrelated graph content', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:browser');
    state = {
      ...state,
      focusedElement: { kind: 'scope', id: 'scope:web' },
      factsPanelMode: 'scope',
    };

    const isolated = isolateCanvasSelection(state);

    expect(isolated.canvasNodes.map((node) => `${node.kind}:${node.id}`).sort()).toEqual([
      'entity:entity:browser',
      'scope:scope:web',
    ]);
    expect(isolated.canvasEdges).toEqual([]);
    expect(isolated.selectedEntityIds).toEqual(['entity:browser']);
    expect(isolated.focusedElement).toEqual({ kind: 'scope', id: 'scope:web' });
    expect(isolated.factsPanelMode).toBe('scope');
  });

  test('removeCanvasSelection removes selected entities and a focused scope together and repairs focus to empty', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:search', true);
    state = {
      ...state,
      focusedElement: { kind: 'scope', id: 'scope:web' },
      factsPanelMode: 'scope',
    };

    const removed = removeCanvasSelection(state);

    expect(removed.canvasNodes.map((node) => node.id)).toEqual(['entity:layout']);
    expect(removed.canvasEdges).toEqual([]);
    expect(removed.selectedEntityIds).toEqual([]);
    expect(removed.focusedElement).toEqual({ kind: 'scope', id: 'scope:web' });
    expect(removed.factsPanelMode).toBe('scope');
  });

  test('selectAllCanvasEntities and clearCanvasSelection preserve valid focus semantics across bulk selection', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:search');

    const selectedAll = selectAllCanvasEntities(state);
    expect(selectedAll.selectedEntityIds).toEqual(['entity:browser', 'entity:layout', 'entity:search']);
    expect(selectedAll.focusedElement).toEqual({ kind: 'entity', id: 'entity:search' });
    expect(selectedAll.factsPanelMode).toBe('entity');
    expect(selectedAll.appliedViewpoint).toBeNull();

    const cleared = clearCanvasSelection(selectedAll);
    expect(cleared.selectedEntityIds).toEqual([]);
    expect(cleared.focusedElement).toBeNull();
    expect(cleared.factsPanelMode).toBe('hidden');
    expect(cleared.appliedViewpoint).toBeNull();
  });

  test('reconcileCanvasNodePositions refreshes routes only for real moves and preserves manual/pinned flags', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = moveCanvasNode(state, { kind: 'entity', id: 'entity:search' }, { x: 920, y: 180 });
    state = toggleCanvasNodePin(state, { kind: 'entity', id: 'entity:layout' });

    const unchanged = reconcileCanvasNodePositions(state, [{ kind: 'entity', id: 'entity:search' }]);
    expect(unchanged).toBe(state);

    const refreshed = reconcileCanvasNodePositions(state, [
      { kind: 'entity', id: 'entity:search', x: 960 },
      { kind: 'entity', id: 'entity:layout', y: 260 },
    ]);
    expect(refreshed.routeRefreshRequestedAt).not.toBeNull();
    expect(refreshed.routeRefreshRequestedAt).not.toBe(state.routeRefreshRequestedAt);
    expect(refreshed.appliedViewpoint).toBeNull();
    expect(refreshed.canvasNodes.find((node) => node.id === 'entity:search')).toMatchObject({
      x: 960,
      y: 180,
      manuallyPlaced: true,
    });
    expect(refreshed.canvasNodes.find((node) => node.id === 'entity:layout')).toMatchObject({
      pinned: true,
      y: 260,
    });
  });
});
