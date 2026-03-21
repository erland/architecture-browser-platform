import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { buildBrowserProjectionModel } from '../browserProjectionModel';
import { clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import { addDependenciesToCanvas, addEntityToCanvas, addScopeToCanvas, createEmptyBrowserSessionState, focusBrowserElement, openSnapshotSession, setSelectedViewpoint } from '../browserSessionStore';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-projection-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-projection',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
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
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'domain', displayName: 'Domain', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:uses', kind: 'USES', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: 'calls', sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserProjectionModel', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('builds an internal projection model from the browser canvas without changing entity semantics', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = addScopeToCanvas(state, 'scope:domain');
    state = addEntityToCanvas(state, 'entity:order');
    state = addDependenciesToCanvas(state, 'entity:order');
    state = focusBrowserElement(state, { kind: 'relationship', id: 'rel:uses' });

    const projection = buildBrowserProjectionModel(state);

    expect(projection.presentationPolicy.mode).toBe('entity-graph');
    expect(projection.nodes.map((node) => `${node.kind}:${node.source.id}`).sort()).toEqual([
      'entity:entity:order',
      'entity:entity:order:id',
      'entity:entity:order:save',
      'scope:scope:domain',
    ].sort());
    expect(projection.nodes.every((node) => node.compartments.length === 0)).toBe(true);
    expect(projection.nodes.every((node) => node.memberEntityIds.length === 0)).toBe(true);
    expect(projection.suppressedEntityIds).toEqual([]);
    expect(projection.edges.map((edge) => edge.relationshipId).sort()).toEqual(['rel:contains:id', 'rel:contains:save', 'rel:uses'].sort());
    const usesEdge = projection.edges.find((edge) => edge.relationshipId === 'rel:uses');
    expect(usesEdge?.fromNodeId).toBe('entity:entity:order');
    expect(usesEdge?.toNodeId).toBe('entity:entity:order:save');
    expect(usesEdge?.focused).toBe(true);
  });

  test('derives compact UML class nodes with attribute and operation compartments from contained members', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        viewpoints: [
          {
            id: 'persistence-model',
            title: 'Persistence model',
            description: 'Show entities and repositories.',
            availability: 'available',
            confidence: 0.95,
            seedEntityIds: ['entity:order'],
            seedRoleIds: ['persistent-structure'],
            expandViaSemantics: [],
            preferredDependencyViews: ['structural-dependencies'],
            evidenceSources: ['java-jpa'],
          },
        ],
      },
    });
    state = setSelectedViewpoint(state, 'persistence-model');
    state = addEntityToCanvas(state, 'entity:order');

    const projection = buildBrowserProjectionModel(state);
    const orderNode = projection.nodes.find((node) => node.source.kind === 'entity' && node.source.id === 'entity:order');

    expect(projection.presentationPolicy.mode).toBe('compact-uml');
    expect(projection.suppressedEntityIds).toEqual(['entity:order:id', 'entity:order:save']);
    expect(projection.nodes.map((node) => node.source.id)).toEqual(['entity:order']);
    expect(projection.edges).toEqual([]);
    expect(orderNode?.kind).toBe('uml-class');
    expect(orderNode?.memberEntityIds).toEqual(['entity:order:id', 'entity:order:save']);
    expect(orderNode?.compartments).toEqual([
      {
        kind: 'attributes',
        items: [
          {
            entityId: 'entity:order:id',
            kind: 'FIELD',
            title: 'id',
            subtitle: 'FIELD',
            selected: false,
            focused: false,
          },
        ],
      },
      {
        kind: 'operations',
        items: [
          {
            entityId: 'entity:order:save',
            kind: 'FUNCTION',
            title: 'save',
            subtitle: 'FUNCTION',
            selected: false,
            focused: false,
          },
        ],
      },
    ]);
    expect((orderNode?.width ?? 0)).toBeGreaterThan(196);
    expect((orderNode?.height ?? 0)).toBeGreaterThan(84);
  });


  test('surfaces member selection and focus state through compact uml projections', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: {
        ...createPayload(),
        viewpoints: [
          {
            id: 'persistence-model',
            title: 'Persistence model',
            description: 'Show entities and repositories.',
            availability: 'available',
            confidence: 0.95,
            seedEntityIds: ['entity:order'],
            seedRoleIds: ['persistent-structure'],
            expandViaSemantics: [],
            preferredDependencyViews: ['structural-dependencies'],
            evidenceSources: ['java-jpa'],
          },
        ],
      },
    });
    state = setSelectedViewpoint(state, 'persistence-model');
    state = {
      ...state,
      selectedEntityIds: ['entity:order:id'],
      focusedElement: { kind: 'entity', id: 'entity:order:save' },
      canvasNodes: [
        { kind: 'entity', id: 'entity:order', x: 32, y: 48 },
        { kind: 'entity', id: 'entity:order:id', x: 64, y: 164 },
        { kind: 'entity', id: 'entity:order:save', x: 128, y: 164 },
      ],
    };

    const projection = buildBrowserProjectionModel(state);
    const orderNode = projection.nodes.find((node) => node.source.id === 'entity:order');
    expect(orderNode?.selected).toBe(true);
    expect(orderNode?.focused).toBe(true);
    const attributeItem = orderNode?.compartments.find((compartment) => compartment.kind === 'attributes')?.items[0];
    const operationItem = orderNode?.compartments.find((compartment) => compartment.kind === 'operations')?.items[0];
    expect(attributeItem?.selected).toBe(true);
    expect(operationItem?.focused).toBe(true);
  });

});
