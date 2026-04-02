import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import {
  createEmptyBrowserSessionState,
  normalizeFocusedBrowserContext,
  openSnapshotSession,
  recomputeBrowserSearchState,
} from '../../browser-session';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-invariants-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-invariants',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 2,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: { ...snapshotSummary },
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
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser session invariants', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('normalizes invalid focused entity selections back to remaining selected entities', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const normalized = normalizeFocusedBrowserContext(opened, {
      selectedEntityIds: ['entity:browser'],
      focusedElement: { kind: 'entity', id: 'entity:missing' },
      canvasEdges: [],
    });

    expect(normalized.selectedEntityIds).toEqual(['entity:browser']);
    expect(normalized.focusedElement).toEqual({ kind: 'entity', id: 'entity:browser' });
    expect(normalized.factsPanelMode).toBe('entity');
  });

  test('recomputes search state only for valid scope ids in the active snapshot index', () => {
    const opened = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    const searchState = recomputeBrowserSearchState(opened, {
      query: 'tree',
      searchScopeId: 'scope:missing',
    });

    expect(searchState.searchScopeId).toBeNull();
    expect(searchState.searchResults.map((result) => result.id)).toContain('entity:tree');
  });
});
