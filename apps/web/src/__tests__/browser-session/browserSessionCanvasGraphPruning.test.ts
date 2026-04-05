import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  addScopeToCanvas,
  createEmptyBrowserSessionState,
  openSnapshotSession,
  selectCanvasEntity,
} from '../../browser-session';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';
import {
  pruneCanvasGraphForEntityRemoval,
  pruneCanvasGraphForIsolation,
  pruneCanvasGraphForSelectionRemoval,
} from '../../browser-session/canvas/graphPruning';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-session-pruning',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Platform',
  runId: 'run-1',
  snapshotKey: 'snap-session-pruning',
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
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser-session canvas graph pruning', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('entity removal pruning returns only surviving graph content and repaired selection/focus inputs', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = selectCanvasEntity(state, 'entity:browser');

    const pruned = pruneCanvasGraphForEntityRemoval(state, 'entity:browser');

    expect(pruned.canvasNodes.map((node) => node.id).sort()).toEqual(['entity:layout', 'entity:search']);
    expect(pruned.canvasEdges).toEqual([]);
    expect(pruned.selectedEntityIds).toEqual([]);
    expect(pruned.focusedElement).toBeNull();
  });

  test('isolation pruning preserves selected entities and the focused scope container', () => {
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

    const pruned = pruneCanvasGraphForIsolation(state);

    expect(pruned).not.toBeNull();
    expect(pruned?.canvasNodes.map((node) => `${node.kind}:${node.id}`).sort()).toEqual([
      'entity:entity:browser',
      'scope:scope:web',
    ]);
    expect(pruned?.canvasEdges).toEqual([]);
    expect(pruned?.selectedEntityIds).toEqual(['entity:browser']);
    expect(pruned?.fallbackScopeId).toBe('scope:web');
  });

  test('selection removal pruning drops selected entities and a focused scope but preserves other current focus values', () => {
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

    const pruned = pruneCanvasGraphForSelectionRemoval(state);

    expect(pruned.canvasNodes.map((node) => node.id)).toEqual(['entity:layout']);
    expect(pruned.canvasEdges).toEqual([]);
    expect(pruned.selectedEntityIds).toEqual([]);
    expect(pruned.focusedElement).toBeNull();
  });
});
