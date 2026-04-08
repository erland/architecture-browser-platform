import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, buildViewpointGraph, getViewpointById } from '../../browser-snapshot';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-preferred-entity-associations-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-preferred-entity-associations',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.4.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 1,
  entityCount: 2,
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
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'domain', displayName: 'Domain', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:customer', kind: 'CLASS', origin: 'java', name: 'Customer', displayName: 'Customer', scopeId: 'scope:domain', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: { architecturalRoles: ['persistent-entity'] } },
    ],
    relationships: [
      {
        externalId: 'rel:order-customer',
        kind: 'ASSOCIATES_WITH',
        fromEntityId: 'entity:order',
        toEntityId: 'entity:customer',
        label: null,
        sourceRefs: [],
        metadata: { associationKind: 'association', associationCardinality: 'many-to-one', sourceLowerBound: 0, sourceUpperBound: '*', targetLowerBound: 1, targetUpperBound: 1 },
      },
      {
        externalId: 'rel:customer-orders-raw',
        kind: 'ASSOCIATES_WITH',
        fromEntityId: 'entity:customer',
        toEntityId: 'entity:order',
        label: null,
        sourceRefs: [],
        metadata: { associationKind: 'association' },
      },
      {
        externalId: 'rel:customer-orders',
        kind: 'ASSOCIATES_WITH',
        fromEntityId: 'entity:customer',
        toEntityId: 'entity:order',
        label: null,
        sourceRefs: [],
        metadata: { associationKind: 'association', associationCardinality: 'one-to-many', sourceLowerBound: 1, sourceUpperBound: 1, targetLowerBound: 0, targetUpperBound: '*' },
      },
    ],
    dependencyViews: {
      entityAssociationRelationships: [
        {
          relationshipId: 'rel:customer-orders',
          canonicalRelationshipId: 'rel:customer-orders',
          relationshipKind: 'ASSOCIATES_WITH',
          relationshipType: 'normalizedAssociation',
          framework: 'jpa',
          browserViewKind: 'relationship-catalog',
          architectureViewKinds: ['entity-model'],
          sourceEntityId: 'entity:customer',
          sourceEntityName: 'Customer',
          targetEntityId: 'entity:order',
          targetEntityName: 'Order',
          label: null,
          associationKind: 'association',
          associationCardinality: 'one-to-many',
          sourceLowerBound: '1',
          sourceUpperBound: '1',
          targetLowerBound: '0',
          targetUpperBound: '*',
          bidirectional: true,
          owningSideEntityId: 'entity:order',
          owningSideMemberId: 'member:order:customer',
          inverseSideEntityId: 'entity:customer',
          inverseSideMemberId: 'member:customer:orders',
          evidenceRelationshipIds: ['rel:order-customer', 'rel:customer-orders-raw'],
          evidenceRelationshipCount: 2,
          recommendedForArchitectureViews: true,
          canonicalForEntityViews: true,
          rawRelationshipEvidenceRetained: true,
          jpaAssociationHandling: 'peer-association',
        },
      ],
      relationshipCatalogs: {
        entityAssociations: {
          id: 'entityAssociationRelationships',
          title: 'Entity associations',
          description: null,
          relationshipCatalogKind: 'normalized-associations',
          browserViewKind: 'relationship-catalog',
          framework: 'jpa',
          frameworks: ['jpa'],
          architectureViewKinds: ['entity-model'],
          available: true,
          relationshipCount: 1,
          associationCardinalities: ['one-to-many'],
          associationKinds: ['association'],
          recommendedForArchitectureViews: true,
          canonicalForEntityViews: true,
          retainsRawRelationshipEvidence: true,
        },
      },
      javaBrowserViews: {
        views: [
          {
            id: 'entity-model',
            title: 'Entity model',
            description: null,
            framework: 'jpa',
            architectureViewKind: 'entity-model',
            typeDependencyView: null,
            moduleDependencyView: null,
            relationshipCatalogView: 'entityAssociationRelationships',
            frameworkRelationships: [],
            available: true,
            typeDependencyCount: null,
            moduleDependencyCount: null,
            relationshipCatalogCount: 1,
            preferredDependencyView: 'entityAssociationRelationships',
            browserViewKind: 'relationship-catalog',
            recommendedForArchitectureViews: true,
            relationshipKinds: ['ASSOCIATES_WITH'],
            availableFrameworks: ['jpa'],
            availableArchitectureViewKinds: ['entity-model'],
          },
        ],
        availableViews: ['entity-model'],
        defaultViewId: 'entity-model',
      },
    },
    viewpoints: [
      { id: 'persistence-model', title: 'Persistence model', description: 'Show persistent structures.', availability: 'available', confidence: 0.95, seedEntityIds: [], seedRoleIds: ['persistent-entity'], expandViaSemantics: ['accesses-persistence', 'stored-in'], preferredDependencyViews: ['java:type-dependencies'], evidenceSources: ['java-jpa'] },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('persistent entity association preference', () => {
  test('show-entity-relations prefers entityAssociationRelationships when the browser metadata marks it as preferred', () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const viewpoint = getViewpointById(index, 'persistence-model');
    expect(viewpoint).not.toBeNull();

    const graph = buildViewpointGraph(index, viewpoint!, { scopeMode: 'whole-snapshot', variant: 'show-entity-relations' });

    expect(graph.relationshipIds).toEqual(['rel:customer-orders']);
    expect(graph.preferredDependencyViews).toEqual(['entityAssociationRelationships']);
  });
});
