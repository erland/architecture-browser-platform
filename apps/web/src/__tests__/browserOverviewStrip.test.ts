import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserOverviewCards } from '../components/BrowserOverviewStrip';
import { createEmptyBrowserSessionState, openSnapshotSession, selectBrowserScope, setBrowserSearch } from '../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-overview-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-overview',
  status: 'READY',
  completenessStatus: 'PARTIAL',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 2,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 1,
  indexedFileCount: 8,
  totalFileCount: 10,
  degradedFileCount: 1,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'PARTIAL', indexedFileCount: 8, totalFileCount: 10, degradedFileCount: 1, omittedPaths: ['generated'], notes: ['1 degraded file'] },
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
    diagnostics: [
      { externalId: 'diag:1', severity: 'WARN', phase: 'IMPORT', code: 'WARN_1', message: 'Something degraded', fatal: false, filePath: 'src/views/BrowserView.tsx', scopeId: 'scope:web', entityId: 'entity:browser', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: ['partial indexing'],
  };
}

describe('BrowserOverviewStrip model', () => {
  test('summarizes snapshot health and analysis state compactly', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload: createPayload() });
    state = selectBrowserScope(state, 'scope:web');
    state = setBrowserSearch(state, 'browser', 'scope:web');

    const cards = buildBrowserOverviewCards(state);

    expect(cards).toHaveLength(3);
    expect(cards[0].title).toBe('PARTIAL');
    expect(cards[0].metrics[0].value).toBe('8/10 files');
    expect(cards[1].title).toBe('Web');
    expect(cards[1].detail).toContain('Platform / Web');
    expect(cards[2].detail).toContain('browser');
    expect(Number(cards[2].metrics.find((metric) => metric.label === 'Search hits')?.value ?? '0')).toBeGreaterThan(0);
  });
});
