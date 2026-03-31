import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { getOrBuildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  addScopeToCanvas,
  createEmptyBrowserSessionState,
  openSnapshotSession,
  setCanvasViewport,
  setSelectedViewpoint,
  arrangeAllCanvasNodes,
} from '../browserSessionStore';
import {
  createSavedCanvasDocumentFromBrowserSession,
  restoreSavedCanvasToBrowserSession,
} from '../saved-canvas/browser-state/sessionMapping';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-save-1',
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
  importedAt: '2026-03-24T00:00:00Z',
  scopeCount: 2,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayloadWithChangedLocalIds(): FullSnapshotPayload {
  return {
    ...createPayload(),
    scopes: [
      { externalId: 'scope:repo:v2', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:web:v2', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo:v2', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser:v2', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web:v2', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search:v2', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web:v2', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:browser-search:v2', kind: 'USES', fromEntityId: 'entity:browser:v2', toEntityId: 'entity:search:v2', label: 'uses', sourceRefs: [], metadata: {} },
    ],
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
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:browser-search', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:search', label: 'uses', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [
      {
        id: 'ui-navigation',
        title: 'UI navigation',
        description: 'Shows UI entities.',
        availability: 'available',
        confidence: 0.9,
        seedEntityIds: ['entity:browser'],
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

describe('savedCanvasSessionMapping', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('maps live Browser session state into a saved canvas document', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = setSelectedViewpoint(state, 'ui-navigation');
    state = setCanvasViewport(state, { offsetX: 180, offsetY: 260, zoom: 1.5 });

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-1',
      name: 'UI flow',
    });

    expect(document.bindings.originSnapshot.snapshotId).toBe('snap-save-1');
    expect(document.presentation.viewport).toEqual({ x: 180, y: 260, zoom: 1.5 });
    expect(document.presentation.activeViewpointId).toBe('ui-navigation');
    expect(document.presentation.layoutMode).toBe('grid');
    expect(document.content.nodes.map((node) => node.reference.targetType)).toEqual(expect.arrayContaining(['SCOPE', 'ENTITY']));
    expect(document.content.edges).toHaveLength(1);
    expect(document.content.edges[0].reference.targetType).toBe('RELATIONSHIP');
    expect(document.content.nodes.find((node) => node.reference.targetType === 'ENTITY')?.reference.stableKey).not.toBe('entity:browser');
    expect(document.content.edges[0].reference.stableKey).not.toBe('rel:browser-search');
    expect(document.content.edges[0].reference.originalSnapshotLocalId).toBe('rel:browser-search');
  });


  test('preserves structure layout mode when saving an arranged Browser canvas', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = arrangeAllCanvasNodes(state);

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-structure-1',
      name: 'UI structure',
    });

    expect(state.canvasLayoutMode).toBe('structure');
    expect(document.presentation.layoutMode).toBe('structure');
  });

  test('restores a saved canvas document into Browser session state', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');
    state = setSelectedViewpoint(state, 'ui-navigation');
    state = setCanvasViewport(state, { offsetX: 32, offsetY: 48, zoom: 1.2 });

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-restore-1',
      name: 'Restorable canvas',
    });

    const restored = restoreSavedCanvasToBrowserSession({
      document,
      payload: createPayload(),
      preparedAt: '2026-03-24T12:30:00Z',
    });

    expect(restored.unresolvedNodeIds).toEqual([]);
    expect(restored.unresolvedEdgeIds).toEqual([]);
    expect(restored.state.activeSnapshot?.snapshotId).toBe('snap-save-1');
    expect(restored.state.canvasNodes.map((node) => node.id)).toEqual(expect.arrayContaining(['entity:browser', 'entity:search']));
    expect(restored.state.canvasEdges).toEqual([
      {
        relationshipId: 'rel:browser-search',
        fromEntityId: 'entity:browser',
        toEntityId: 'entity:search',
      },
    ]);
    expect(restored.state.canvasViewport).toEqual({ zoom: 1.2, offsetX: 32, offsetY: 48 });
    expect(restored.state.viewpointSelection.viewpointId).toBe('ui-navigation');
  });

  test('restores against changed snapshot-local ids by using stable references', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addScopeToCanvas(state, 'scope:web');
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-rebind-1',
      name: 'Stable remap canvas',
    });

    const restored = restoreSavedCanvasToBrowserSession({
      document,
      payload: createPayloadWithChangedLocalIds(),
    });

    expect(restored.unresolvedNodeIds).toEqual([]);
    expect(restored.unresolvedEdgeIds).toEqual([]);
    expect(restored.state.canvasNodes.map((node) => node.id)).toEqual(expect.arrayContaining(['scope:web:v2', 'entity:browser:v2', 'entity:search:v2']));
    expect(restored.state.canvasEdges).toEqual([
      {
        relationshipId: 'rel:browser-search:v2',
        fromEntityId: 'entity:browser:v2',
        toEntityId: 'entity:search:v2',
      },
    ]);
  });

  test('reports unresolved items during restore when the target snapshot no longer contains them', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-missing-1',
      name: 'Missing items',
    });

    const payloadWithoutBrowser: FullSnapshotPayload = {
      ...createPayload(),
      entities: createPayload().entities.filter((entity) => entity.externalId !== 'entity:browser'),
      relationships: [],
    };
    getOrBuildBrowserSnapshotIndex(payloadWithoutBrowser);

    const restored = restoreSavedCanvasToBrowserSession({
      document,
      payload: payloadWithoutBrowser,
    });

    expect(restored.state.canvasNodes).toEqual([]);
    expect(restored.unresolvedNodeIds).toEqual(['entity:entity:browser']);
  });
});
