import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import {
  addDependenciesToCanvas,
  addEntitiesToCanvas,
  addEntityToCanvas,
  addScopeToCanvas,
  createEmptyBrowserSessionState,
  openSnapshotSession,
} from '../../browser-session';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';
import {
  assembleDependencyCanvasExpansion,
  assembleEntitiesCanvasAddition,
  assembleEntityCanvasAddition,
  assembleScopeCanvasAddition,
} from '../../browser-session/canvas/canvasContentAssembly';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-session-assembly',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Platform',
  runId: 'run-1',
  snapshotKey: 'snap-session-assembly',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.3.0',
  indexerVersion: 'test',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-04-05T10:00:00Z',
  scopeCount: 2,
  entityCount: 3,
  relationshipCount: 3,
  diagnosticCount: 0,
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
      { externalId: 'entity:app', kind: 'COMPONENT', origin: 'react', name: 'App', displayName: 'App', scopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'entity:service', kind: 'COMPONENT', origin: 'react', name: 'Service', displayName: 'Service', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
      { externalId: 'entity:repo', kind: 'COMPONENT', origin: 'react', name: 'Repo', displayName: 'Repo', scopeId: 'scope:web', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:1', kind: 'USES', fromEntityId: 'entity:app', toEntityId: 'entity:service', label: 'uses', sourceRefs: [], metadata: {} },
      { externalId: 'rel:2', kind: 'CALLS', fromEntityId: 'entity:service', toEntityId: 'entity:repo', label: 'calls', sourceRefs: [], metadata: {} },
      { externalId: 'rel:3', kind: 'DEPENDS_ON', fromEntityId: 'entity:repo', toEntityId: 'entity:service', label: 'depends on', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

function createState() {
  return openSnapshotSession(createEmptyBrowserSessionState(), {
    workspaceId: 'ws-1',
    repositoryId: 'repo-1',
    payload: createPayload(),
  });
}

describe('browser session canvas content assembly', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('single-entity assembly matches addEntityToCanvas behavior for nodes, edges, and focus scope', () => {
    const state = createState();

    const assembled = assembleEntityCanvasAddition(state, 'entity:service');
    const mutated = addEntityToCanvas(state, 'entity:service');

    expect(assembled).not.toBeNull();
    expect(assembled?.canvasNodes).toEqual(mutated.canvasNodes);
    expect(assembled?.canvasEdges).toEqual(mutated.canvasEdges);
    expect(assembled?.selectedScopeId).toBe(mutated.selectedScopeId);
    expect(assembled?.focusEntityId).toBe('entity:service');
  });

  test('multi-entity assembly dedupes ids and matches addEntitiesToCanvas selection/focus outcomes', () => {
    const state = createState();

    const assembled = assembleEntitiesCanvasAddition(state, ['entity:service', 'entity:service', 'entity:repo']);
    const mutated = addEntitiesToCanvas(state, ['entity:service', 'entity:service', 'entity:repo']);

    expect(assembled).not.toBeNull();
    expect(assembled?.validEntityIds).toEqual(['entity:service', 'entity:repo']);
    expect(assembled?.canvasNodes).toEqual(mutated.canvasNodes);
    expect(assembled?.canvasEdges).toEqual(mutated.canvasEdges);
    expect(assembled?.selectedEntityIds).toEqual(mutated.selectedEntityIds);
    expect(assembled?.selectedScopeId).toBe(mutated.selectedScopeId);
    expect(assembled?.focusEntityId).toBe(mutated.focusedElement?.kind === 'entity' ? mutated.focusedElement.id : null);
  });

  test('scope assembly matches addScopeToCanvas behavior for nodes and edges', () => {
    const state = createState();

    const assembled = assembleScopeCanvasAddition(state, 'scope:web');
    const mutated = addScopeToCanvas(state, 'scope:web');

    expect(assembled).not.toBeNull();
    expect(assembled?.canvasNodes).toEqual(mutated.canvasNodes);
    expect(assembled?.canvasEdges).toEqual(mutated.canvasEdges);
  });

  test('dependency expansion assembly matches addDependenciesToCanvas graph content and action metadata', () => {
    const state = createState();

    const assembled = assembleDependencyCanvasExpansion(state, 'entity:service', 'ALL');
    const mutated = addDependenciesToCanvas(state, 'entity:service', 'ALL');
    const lastAction = mutated.graphExpansionActions[mutated.graphExpansionActions.length - 1];

    expect(assembled).not.toBeNull();
    expect(assembled?.canvasNodes).toEqual(mutated.canvasNodes);
    expect(assembled?.canvasEdges).toEqual(mutated.canvasEdges);
    expect(assembled?.graphExpansionAction).toBeTruthy();
    expect(assembled?.graphExpansionAction?.type).toBe('dependencies');
    expect(assembled?.graphExpansionAction?.entityId).toBe('entity:service');
    expect(assembled?.graphExpansionAction?.direction).toBe('ALL');
    expect(lastAction?.type).toBe('dependencies');
    expect(lastAction?.entityId).toBe('entity:service');
    expect(lastAction?.direction).toBe('ALL');
  });
});
