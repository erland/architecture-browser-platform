import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  clearCanvas,
  createEmptyBrowserSessionState,
  createPersistedBrowserSessionState,
  focusBrowserElement,
  hydrateBrowserSessionState,
  openSnapshotSession,
  openFactsPanel,
  removeEntityFromCanvas,
  requestFitCanvasView,
  selectBrowserScope,
  setBrowserSearch,
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
    expect(hydrated.payload).toBeNull();
    expect(hydrated.index).toBeNull();
  });
});
