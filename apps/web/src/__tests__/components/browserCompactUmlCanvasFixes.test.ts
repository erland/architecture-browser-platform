import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserProjectionModel } from '../../browser-projection';
import { buildBrowserGraphWorkspaceModel } from '../../browserGraphWorkspaceModel';
import { clearBrowserSnapshotIndex } from '../../browserSnapshotIndex';
import {
  arrangeAllCanvasNodes,
  createEmptyBrowserSessionState,
  openSnapshotSession,
  setSelectedViewpoint,
} from '../../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-compact-uml-fixes-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-compact-uml-fixes',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 1,
  entityCount: 6,
  relationshipCount: 4,
  diagnosticCount: 0,
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
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'com.example.domain', displayName: 'Domain', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'com.example.domain.Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:number', kind: 'FIELD', origin: 'java', name: 'orderNumber', displayName: 'orderNumber', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:customer', kind: 'CLASS', origin: 'java', name: 'com.example.domain.Customer', displayName: 'Customer', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:repo', kind: 'PERSISTENCE_ADAPTER', origin: 'java', name: 'com.example.persistence.OrderRepositoryAdapter', displayName: 'OrderRepositoryAdapter', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:order:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:order:number', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:number', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:order:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:repo-uses-order', kind: 'USES', fromEntityId: 'entity:repo', toEntityId: 'entity:order', label: 'loads', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [
      {
        id: 'domain-model',
        title: 'Domain model',
        description: 'Show domain classifiers.',
        availability: 'available',
        confidence: 0.95,
        seedEntityIds: ['entity:order', 'entity:customer'],
        seedRoleIds: [],
        expandViaSemantics: [],
        preferredDependencyViews: ['structural-dependencies'],
        evidenceSources: ['java'],
      },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser compact UML canvas fixes', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('canvas nodes omit subtitles and keep the display name for persistence adapters', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });

    state = {
      ...state,
      canvasNodes: [{ id: 'entity:repo', kind: 'entity', x: 40, y: 80 }],
    };

    const projection = buildBrowserProjectionModel(state);
    expect(projection.nodes[0]).toMatchObject({
      title: 'OrderRepositoryAdapter',
      subtitle: '',
    });
  });

  test('grid arrange uses compact UML node heights when spacing class nodes', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = setSelectedViewpoint(state, 'domain-model');
    state = {
      ...state,
      canvasNodes: [
        { id: 'entity:order', kind: 'entity', x: 40, y: 80 },
        { id: 'entity:customer', kind: 'entity', x: 60, y: 100 },
      ],
    };

    const arranged = arrangeAllCanvasNodes(state);
    const model = buildBrowserGraphWorkspaceModel(arranged);
    const orderNode = model.nodes.find((node) => node.id === 'entity:order');
    const customerNode = model.nodes.find((node) => node.id === 'entity:customer');

    expect(orderNode?.kind).toBe('uml-class');
    expect(orderNode && customerNode).toBeTruthy();
    const overlaps = !(
      (orderNode?.x ?? 0) + (orderNode?.width ?? 0) + 24 <= (customerNode?.x ?? 0) ||
      (customerNode?.x ?? 0) + (customerNode?.width ?? 0) + 24 <= (orderNode?.x ?? 0) ||
      (orderNode?.y ?? 0) + (orderNode?.height ?? 0) + 24 <= (customerNode?.y ?? 0) ||
      (customerNode?.y ?? 0) + (customerNode?.height ?? 0) + 24 <= (orderNode?.y ?? 0)
    );
    expect(overlaps).toBe(false);
  });
});
