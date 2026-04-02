import type { BrowserTopSearchResultAction } from '../../components/browser-search/BrowserTopSearch';
import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { clearBrowserSnapshotIndex, getPrimaryEntitiesForScope } from '../../browser-snapshot';
import {
  addEntityToCanvas,
  createEmptyBrowserSessionState,
  focusBrowserElement,
  openFactsPanel,
  openSnapshotSession,
  selectBrowserScope,
  setBrowserSearch,
  type BrowserSessionState,
} from '../../browser-session';
import { buildBrowserFactsPanelModel } from '../../components/browser-facts-panel/BrowserFactsPanel';
import { toBrowserTopSearchAction, toBrowserTopSearchAddAction } from '../../components/browser-search/BrowserTopSearch';

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
  scopeCount: 3,
  entityCount: 4,
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
      { externalId: 'scope:file:browser-view', kind: 'FILE', name: 'BrowserView.tsx', displayName: 'BrowserView.tsx', parentScopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser-module', kind: 'MODULE', origin: 'react', name: 'BrowserViewModule', displayName: 'BrowserViewModule', scopeId: 'scope:file:browser-view', sourceRefs: [], metadata: {} },
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:facts', kind: 'COMPONENT', origin: 'react', name: 'BrowserFactsPanel', displayName: 'BrowserFactsPanel', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [
      { externalId: 'diag:tree', severity: 'WARN', phase: 'MODEL', code: 'TREE_WARN', message: 'Tree warning', fatal: false, filePath: 'src/components/BrowserNavigationTree.tsx', scopeId: 'scope:web', entityId: 'entity:tree', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

function applyTopSearchAction(state: BrowserSessionState, action: BrowserTopSearchResultAction): BrowserSessionState {
  let nextState = state;
  const targetScopeId = action.kind === 'scope' ? action.id : action.scopeId;
  if (targetScopeId) {
    nextState = selectBrowserScope(nextState, targetScopeId);
  }
  if (action.type === 'select-scope') {
    nextState = focusBrowserElement(nextState, { kind: 'scope', id: action.id });
    return openFactsPanel(nextState, 'scope', 'right');
  }
  if (action.type === 'add-scope-primary-entities') {
    const index = nextState.index;
    const primaryEntityId = index ? getPrimaryEntitiesForScope(index, action.id)[0]?.externalId : null;
    if (!primaryEntityId) {
      nextState = focusBrowserElement(nextState, { kind: 'scope', id: action.id });
      return openFactsPanel(nextState, 'scope', 'right');
    }
    nextState = addEntityToCanvas(nextState, primaryEntityId);
    nextState = focusBrowserElement(nextState, { kind: 'entity', id: primaryEntityId });
    return openFactsPanel(nextState, 'entity', 'right');
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

  test('scope search hits separate navigation from analysis seeding', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = setBrowserSearch(state, 'browserview.tsx', null);
    const scopeResult = state.searchResults.find((candidate) => candidate.kind === 'scope' && candidate.id === 'scope:file:browser-view');
    expect(scopeResult).toBeDefined();

    const navigated = applyTopSearchAction(state, toBrowserTopSearchAction(scopeResult!));
    expect(navigated.selectedScopeId).toBe('scope:file:browser-view');
    expect(navigated.canvasNodes).toHaveLength(0);
    expect(navigated.focusedElement).toEqual({ kind: 'scope', id: 'scope:file:browser-view' });
    expect(navigated.factsPanelMode).toBe('scope');

    const seeded = applyTopSearchAction(state, toBrowserTopSearchAddAction(scopeResult!));
    expect(seeded.selectedScopeId).toBe('scope:file:browser-view');
    expect(seeded.canvasNodes.map((node) => node.id)).toContain('entity:browser-module');
    expect(seeded.focusedElement).toEqual({ kind: 'entity', id: 'entity:browser-module' });
    expect(seeded.factsPanelMode).toBe('entity');
  });
});
