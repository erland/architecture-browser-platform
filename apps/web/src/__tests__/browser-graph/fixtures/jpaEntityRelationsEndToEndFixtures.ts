import type { FullSnapshotEntityAssociationRelationship, FullSnapshotPayload, FullSnapshotRelationship, SnapshotSummary } from '../../../app-model';

export type JpaEntityRelationFixture = {
  name: string;
  payload: FullSnapshotPayload;
  expectedRelationshipIds: string[];
  expectedEdgeSummaries: Array<{
    relationshipId: string;
    fromLabel?: string;
    toLabel?: string;
    label?: string;
    semanticStyle?: string;
  }>;
  factsRelationshipId: string;
  expectedEvidenceRelationshipIds: string[];
};

const baseSummary: SnapshotSummary = {
  id: 'snap-jpa-fixture',
  workspaceId: 'ws-jpa',
  repositoryRegistrationId: 'repo-jpa',
  repositoryKey: 'sample-task-tracker',
  repositoryName: 'Sample Task Tracker',
  runId: 'run-jpa',
  snapshotKey: 'sample-task-tracker-jpa',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.4.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-04-08T00:00:00Z',
  scopeCount: 1,
  entityCount: 0,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function sourceRef(path: string, startLine: number): { path: string; startLine: number; endLine: number; snippet: null; metadata: {} } {
  return { path, startLine, endLine: startLine, snippet: null, metadata: {} };
}

function persistentEntity(id: string, name: string) {
  return {
    externalId: id,
    kind: 'CLASS',
    origin: 'java',
    name,
    displayName: name,
    scopeId: 'scope:domain',
    sourceRefs: [sourceRef(`src/main/java/com/example/domain/${name}.java`, 1)],
    metadata: { architecturalRoles: ['persistent-entity'] },
  };
}

function rawRelationship(
  externalId: string,
  fromEntityId: string,
  toEntityId: string,
  cardinality: string,
  sourceLowerBound: number | string | null,
  sourceUpperBound: number | string | null,
  targetLowerBound: number | string | null,
  targetUpperBound: number | string | null,
  extraMetadata: Record<string, unknown> = {},
): FullSnapshotRelationship {
  return {
    externalId,
    kind: 'ASSOCIATES_WITH',
    fromEntityId,
    toEntityId,
    label: null,
    sourceRefs: [sourceRef('src/main/java/com/example/domain/Relationship.java', 10)],
    metadata: {
      associationKind: 'association',
      associationCardinality: cardinality,
      sourceLowerBound,
      sourceUpperBound,
      targetLowerBound,
      targetUpperBound,
      ...extraMetadata,
    },
  };
}

function canonicalRelationship(config: {
  relationshipId: string;
  fromEntityId: string;
  fromEntityName: string;
  toEntityId: string;
  toEntityName: string;
  associationKind: 'association' | 'containment';
  associationCardinality: string;
  sourceLowerBound: string | null;
  sourceUpperBound: string | null;
  targetLowerBound: string | null;
  targetUpperBound: string | null;
  bidirectional: boolean;
  evidenceRelationshipIds: string[];
  label?: string | null;
}): FullSnapshotRelationship {
  return {
    externalId: config.relationshipId,
    kind: 'ASSOCIATES_WITH',
    fromEntityId: config.fromEntityId,
    toEntityId: config.toEntityId,
    label: config.label ?? null,
    sourceRefs: [sourceRef(`src/main/java/com/example/domain/${config.fromEntityName}.java`, 20)],
    normalizedAssociation: {
      associationKind: config.associationKind,
      associationCardinality: config.associationCardinality,
      sourceLowerBound: config.sourceLowerBound,
      sourceUpperBound: config.sourceUpperBound,
      targetLowerBound: config.targetLowerBound,
      targetUpperBound: config.targetUpperBound,
      bidirectional: config.bidirectional,
      evidenceRelationshipIds: [...config.evidenceRelationshipIds],
      owningSideEntityId: config.bidirectional ? config.toEntityId : config.fromEntityId,
      owningSideMemberId: `member:${config.toEntityName.toLowerCase()}:owning`,
      inverseSideEntityId: config.bidirectional ? config.fromEntityId : null,
      inverseSideMemberId: config.bidirectional ? `member:${config.fromEntityName.toLowerCase()}:inverse` : null,
    },
    metadata: {
      framework: 'jpa',
      relationshipType: 'hasAssociation',
      associationKind: config.associationKind,
      associationCardinality: config.associationCardinality,
      sourceLowerBound: config.sourceLowerBound,
      sourceUpperBound: config.sourceUpperBound,
      targetLowerBound: config.targetLowerBound,
      targetUpperBound: config.targetUpperBound,
      jpaAssociationHandling: 'peer-association',
    },
  };
}

function entityAssociationCatalogEntry(config: {
  relationshipId: string;
  sourceEntityId: string;
  sourceEntityName: string;
  targetEntityId: string;
  targetEntityName: string;
  associationKind: 'association' | 'containment';
  associationCardinality: string;
  sourceLowerBound: string | null;
  sourceUpperBound: string | null;
  targetLowerBound: string | null;
  targetUpperBound: string | null;
  bidirectional: boolean;
  evidenceRelationshipIds: string[];
  label?: string | null;
}): FullSnapshotEntityAssociationRelationship {
  return {
    relationshipId: config.relationshipId,
    canonicalRelationshipId: config.relationshipId,
    relationshipKind: 'ASSOCIATES_WITH',
    relationshipType: 'normalizedAssociation',
    framework: 'jpa',
    browserViewKind: 'relationship-catalog',
    architectureViewKinds: ['entity-model'],
    sourceEntityId: config.sourceEntityId,
    sourceEntityName: config.sourceEntityName,
    targetEntityId: config.targetEntityId,
    targetEntityName: config.targetEntityName,
    label: config.label ?? null,
    associationKind: config.associationKind,
    associationCardinality: config.associationCardinality,
    sourceLowerBound: config.sourceLowerBound,
    sourceUpperBound: config.sourceUpperBound,
    targetLowerBound: config.targetLowerBound,
    targetUpperBound: config.targetUpperBound,
    bidirectional: config.bidirectional,
    owningSideEntityId: config.bidirectional ? config.targetEntityId : config.sourceEntityId,
    owningSideMemberId: `member:${config.targetEntityName.toLowerCase()}:owning`,
    inverseSideEntityId: config.bidirectional ? config.sourceEntityId : null,
    inverseSideMemberId: config.bidirectional ? `member:${config.sourceEntityName.toLowerCase()}:inverse` : null,
    evidenceRelationshipIds: [...config.evidenceRelationshipIds],
    evidenceRelationshipCount: config.evidenceRelationshipIds.length,
    recommendedForArchitectureViews: true,
    canonicalForEntityViews: true,
    rawRelationshipEvidenceRetained: true,
    jpaAssociationHandling: 'peer-association',
  };
}

function createPayload(config: {
  summaryId: string;
  entities: ReturnType<typeof persistentEntity>[];
  relationships: FullSnapshotRelationship[];
  entityAssociations: FullSnapshotEntityAssociationRelationship[];
}): FullSnapshotPayload {
  const summary: SnapshotSummary = {
    ...baseSummary,
    id: config.summaryId,
    snapshotKey: config.summaryId,
    entityCount: config.entities.length,
    relationshipCount: config.relationships.length,
  };

  return {
    snapshot: summary,
    source: { repositoryId: 'repo-jpa', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'com.example.domain', displayName: 'com.example.domain', parentScopeId: null, sourceRefs: [sourceRef('src/main/java/com/example/domain', 1)], metadata: {} },
    ],
    entities: config.entities,
    relationships: config.relationships,
    dependencyViews: {
      entityAssociationRelationships: config.entityAssociations,
      relationshipCatalogs: {
        entityAssociations: {
          id: 'entityAssociationRelationships',
          title: 'Entity associations',
          description: 'Canonical peer-entity associations.',
          relationshipCatalogKind: 'normalized-associations',
          browserViewKind: 'relationship-catalog',
          framework: 'jpa',
          frameworks: ['jpa'],
          architectureViewKinds: ['entity-model'],
          available: true,
          relationshipCount: config.entityAssociations.length,
          associationCardinalities: [...new Set(config.entityAssociations.map((entry) => entry.associationCardinality).filter((v): v is string => Boolean(v)))],
          associationKinds: [...new Set(config.entityAssociations.map((entry) => entry.associationKind).filter((v): v is string => Boolean(v)))],
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
            description: 'Entity model relationships.',
            framework: 'jpa',
            architectureViewKind: 'entity-model',
            typeDependencyView: null,
            moduleDependencyView: null,
            relationshipCatalogView: 'entityAssociationRelationships',
            frameworkRelationships: [],
            available: true,
            typeDependencyCount: null,
            moduleDependencyCount: null,
            relationshipCatalogCount: config.entityAssociations.length,
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
      {
        id: 'persistence-model',
        title: 'Persistence model',
        description: 'Show persistent structures and access paths.',
        availability: 'available',
        confidence: 0.95,
        seedEntityIds: [],
        seedRoleIds: ['persistent-entity'],
        expandViaSemantics: ['accesses-persistence', 'stored-in'],
        preferredDependencyViews: ['java:type-dependencies'],
        evidenceSources: ['java-jpa'],
      },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

export const jpaEntityRelationFixtures: JpaEntityRelationFixture[] = [
  (() => {
    const entities = [persistentEntity('entity:project', 'Project'), persistentEntity('entity:task', 'Task')];
    const canonical = canonicalRelationship({
      relationshipId: 'rel:project-tasks',
      fromEntityId: 'entity:project',
      fromEntityName: 'Project',
      toEntityId: 'entity:task',
      toEntityName: 'Task',
      associationKind: 'association',
      associationCardinality: 'one-to-many',
      sourceLowerBound: '1',
      sourceUpperBound: '1',
      targetLowerBound: '0',
      targetUpperBound: '*',
      bidirectional: true,
      evidenceRelationshipIds: ['rel:task-project', 'rel:project-tasks-raw'],
    });
    return {
      name: 'bidirectional one-to-many',
      payload: createPayload({
        summaryId: 'snap-jpa-one-to-many',
        entities,
        relationships: [
          rawRelationship('rel:task-project', 'entity:task', 'entity:project', 'many-to-one', 0, '*', 1, 1, { jpaAssociation: '@ManyToOne(optional = false)' }),
          rawRelationship('rel:project-tasks-raw', 'entity:project', 'entity:task', 'one-to-many', 1, 1, 0, '*', { mappedBy: 'project' }),
          canonical,
        ],
        entityAssociations: [entityAssociationCatalogEntry({
          relationshipId: canonical.externalId,
          sourceEntityId: canonical.fromEntityId,
          sourceEntityName: 'Project',
          targetEntityId: canonical.toEntityId,
          targetEntityName: 'Task',
          associationKind: 'association',
          associationCardinality: 'one-to-many',
          sourceLowerBound: '1',
          sourceUpperBound: '1',
          targetLowerBound: '0',
          targetUpperBound: '*',
          bidirectional: true,
          evidenceRelationshipIds: ['rel:task-project', 'rel:project-tasks-raw'],
        })],
      }),
      expectedRelationshipIds: ['rel:project-tasks'],
      expectedEdgeSummaries: [{ relationshipId: 'rel:project-tasks', fromLabel: '1', toLabel: '0..*' }],
      factsRelationshipId: 'rel:project-tasks',
      expectedEvidenceRelationshipIds: ['rel:task-project', 'rel:project-tasks-raw'],
    };
  })(),
  (() => {
    const entities = [persistentEntity('entity:user', 'UserAccount'), persistentEntity('entity:profile', 'UserProfile')];
    const canonical = canonicalRelationship({
      relationshipId: 'rel:user-profile',
      fromEntityId: 'entity:user',
      fromEntityName: 'UserAccount',
      toEntityId: 'entity:profile',
      toEntityName: 'UserProfile',
      associationKind: 'association',
      associationCardinality: 'one-to-one',
      sourceLowerBound: '1',
      sourceUpperBound: '1',
      targetLowerBound: '0',
      targetUpperBound: '1',
      bidirectional: true,
      evidenceRelationshipIds: ['rel:profile-user', 'rel:user-profile-raw'],
    });
    return {
      name: 'bidirectional one-to-one',
      payload: createPayload({
        summaryId: 'snap-jpa-one-to-one',
        entities,
        relationships: [
          rawRelationship('rel:profile-user', 'entity:profile', 'entity:user', 'one-to-one', 0, 1, 1, 1, { jpaAssociation: '@OneToOne(optional = false)' }),
          rawRelationship('rel:user-profile-raw', 'entity:user', 'entity:profile', 'one-to-one', 1, 1, 0, 1, { mappedBy: 'user' }),
          canonical,
        ],
        entityAssociations: [entityAssociationCatalogEntry({
          relationshipId: canonical.externalId,
          sourceEntityId: canonical.fromEntityId,
          sourceEntityName: 'UserAccount',
          targetEntityId: canonical.toEntityId,
          targetEntityName: 'UserProfile',
          associationKind: 'association',
          associationCardinality: 'one-to-one',
          sourceLowerBound: '1',
          sourceUpperBound: '1',
          targetLowerBound: '0',
          targetUpperBound: '1',
          bidirectional: true,
          evidenceRelationshipIds: ['rel:profile-user', 'rel:user-profile-raw'],
        })],
      }),
      expectedRelationshipIds: ['rel:user-profile'],
      expectedEdgeSummaries: [{ relationshipId: 'rel:user-profile', fromLabel: '1', toLabel: '0..1' }],
      factsRelationshipId: 'rel:user-profile',
      expectedEvidenceRelationshipIds: ['rel:profile-user', 'rel:user-profile-raw'],
    };
  })(),
  (() => {
    const entities = [persistentEntity('entity:student', 'Student'), persistentEntity('entity:course', 'Course')];
    const canonical = canonicalRelationship({
      relationshipId: 'rel:student-courses',
      fromEntityId: 'entity:student',
      fromEntityName: 'Student',
      toEntityId: 'entity:course',
      toEntityName: 'Course',
      associationKind: 'association',
      associationCardinality: 'many-to-many',
      sourceLowerBound: '0',
      sourceUpperBound: '*',
      targetLowerBound: '0',
      targetUpperBound: '*',
      bidirectional: true,
      evidenceRelationshipIds: ['rel:student-courses-owning', 'rel:course-students-inverse'],
    });
    return {
      name: 'bidirectional many-to-many',
      payload: createPayload({
        summaryId: 'snap-jpa-many-to-many',
        entities,
        relationships: [
          rawRelationship('rel:student-courses-owning', 'entity:student', 'entity:course', 'many-to-many', 0, '*', 0, '*', { joinTable: 'student_course' }),
          rawRelationship('rel:course-students-inverse', 'entity:course', 'entity:student', 'many-to-many', 0, '*', 0, '*', { mappedBy: 'courses' }),
          canonical,
        ],
        entityAssociations: [entityAssociationCatalogEntry({
          relationshipId: canonical.externalId,
          sourceEntityId: canonical.fromEntityId,
          sourceEntityName: 'Student',
          targetEntityId: canonical.toEntityId,
          targetEntityName: 'Course',
          associationKind: 'association',
          associationCardinality: 'many-to-many',
          sourceLowerBound: '0',
          sourceUpperBound: '*',
          targetLowerBound: '0',
          targetUpperBound: '*',
          bidirectional: true,
          evidenceRelationshipIds: ['rel:student-courses-owning', 'rel:course-students-inverse'],
        })],
      }),
      expectedRelationshipIds: ['rel:student-courses'],
      expectedEdgeSummaries: [{ relationshipId: 'rel:student-courses', fromLabel: '0..*', toLabel: '0..*' }],
      factsRelationshipId: 'rel:student-courses',
      expectedEvidenceRelationshipIds: ['rel:student-courses-owning', 'rel:course-students-inverse'],
    };
  })(),
  (() => {
    const entities = [persistentEntity('entity:order', 'Order'), persistentEntity('entity:order-line', 'OrderLine')];
    const canonical = canonicalRelationship({
      relationshipId: 'rel:order-lines',
      fromEntityId: 'entity:order',
      fromEntityName: 'Order',
      toEntityId: 'entity:order-line',
      toEntityName: 'OrderLine',
      associationKind: 'containment',
      associationCardinality: 'one-to-many',
      sourceLowerBound: '1',
      sourceUpperBound: '1',
      targetLowerBound: '1',
      targetUpperBound: '*',
      bidirectional: true,
      evidenceRelationshipIds: ['rel:line-order', 'rel:order-lines-raw'],
    });
    return {
      name: 'containment one-to-many',
      payload: createPayload({
        summaryId: 'snap-jpa-containment',
        entities,
        relationships: [
          rawRelationship('rel:line-order', 'entity:order-line', 'entity:order', 'many-to-one', 1, 1, 1, 1, { orphanRemoval: true }),
          rawRelationship('rel:order-lines-raw', 'entity:order', 'entity:order-line', 'one-to-many', 1, 1, 1, '*', { mappedBy: 'order', orphanRemoval: true }),
          canonical,
        ],
        entityAssociations: [entityAssociationCatalogEntry({
          relationshipId: canonical.externalId,
          sourceEntityId: canonical.fromEntityId,
          sourceEntityName: 'Order',
          targetEntityId: canonical.toEntityId,
          targetEntityName: 'OrderLine',
          associationKind: 'containment',
          associationCardinality: 'one-to-many',
          sourceLowerBound: '1',
          sourceUpperBound: '1',
          targetLowerBound: '1',
          targetUpperBound: '*',
          bidirectional: true,
          evidenceRelationshipIds: ['rel:line-order', 'rel:order-lines-raw'],
        })],
      }),
      expectedRelationshipIds: ['rel:order-lines'],
      expectedEdgeSummaries: [{ relationshipId: 'rel:order-lines', fromLabel: '1', toLabel: '1..*', label: 'containment', semanticStyle: 'containment' }],
      factsRelationshipId: 'rel:order-lines',
      expectedEvidenceRelationshipIds: ['rel:line-order', 'rel:order-lines-raw'],
    };
  })(),
  (() => {
    const entities = [persistentEntity('entity:project', 'Project'), persistentEntity('entity:task', 'Task')];
    const ownerCanonical = canonicalRelationship({
      relationshipId: 'rel:project-owned-tasks',
      fromEntityId: 'entity:project',
      fromEntityName: 'Project',
      toEntityId: 'entity:task',
      toEntityName: 'Task',
      associationKind: 'association',
      associationCardinality: 'one-to-many',
      sourceLowerBound: '1',
      sourceUpperBound: '1',
      targetLowerBound: '0',
      targetUpperBound: '*',
      bidirectional: true,
      evidenceRelationshipIds: ['rel:task-owning-project', 'rel:project-owned-tasks-raw'],
      label: 'ownedTasks',
    });
    const reviewCanonical = canonicalRelationship({
      relationshipId: 'rel:project-reviewed-tasks',
      fromEntityId: 'entity:project',
      fromEntityName: 'Project',
      toEntityId: 'entity:task',
      toEntityName: 'Task',
      associationKind: 'association',
      associationCardinality: 'one-to-many',
      sourceLowerBound: '1',
      sourceUpperBound: '1',
      targetLowerBound: '0',
      targetUpperBound: '*',
      bidirectional: true,
      evidenceRelationshipIds: ['rel:task-review-project', 'rel:project-reviewed-tasks-raw'],
      label: 'reviewedTasks',
    });
    return {
      name: 'parallel non-merge relationships',
      payload: createPayload({
        summaryId: 'snap-jpa-non-merge',
        entities,
        relationships: [
          rawRelationship('rel:task-owning-project', 'entity:task', 'entity:project', 'many-to-one', 0, '*', 1, 1, { joinColumn: 'owning_project_id' }),
          rawRelationship('rel:project-owned-tasks-raw', 'entity:project', 'entity:task', 'one-to-many', 1, 1, 0, '*', { mappedBy: 'owningProject' }),
          rawRelationship('rel:task-review-project', 'entity:task', 'entity:project', 'many-to-one', 0, '*', 1, 1, { joinColumn: 'review_project_id' }),
          rawRelationship('rel:project-reviewed-tasks-raw', 'entity:project', 'entity:task', 'one-to-many', 1, 1, 0, '*', { mappedBy: 'reviewProject' }),
          ownerCanonical,
          reviewCanonical,
        ],
        entityAssociations: [
          entityAssociationCatalogEntry({
            relationshipId: ownerCanonical.externalId,
            sourceEntityId: ownerCanonical.fromEntityId,
            sourceEntityName: 'Project',
            targetEntityId: ownerCanonical.toEntityId,
            targetEntityName: 'Task',
            associationKind: 'association',
            associationCardinality: 'one-to-many',
            sourceLowerBound: '1',
            sourceUpperBound: '1',
            targetLowerBound: '0',
            targetUpperBound: '*',
            bidirectional: true,
            evidenceRelationshipIds: ['rel:task-owning-project', 'rel:project-owned-tasks-raw'],
            label: 'ownedTasks',
          }),
          entityAssociationCatalogEntry({
            relationshipId: reviewCanonical.externalId,
            sourceEntityId: reviewCanonical.fromEntityId,
            sourceEntityName: 'Project',
            targetEntityId: reviewCanonical.toEntityId,
            targetEntityName: 'Task',
            associationKind: 'association',
            associationCardinality: 'one-to-many',
            sourceLowerBound: '1',
            sourceUpperBound: '1',
            targetLowerBound: '0',
            targetUpperBound: '*',
            bidirectional: true,
            evidenceRelationshipIds: ['rel:task-review-project', 'rel:project-reviewed-tasks-raw'],
            label: 'reviewedTasks',
          }),
        ],
      }),
      expectedRelationshipIds: ['rel:project-owned-tasks', 'rel:project-reviewed-tasks'],
      expectedEdgeSummaries: [
        { relationshipId: 'rel:project-owned-tasks', fromLabel: '1', toLabel: '0..*' },
        { relationshipId: 'rel:project-reviewed-tasks', fromLabel: '1', toLabel: '0..*' },
      ],
      factsRelationshipId: 'rel:project-owned-tasks',
      expectedEvidenceRelationshipIds: ['rel:task-owning-project', 'rel:project-owned-tasks-raw'],
    };
  })(),
];
