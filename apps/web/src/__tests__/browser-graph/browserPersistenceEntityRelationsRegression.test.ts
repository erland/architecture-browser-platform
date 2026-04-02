import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserGraphWorkspaceModel } from '../../browser-graph';
import { buildBrowserSnapshotIndex, buildViewpointGraph, clearBrowserSnapshotIndex, getViewpointById } from '../../browser-snapshot';
import { resolveBrowserViewpointPresentationPolicy } from '../../browser-graph';
import { applySelectedViewpoint, createEmptyBrowserSessionState, openSnapshotSession, setSelectedViewpoint, setViewpointVariant } from '../../browser-session';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-persistence-entity-relations-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-persistence-entity-relations',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 1,
  entityCount: 4,
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
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'domain', displayName: 'Domain', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:customer', kind: 'CLASS', origin: 'java', name: 'Customer', displayName: 'Customer', scopeId: 'scope:domain', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
      { externalId: 'entity:order-id', kind: 'CLASS', origin: 'java', name: 'OrderId', displayName: 'OrderId', scopeId: 'scope:domain', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
      { externalId: 'entity:order-repository', kind: 'CLASS', origin: 'java', name: 'OrderRepository', displayName: 'OrderRepository', scopeId: 'scope:domain', sourceRefs: [], metadata: { architecturalRoles: ['persistence-access'] } },
    ],
    relationships: [
      {
        externalId: 'rel:order-customer',
        kind: 'ASSOCIATES_WITH',
        fromEntityId: 'entity:order',
        toEntityId: 'entity:customer',
        label: null,
        sourceRefs: [],
        metadata: {
          associationKind: 'association',
          associationCardinality: 'many-to-one',
          sourceLowerBound: 0,
          sourceUpperBound: '*',
          targetLowerBound: 1,
          targetUpperBound: 1,
        },
      },
      {
        externalId: 'rel:order-orderid',
        kind: 'ASSOCIATES_WITH',
        fromEntityId: 'entity:order',
        toEntityId: 'entity:order-id',
        label: null,
        sourceRefs: [],
        metadata: {
          associationKind: 'association',
          associationCardinality: 'one-to-one',
        },
      },
      {
        externalId: 'rel:repository-order',
        kind: 'USES',
        fromEntityId: 'entity:order-repository',
        toEntityId: 'entity:order',
        label: 'loads',
        sourceRefs: [],
        metadata: {
          architecturalSemantics: ['accesses-persistence'],
        },
      },
      {
        externalId: 'rel:customer-repository',
        kind: 'USES',
        fromEntityId: 'entity:customer',
        toEntityId: 'entity:order-repository',
        label: 'debug-only',
        sourceRefs: [],
        metadata: {
          associationKind: 'association',
        },
      },
    ],
    viewpoints: [
      { id: 'persistence-model', title: 'Persistence model', description: 'Show persistent structures and access paths.', availability: 'available', confidence: 0.95, seedEntityIds: [], seedRoleIds: ['persistent-entity', 'persistence-access'], expandViaSemantics: ['accesses-persistence', 'stored-in'], preferredDependencyViews: ['java:type-dependencies'], evidenceSources: ['java-jpa'] },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser persistence entity-relations regression', () => {
  afterEach(() => clearBrowserSnapshotIndex());

  test('show-entity-relations keeps only persistent entities and normalized association relationships with display metadata', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const viewpoint = getViewpointById(index, 'persistence-model');
    expect(viewpoint).not.toBeNull();

    const graph = buildViewpointGraph(index, viewpoint!, { scopeMode: 'whole-snapshot', variant: 'show-entity-relations' });

    expect(graph.seedEntityIds).toEqual(['entity:customer', 'entity:order', 'entity:order-id']);
    expect(graph.entityIds).toEqual(['entity:customer', 'entity:order', 'entity:order-id']);
    expect(graph.relationshipIds).toEqual(['rel:order-customer', 'rel:order-orderid']);
    expect(graph.entityIds).not.toContain('entity:order-repository');
    expect(graph.relationshipIds).not.toContain('rel:repository-order');
    expect(graph.relationshipIds).not.toContain('rel:customer-repository');
  });

  test('auto presentation prefers compact UML for persistence entity-relations', () => {
    const policy = resolveBrowserViewpointPresentationPolicy({ id: 'persistence-model' }, 'show-entity-relations');
    expect(policy.mode).toBe('compact-uml');
    expect(policy.collapseMembersByDefault).toBe(true);
  });

  test('workspace edges show multiplicity labels from normalized bounds and cardinality fallback', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = setSelectedViewpoint(state, 'persistence-model');
    state = setViewpointVariant(state, 'show-entity-relations');
    state = applySelectedViewpoint(state);

    const model = buildBrowserGraphWorkspaceModel(state);

    expect(model.presentationMode).toBe('compact-uml');
    expect(model.edges.map((edge) => `${edge.relationshipId}:${edge.label}`).sort()).toEqual([
      'rel:order-customer:0..* → 1',
      'rel:order-orderid:one-to-one',
    ]);
  });

  test('default persistence-model behavior remains access-path oriented', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const viewpoint = getViewpointById(index, 'persistence-model');
    expect(viewpoint).not.toBeNull();

    const graph = buildViewpointGraph(index, viewpoint!, { scopeMode: 'whole-snapshot' });

    expect(graph.relationshipIds).toEqual(['rel:repository-order']);
    expect(graph.entityIds).toContain('entity:order-repository');
  });
});
