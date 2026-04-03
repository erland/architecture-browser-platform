import type { FullSnapshotPayload, SnapshotSummary } from '../../../app-model';
import {
  addDependenciesToCanvas,
  addEntityToCanvas,
  arrangeAllCanvasNodes,
  createEmptyBrowserSessionState,
  focusBrowserElement,
  openSnapshotSession,
  setSelectedViewpoint,
  type BrowserSessionState,
} from '../../../browser-session';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-browser-session-fixture',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-fixture',
  snapshotKey: 'platform-main-browser-session-fixture',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-30T00:00:00Z',
  scopeCount: 1,
  entityCount: 3,
  relationshipCount: 2,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

export function createBrowserSessionFixturePayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'SERVICE', origin: 'java', name: 'BrowserService', displayName: 'BrowserService', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:search', kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:browser-service', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:service', label: 'uses', sourceRefs: [], metadata: {} },
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

function createFixtureState(): BrowserSessionState {
  return openSnapshotSession(createEmptyBrowserSessionState(), {
    workspaceId: 'ws-1',
    repositoryId: 'repo-1',
    payload: createBrowserSessionFixturePayload(),
  });
}

export type BrowserSessionRegressionFixture = {
  name: string;
  run(): BrowserSessionState;
  verify(state: BrowserSessionState): void;
};

export const BROWSER_SESSION_REGRESSION_FIXTURES: BrowserSessionRegressionFixture[] = [
  {
    name: 'dependency expansion keeps relationship focus valid',
    run() {
      let state = createFixtureState();
      state = addEntityToCanvas(state, 'entity:browser');
      state = addDependenciesToCanvas(state, 'entity:browser');
      state = focusBrowserElement(state, { kind: 'relationship', id: 'rel:browser-service' });
      return state;
    },
    verify(state) {
      expect(state.canvasNodes.map((node) => node.id)).toEqual(
        expect.arrayContaining(['entity:browser', 'entity:service', 'entity:search']),
      );
      expect(state.canvasEdges.map((edge) => edge.relationshipId)).toEqual(
        expect.arrayContaining(['rel:browser-service', 'rel:browser-search']),
      );
      expect(state.focusedElement).toEqual({ kind: 'relationship', id: 'rel:browser-service' });
    },
  },
  {
    name: 'viewpoint selection survives arrange-all state changes',
    run() {
      let state = createFixtureState();
      state = addEntityToCanvas(state, 'entity:browser');
      state = addDependenciesToCanvas(state, 'entity:browser');
      state = setSelectedViewpoint(state, 'ui-navigation');
      state = arrangeAllCanvasNodes(state);
      return state;
    },
    verify(state) {
      expect(state.canvasLayoutMode).toBe('structure');
      expect(state.viewpointSelection.viewpointId).toBe('ui-navigation');
      expect(state.canvasNodes).toHaveLength(3);
      expect(state.canvasNodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true);
    },
  },
];
