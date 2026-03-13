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
  scopeCount: 6,
  entityCount: 7,
  relationshipCount: 2,
  diagnosticCount: 2,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [{ path: 'repo.json', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [{ path: 'src', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'scope:file', kind: 'FILE', name: 'BrowserView.tsx', displayName: 'src/BrowserView.tsx', parentScopeId: 'scope:src', sourceRefs: [{ path: 'src/BrowserView.tsx', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'info.example.browser', displayName: 'info.example.browser', parentScopeId: 'scope:repo', sourceRefs: [{ path: 'src/main/java/info/example/browser', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'scope:pkg.sub', kind: 'PACKAGE', name: 'info.example.browser.sub', displayName: 'info.example.browser.sub', parentScopeId: 'scope:pkg', sourceRefs: [{ path: 'src/main/java/info/example/browser/sub', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [{ path: 'src/main.tsx', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:module', kind: 'MODULE', origin: 'react', name: 'BrowserViewModule', displayName: 'BrowserViewModule', scopeId: 'scope:file', sourceRefs: [{ path: 'src/BrowserView.tsx', startLine: 1, endLine: 1, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:function.render', kind: 'FUNCTION', origin: 'react', name: 'renderBrowser', displayName: 'renderBrowser', scopeId: 'scope:file', sourceRefs: [{ path: 'src/BrowserView.tsx', startLine: 10, endLine: 12, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:function.layout', kind: 'FUNCTION', origin: 'react', name: 'computeLayout', displayName: 'computeLayout', scopeId: 'scope:file', sourceRefs: [{ path: 'src/BrowserView.tsx', startLine: 20, endLine: 24, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:package', kind: 'PACKAGE', origin: 'java', name: 'info.example.browser', displayName: 'info.example.browser', scopeId: 'scope:pkg', sourceRefs: [{ path: 'src/main/java/info/example/browser/package-info.java', startLine: 1, endLine: 1, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:class', kind: 'CLASS', origin: 'java', name: 'BrowserController', displayName: 'BrowserController', scopeId: 'scope:pkg', sourceRefs: [{ path: 'src/main/java/info/example/browser/BrowserController.java', startLine: 1, endLine: 1, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:subpackage', kind: 'PACKAGE', origin: 'java', name: 'info.example.browser.sub', displayName: 'info.example.browser.sub', scopeId: 'scope:pkg.sub', sourceRefs: [{ path: 'src/main/java/info/example/browser/sub/package-info.java', startLine: 1, endLine: 1, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'entity:component', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [{ path: 'src/components/BrowserNavigationTree.tsx', startLine: 8, endLine: 8, snippet: null, metadata: {} }], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:module:function1', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:function.render', label: 'contains', sourceRefs: [{ path: 'src/BrowserView.tsx', startLine: 1, endLine: 24, snippet: null, metadata: {} }], metadata: {} },
      { externalId: 'rel:uses', kind: 'USES', fromEntityId: 'entity:component', toEntityId: 'entity:module', label: 'renders', sourceRefs: [{ path: 'src/components/BrowserNavigationTree.tsx', startLine: 15, endLine: 15, snippet: null, metadata: {} }], metadata: {} },
    ],
    diagnostics: [
      { externalId: 'diag:scope', severity: 'WARN', phase: 'IMPORT', code: 'SCOPE_WARN', message: 'Scope warning', fatal: false, filePath: 'src/BrowserView.tsx', scopeId: 'scope:file', entityId: null, sourceRefs: [], metadata: {} },
      { externalId: 'diag:entity', severity: 'ERROR', phase: 'IMPORT', code: 'ENTITY_ERR', message: 'Entity error', fatal: true, filePath: 'src/components/BrowserNavigationTree.tsx', scopeId: null, entityId: 'entity:component', sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('BrowserFactsPanel model', () => {
  test('builds file scope facts as a scope-to-entity bridge for module and functions', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = selectBrowserScope(state, 'scope:file');

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('scope');
    expect(model?.title).toBe('src/BrowserView.tsx');
    expect(model?.scopeBridge?.primaryEntities.map((entity) => entity.id)).toEqual(['entity:module']);
    expect(model?.scopeBridge?.directEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['FUNCTION:2', 'MODULE:1']);
    expect(model?.scopeBridge?.subtreeEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['FUNCTION:2', 'MODULE:1']);
    expect(model?.diagnostics).toHaveLength(1);
  });

  test('builds directory scope facts with file-derived primary module candidates', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = selectBrowserScope(state, 'scope:src');

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('scope');
    expect(model?.scopeBridge?.childScopes.map((scope) => scope.id)).toEqual(['scope:file']);
    expect(model?.scopeBridge?.primaryEntities.map((entity) => entity.id)).toEqual(['entity:module']);
    expect(model?.scopeBridge?.subtreeEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['FUNCTION:2', 'MODULE:1']);
  });

  test('builds package scope facts with package entity as primary and subtree expansion counts', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = selectBrowserScope(state, 'scope:pkg');

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('scope');
    expect(model?.scopeBridge?.primaryEntities.map((entity) => entity.id)).toEqual(['entity:package']);
    expect(model?.scopeBridge?.directEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['CLASS:1', 'PACKAGE:1']);
    expect(model?.scopeBridge?.subtreeEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['PACKAGE:2', 'CLASS:1']);
  });

  test('builds entity facts when an entity is focused', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = addEntityToCanvas(state, 'entity:component');
    state = focusBrowserElement(state, { kind: 'entity', id: 'entity:component' });

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('entity');
    expect(model?.entityFacts?.inboundRelationships).toHaveLength(0);
    expect(model?.entityFacts?.outboundRelationships).toHaveLength(1);
    expect(model?.diagnostics).toHaveLength(1);
  });

  test('builds relationship facts when a relationship is focused', () => {
    const payload = createPayload();
    let state = openSnapshotSession(createEmptyBrowserSessionState(), { workspaceId: 'ws-1', repositoryId: 'repo-1', payload });
    state = focusBrowserElement(state, { kind: 'relationship', id: 'rel:uses' });

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('relationship');
    expect(model?.relationship?.externalId).toBe('rel:uses');
    expect(model?.subtitle).toContain('BrowserNavigationTree');
    expect(model?.subtitle).toContain('BrowserViewModule');
  });
});
