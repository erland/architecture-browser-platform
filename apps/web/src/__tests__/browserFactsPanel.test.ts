import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserFactsPanelModel } from '../components/BrowserFactsPanel';
import { addEntityToCanvas, createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, selectBrowserScope } from '../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-facts-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-facts',
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
  diagnosticCount: 2,
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
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [{ path: 'repo.json', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [{ path: 'src/main.tsx', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:browser', kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: 'scope:web', sourceRefs: [{ path: 'src/views/BrowserView.tsx', startLine: 12, endLine: 12, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:tree', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [{ path: 'src/components/BrowserNavigationTree.tsx', startLine: 8, endLine: 8, snippet: null, metadata: {} }], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:browser', toEntityId: 'entity:tree', label: 'renders', sourceRefs: [{ path: 'src/views/BrowserView.tsx', startLine: 22, endLine: 22, snippet: null, metadata: {} }], metadata: {} },
    ],
    diagnostics: [
      { externalId: 'diag:scope', severity: 'WARN', phase: 'IMPORT', code: 'SCOPE_WARN', message: 'Scope warning', fatal: false, filePath: 'src/main.tsx', scopeId: 'scope:web', entityId: null, sourceRefs: [], metadata: {} },
      { externalId: 'diag:entity', severity: 'ERROR', phase: 'IMPORT', code: 'ENTITY_ERR', message: 'Entity error', fatal: true, filePath: 'src/views/BrowserView.tsx', scopeId: null, entityId: 'entity:browser', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('BrowserFactsPanel model', () => {
  test('builds scope facts from the selected scope when nothing else is focused', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = selectBrowserScope(state, 'scope:web');

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('scope');
    expect(model?.title).toBe('Web');
    expect(model?.diagnostics).toHaveLength(1);
    expect(model?.scopeFacts?.entityIds).toEqual(['entity:tree', 'entity:browser']);
  });

  test('builds entity facts when an entity is focused', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = addEntityToCanvas(state, 'entity:browser');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:browser' });

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('entity');
    expect(model?.entityFacts?.inboundRelationships).toHaveLength(0);
    expect(model?.entityFacts?.outboundRelationships).toHaveLength(1);
    expect(model?.diagnostics).toHaveLength(1);
  });

  test('builds relationship facts when a relationship is focused', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = focusBrowserElement(state, { kind: 'relationship', id: 'rel:1' });

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('relationship');
    expect(model?.relationship?.externalId).toBe('rel:1');
    expect(model?.subtitle).toContain('BrowserView');
    expect(model?.subtitle).toContain('BrowserNavigationTree');
  });
});
