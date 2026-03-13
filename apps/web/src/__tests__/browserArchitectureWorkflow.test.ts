import type { BrowserTopSearchResultAction } from '../components/BrowserTopSearch';
import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import {
  addEntityToCanvas,
  createEmptyBrowserSessionState,
  focusBrowserElement,
  openFactsPanel,
  openSnapshotSession,
  selectBrowserScope,
  setBrowserSearch,
  type BrowserSessionState,
} from '../browserSessionStore';
import { buildBrowserFactsPanelModel } from '../components/BrowserFactsPanel';
import { toBrowserTopSearchAction } from '../components/BrowserTopSearch';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-workflow-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-workflow',
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
  relationshipCount: 1,
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
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:facts', kind: 'COMPONENT', origin: 'react', name: 'BrowserFactsPanel', displayName: 'BrowserFactsPanel', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
    ],
    diagnostics: [
      { externalId: 'diag:tree', severity: 'WARN', phase: 'MODEL', code: 'TREE_WARN', message: 'Tree warning', fatal: false, filePath: 'src/components/BrowserNavigationTree.tsx', scopeId: 'scope:web', entityId: 'entity:tree', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

function applyTopSearchAction(state: BrowserSessionState, action: BrowserTopSearchResultAction): BrowserSessionState {
  let nextState = state;
  if (action.scopeId) {
    nextState = selectBrowserScope(nextState, action.scopeId);
  }
  if (action.type === 'select-scope') {
    nextState = focusBrowserElement(nextState, { kind: 'scope', id: action.id });
    return openFactsPanel(nextState, 'scope', 'right');
  }
  if (action.type === 'open-entity') {
    nextState = addEntityToCanvas(nextState, action.id);
    nextState = focusBrowserElement(nextState, { kind: 'entity', id: action.id });
    return openFactsPanel(nextState, 'entity', 'right');
  }
  if (action.type === 'open-relationship') {
    nextState = focusBrowserElement(nextState, { kind: 'relationship', id: action.id });
    return openFactsPanel(nextState, 'relationship', 'right');
  }
  return openFactsPanel(focusBrowserElement(nextState, null), 'hidden', 'right');
}

describe('browser architecture workflow', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('search hits can drive the local tree/canvas/facts workflow without server explorer endpoints', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = selectBrowserScope(state, 'scope:web');
    state = setBrowserSearch(state, 'tree', 'scope:web');
    const result = state.searchResults.find((candidate) => candidate.id === 'entity:tree');
    expect(result).toBeDefined();

    state = applyTopSearchAction(state, toBrowserTopSearchAction(result!));
    const facts = buildBrowserFactsPanelModel(state);

    expect(state.selectedScopeId).toBe('scope:web');
    expect(state.canvasNodes.map((node) => node.id)).toContain('entity:tree');
    expect(state.focusedElement).toEqual({ kind: 'entity', id: 'entity:tree' });
    expect(state.factsPanelMode).toBe('entity');
    expect(facts?.mode).toBe('entity');
    expect(facts?.title).toBe('BrowserNavigationTree');
    expect(facts?.diagnostics).toHaveLength(1);
  });
});
