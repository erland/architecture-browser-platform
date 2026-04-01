import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { createSavedCanvasDocumentFromBrowserSession, restoreSavedCanvasToBrowserSession } from '../saved-canvas/browserState';
import { rebindSavedCanvasToTargetSnapshot } from '../saved-canvas/rebinding';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  createEmptyBrowserSessionState,
  openSnapshotSession,
} from '../browserSessionStore';

const originSnapshot: SnapshotSummary = {
  id: 'snap-a',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-a',
  snapshotKey: 'platform-main-a',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-24T00:00:00Z',
  scopeCount: 1,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

const targetSnapshot: SnapshotSummary = {
  ...originSnapshot,
  id: 'snap-b',
  runId: 'run-b',
  snapshotKey: 'platform-main-b',
  importedAt: '2026-03-25T00:00:00Z',
  sourceRevision: 'def456',
};

function createOriginPayload(): FullSnapshotPayload {
  return {
    snapshot: originSnapshot,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      {
        externalId: 'entity:browser',
        kind: 'COMPONENT',
        origin: 'react',
        name: 'BrowserView',
        displayName: 'BrowserView',
        scopeId: 'scope:web',
        sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: 'entity:search',
        kind: 'COMPONENT',
        origin: 'react',
        name: 'SearchTab',
        displayName: 'SearchTab',
        scopeId: 'scope:web',
        sourceRefs: [{ path: 'apps/web/src/components/SearchTab.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }],
        metadata: {},
      },
    ],
    relationships: [
      { externalId: 'rel:browser-search', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:search', label: 'uses', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

function createTargetPayload(removeSearch = false): FullSnapshotPayload {
  return {
    ...createOriginPayload(),
    snapshot: targetSnapshot,
    entities: removeSearch
      ? [
          { externalId: 'entity:browser:v2', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web:v2', sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }], metadata: {} },
        ]
      : [
          { externalId: 'entity:browser:v2', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web:v2', sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }], metadata: {} },
          { externalId: 'entity:search:v2', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web:v2', sourceRefs: [{ path: 'apps/web/src/components/SearchTab.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }], metadata: {} },
        ],
    scopes: [
      { externalId: 'scope:web:v2', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    relationships: removeSearch
      ? []
      : [
          { externalId: 'rel:browser-search:v2', kind: 'USES', fromEntityId: 'entity:browser:v2', toEntityId: 'entity:search:v2', label: 'uses', sourceRefs: [], metadata: {} },
        ],
  };
}

function createMovedTargetPayload(): FullSnapshotPayload {
  return {
    ...createOriginPayload(),
    snapshot: targetSnapshot,
    scopes: [
      { externalId: 'scope:ui', kind: 'MODULE', name: 'ui', displayName: 'UI', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      {
        externalId: 'entity:browser:moved',
        kind: 'COMPONENT',
        origin: 'react',
        name: 'BrowserView',
        displayName: 'BrowserView',
        scopeId: 'scope:ui',
        sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: 'entity:search:moved',
        kind: 'COMPONENT',
        origin: 'react',
        name: 'SearchTab',
        displayName: 'SearchTab',
        scopeId: 'scope:ui',
        sourceRefs: [{ path: 'apps/web/src/components/SearchTab.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }],
        metadata: {},
      },
    ],
    relationships: [
      { externalId: 'rel:browser-search:moved', kind: 'USES', fromEntityId: 'entity:browser:moved', toEntityId: 'entity:search:moved', label: 'uses', sourceRefs: [], metadata: {} },
    ],
  };
}

describe('savedCanvasRebinding', () => {
  test('rebinds a saved canvas to a selected target snapshot by exact stable key matches', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createOriginPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-1',
      name: 'UI flow',
    });

    const rebound = rebindSavedCanvasToTargetSnapshot(document, targetSnapshot, createTargetPayload(), '2026-03-25T12:00:00Z');
    const restored = restoreSavedCanvasToBrowserSession({
      document: rebound.document,
      payload: createTargetPayload(),
      preparedAt: '2026-03-25T12:00:00Z',
    });

    expect(rebound.document.bindings.currentTargetSnapshot?.snapshotId).toBe('snap-b');
    expect(rebound.document.bindings.rebinding?.rebindingState).toBe('EXACT');
    expect(rebound.exactMatchCount).toBe(3);
    expect(rebound.remappedCount).toBe(0);
    expect(rebound.unresolvedCount).toBe(0);
    expect(restored.state.activeSnapshot?.snapshotId).toBe('snap-b');
    expect(restored.state.canvasNodes.map((node) => node.id)).toEqual(expect.arrayContaining(['entity:browser:v2', 'entity:search:v2']));
  });

  test('uses conservative fallback remapping when exact rebinding fails after modest code movement', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createOriginPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-moved',
      name: 'Moved flow',
    });

    const rebound = rebindSavedCanvasToTargetSnapshot(document, targetSnapshot, createMovedTargetPayload(), '2026-03-25T12:02:00Z');
    const restored = restoreSavedCanvasToBrowserSession({
      document: rebound.document,
      payload: createMovedTargetPayload(),
      preparedAt: '2026-03-25T12:02:00Z',
    });

    expect(rebound.document.bindings.rebinding?.rebindingState).toBe('PARTIAL');
    expect(rebound.exactMatchCount).toBe(0);
    expect(rebound.remappedCount).toBe(3);
    expect(rebound.unresolvedCount).toBe(0);
    expect(restored.state.canvasNodes.map((node) => node.id)).toEqual(expect.arrayContaining(['entity:browser:moved', 'entity:search:moved']));
  });

  test('reports unresolved items when exact rebinding cannot match everything in the selected target snapshot', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createOriginPayload(),
    });
    state = addEntityToCanvas(state, 'entity:browser');
    state = addDependenciesToCanvas(state, 'entity:browser');

    const document = createSavedCanvasDocumentFromBrowserSession({
      state,
      canvasId: 'canvas-2',
      name: 'Partial flow',
    });

    const rebound = rebindSavedCanvasToTargetSnapshot(document, targetSnapshot, createTargetPayload(true), '2026-03-25T12:05:00Z');

    expect(rebound.document.bindings.rebinding?.rebindingState).toBe('PARTIAL');
    expect(rebound.exactMatchCount).toBe(1);
    expect(rebound.remappedCount).toBe(0);
    expect(rebound.unresolvedCount).toBe(2);
    expect(rebound.unresolvedNodeIds).toContain('entity:search');
    expect(rebound.unresolvedEdgeIds).toContain('rel:browser-search');
  });
});
