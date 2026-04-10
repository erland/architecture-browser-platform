import type { FullSnapshotPayload, SnapshotSummary } from '../../../app-model';
import {
  createSavedCanvasDocumentFromBrowserSession,
  rebindSavedCanvasToTargetSnapshot,
  restoreSavedCanvasToBrowserSession,
} from '../../../saved-canvas';
import { addDependenciesToCanvas, addEntityToCanvas } from '../../../browser-session/canvas-api';
import { createEmptyBrowserSessionState } from '../../../browser-session/state';
import { openSnapshotSession } from '../../../browser-session/lifecycle-api';

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
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
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

function createExactTargetPayload(): FullSnapshotPayload {
  return {
    ...createOriginPayload(),
    snapshot: targetSnapshot,
    scopes: [
      { externalId: 'scope:web:v2', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: null, sourceRefs: [], metadata: {} },
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

function createMovedTargetPayload(): FullSnapshotPayload {
  return {
    ...createOriginPayload(),
    snapshot: targetSnapshot,
    scopes: [
      { externalId: 'scope:ui', kind: 'MODULE', name: 'ui', displayName: 'UI', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser:moved', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:ui', sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:search:moved', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:ui', sourceRefs: [{ path: 'apps/web/src/components/SearchTab.tsx', startLine: 1, endLine: 20, snippet: null, metadata: {} }], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:browser-search:moved', kind: 'USES', fromEntityId: 'entity:browser:moved', toEntityId: 'entity:search:moved', label: 'uses', sourceRefs: [], metadata: {} },
    ],
  };
}

function createSavedCanvasDocumentFixture() {
  let state = openSnapshotSession(createEmptyBrowserSessionState(), {
    workspaceId: 'ws-1',
    repositoryId: 'repo-1',
    payload: createOriginPayload(),
  });
  state = addEntityToCanvas(state, 'entity:browser');
  state = addDependenciesToCanvas(state, 'entity:browser');

  return createSavedCanvasDocumentFromBrowserSession({
    state,
    canvasId: 'canvas-1',
    name: 'UI flow',
  });
}

export type SavedCanvasRegressionFixture = {
  name: string;
  run(): void;
};

export const SAVED_CANVAS_REGRESSION_FIXTURES: SavedCanvasRegressionFixture[] = [
  {
    name: 'exact rebinding restores all nodes and edges against renamed snapshot-local ids',
    run() {
      const document = createSavedCanvasDocumentFixture();
      const rebound = rebindSavedCanvasToTargetSnapshot(document, targetSnapshot, createExactTargetPayload(), '2026-03-25T12:00:00Z');
      const restored = restoreSavedCanvasToBrowserSession({
        document: rebound.document,
        payload: createExactTargetPayload(),
        preparedAt: '2026-03-25T12:00:00Z',
      });

      expect(rebound.document.bindings.rebinding?.rebindingState).toBe('EXACT');
      expect(rebound.exactMatchCount).toBe(3);
      expect(rebound.unresolvedCount).toBe(0);
      expect(restored.unresolvedNodeIds).toEqual([]);
      expect(restored.state.canvasNodes.map((node) => node.id)).toEqual(
        expect.arrayContaining(['entity:browser:v2', 'entity:search:v2']),
      );
    },
  },
  {
    name: 'fallback rebinding restores uniquely identifiable moved entities and relationships',
    run() {
      const document = createSavedCanvasDocumentFixture();
      const rebound = rebindSavedCanvasToTargetSnapshot(document, targetSnapshot, createMovedTargetPayload(), '2026-03-25T12:02:00Z');
      const restored = restoreSavedCanvasToBrowserSession({
        document: rebound.document,
        payload: createMovedTargetPayload(),
        preparedAt: '2026-03-25T12:02:00Z',
      });

      expect(rebound.document.bindings.rebinding?.rebindingState).toBe('PARTIAL');
      expect(rebound.remappedCount).toBeGreaterThan(0);
      expect(rebound.unresolvedCount).toBe(0);
      expect(restored.state.activeSnapshot?.snapshotId).toBe('snap-b');
      expect(restored.unresolvedNodeIds).toEqual([]);
      expect(restored.unresolvedEdgeIds).toEqual([]);
      expect(restored.state.canvasNodes.map((node) => node.id)).toEqual(
        expect.arrayContaining(['entity:browser:moved', 'entity:search:moved']),
      );
    },
  },
];
