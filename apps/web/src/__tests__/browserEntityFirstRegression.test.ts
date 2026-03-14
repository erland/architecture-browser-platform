import { buildBrowserFactsPanelModel } from '../components/BrowserFactsPanel';
import { buildEntitySelectionActions } from '../components/BrowserGraphWorkspace';
import { toBrowserTopSearchAction, toBrowserTopSearchAddAction } from '../components/BrowserTopSearch';
import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserSnapshotIndex, clearBrowserSnapshotIndex, detectDefaultBrowserTreeMode, getScopeTreeNodesForMode } from '../browserSnapshotIndex';
import { addPrimaryEntitiesForScope, createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, selectBrowserScope, setBrowserSearch } from '../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-entity-first-regression-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-entity-first-regression',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-13T00:00:00Z',
  scopeCount: 7,
  entityCount: 8,
  relationshipCount: 4,
  diagnosticCount: 1,
  indexedFileCount: 3,
  totalFileCount: 3,
  degradedFileCount: 0,
};

function createPayload(detectedTechnologies: string[] = ['java', 'react']): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies },
    completeness: { status: 'COMPLETE', indexedFileCount: 3, totalFileCount: 3, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:src', kind: 'DIRECTORY', name: 'src', displayName: 'src', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:file', kind: 'FILE', name: 'src/BrowserView.tsx', displayName: 'src/BrowserView.tsx', parentScopeId: 'scope:src', sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'info.example.browser', displayName: 'info.example.browser', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg.sub', kind: 'PACKAGE', name: 'info.example.browser.sub', displayName: 'info.example.browser.sub', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'scope:file:java', kind: 'FILE', name: 'src/main/java/info/example/browser/BrowserService.java', displayName: 'BrowserService.java', parentScopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'scope:web', kind: 'MODULE', name: 'web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:module', kind: 'MODULE', origin: 'react', name: 'BrowserViewModule', displayName: 'BrowserViewModule', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:function.render', kind: 'FUNCTION', origin: 'react', name: 'renderBrowser', displayName: 'renderBrowser', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:function.layout', kind: 'FUNCTION', origin: 'react', name: 'computeLayout', displayName: 'computeLayout', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:package', kind: 'PACKAGE', origin: 'java', name: 'info.example.browser', displayName: 'info.example.browser', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:subpackage', kind: 'PACKAGE', origin: 'java', name: 'info.example.browser.sub', displayName: 'info.example.browser.sub', scopeId: 'scope:pkg.sub', sourceRefs: [], metadata: {} },
      { externalId: 'entity:class', kind: 'CLASS', origin: 'java', name: 'BrowserController', displayName: 'BrowserController', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'SERVICE', origin: 'java', name: 'BrowserService', displayName: 'BrowserService', scopeId: 'scope:file:java', sourceRefs: [], metadata: {} },
      { externalId: 'entity:component', kind: 'COMPONENT', origin: 'react', name: 'BrowserNavigationTree', displayName: 'BrowserNavigationTree', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:module:function1', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:function.render', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:module:function2', kind: 'CONTAINS', fromEntityId: 'entity:module', toEntityId: 'entity:function.layout', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:package:subpackage', kind: 'CONTAINS', fromEntityId: 'entity:package', toEntityId: 'entity:subpackage', label: 'contains', sourceRefs: [], metadata: {} },
      { externalId: 'rel:uses:component:module', kind: 'USES', fromEntityId: 'entity:component', toEntityId: 'entity:module', label: 'uses', sourceRefs: [], metadata: {} },
    ],
    diagnostics: [
      { externalId: 'diag:file', severity: 'WARN', phase: 'IMPORT', code: 'FILE_WARN', message: 'File warning', fatal: false, filePath: 'src/BrowserView.tsx', scopeId: 'scope:file', entityId: null, sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser entity-first regression coverage', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('tree add for FILE scope inserts the primary module entity instead of the file scope', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(['react']),
    });

    state = addPrimaryEntitiesForScope(state, 'scope:file');

    expect(state.selectedScopeId).toBe('scope:file');
    expect(state.canvasNodes).toHaveLength(1);
    expect(state.canvasNodes[0]).toMatchObject({ kind: 'entity', id: 'entity:module' });
    expect(state.canvasNodes.some((node) => node.kind === 'scope')).toBe(false);
    expect(state.focusedElement).toEqual({ kind: 'entity', id: 'entity:module' });
  });

  test('tree add for DIRECTORY scope inserts direct module entities from the directory', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(['react']),
    });

    state = addPrimaryEntitiesForScope(state, 'scope:src');

    expect(state.selectedScopeId).toBe('scope:src');
    expect(state.canvasNodes).toHaveLength(1);
    expect(state.canvasNodes[0]).toMatchObject({ kind: 'entity', id: 'entity:module' });
    expect(state.selectedEntityIds).toEqual(['entity:module']);
  });

  test('tree add for PACKAGE scope inserts the package entity', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = addPrimaryEntitiesForScope(state, 'scope:pkg');

    expect(state.selectedScopeId).toBe('scope:pkg');
    expect(state.canvasNodes).toHaveLength(1);
    expect(state.canvasNodes[0]).toMatchObject({ kind: 'entity', id: 'entity:package' });
    expect(state.focusedElement).toEqual({ kind: 'entity', id: 'entity:package' });
  });

  test('facts panel exposes the selected scope as a bridge to primary, direct, and subtree entities', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = selectBrowserScope(state, 'scope:pkg');
    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('scope');
    expect(model?.scopeBridge?.primaryEntities.map((entity) => entity.id)).toEqual(['entity:package']);
    expect(model?.scopeBridge?.directEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['CLASS:1', 'PACKAGE:1']);
    expect(model?.scopeBridge?.subtreeEntityGroups.map((group) => `${group.kind}:${group.count}`)).toEqual(['PACKAGE:2', 'CLASS:1', 'SERVICE:1']);
  });

  test('canvas toolbar for a selected module entity exposes contained and dependency actions', () => {
    const index = buildBrowserSnapshotIndex(createPayload(['react']));
    const moduleEntity = index.entitiesById.get('entity:module');

    expect(moduleEntity).toBeDefined();
    expect(buildEntitySelectionActions(index, moduleEntity!).map((action) => action.label)).toEqual([
      'Contained (2)',
      'Functions (2)',
      'Dependencies',
      'Used by (1)',
      'Remove',
      'Pin',
    ]);
  });

  test('search behavior keeps scope navigation separate from entity-first analysis seeding', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(['react']),
    });

    state = setBrowserSearch(state, 'browserview.tsx', null);
    const scopeResult = state.searchResults.find((candidate) => candidate.kind === 'scope' && candidate.id === 'scope:file');
    expect(scopeResult).toBeDefined();

    const navigateAction = toBrowserTopSearchAction(scopeResult!);
    expect(navigateAction).toEqual({
      type: 'select-scope',
      id: 'scope:file',
      scopeId: 'scope:file',
      kind: 'scope',
    });

    const addAction = toBrowserTopSearchAddAction(scopeResult!);
    expect(addAction).toEqual({
      type: 'add-scope-primary-entities',
      id: 'scope:file',
      scopeId: 'scope:file',
      kind: 'scope',
    });

    let navigated = selectBrowserScope(state, navigateAction.id);
    navigated = focusBrowserElement(navigated, { kind: 'scope', id: navigateAction.id });
    expect(navigated.selectedScopeId).toBe('scope:file');
    expect(navigated.canvasNodes).toEqual([]);
    expect(navigated.factsPanelMode).toBe('scope');

    const seeded = addPrimaryEntitiesForScope(state, addAction.id);
    expect(seeded.selectedScopeId).toBe('scope:file');
    expect(seeded.canvasNodes).toHaveLength(1);
    expect(seeded.canvasNodes[0]).toMatchObject({ kind: 'entity', id: 'entity:module' });
    expect(seeded.factsPanelMode).toBe('entity');
  });

  test('tree modes expose filesystem, package, and advanced views for technical snapshots', () => {
    const javaIndex = buildBrowserSnapshotIndex(createPayload(['java']));

    expect(detectDefaultBrowserTreeMode(javaIndex)).toBe('package');
    expect(getScopeTreeNodesForMode(javaIndex, null, 'filesystem').map((node) => node.scopeId)).toEqual(['scope:file:java', 'scope:src']);
    expect(getScopeTreeNodesForMode(javaIndex, null, 'package').map((node) => node.scopeId)).toEqual(['scope:pkg']);
    expect(getScopeTreeNodesForMode(javaIndex, null, 'advanced').map((node) => node.scopeId)).toEqual(['scope:repo']);
  });
});
