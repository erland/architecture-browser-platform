import type { KindCount, SnapshotSummary } from '../app-model/appModel.api';

export type SnapshotSourceRef = {
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  snippet: string | null;
  metadata: Record<string, unknown>;
};

export type FullSnapshotScope = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  parentScopeId: string | null;
  sourceRefs: SnapshotSourceRef[];
  metadata: Record<string, unknown>;
};

export type FullSnapshotEntity = {
  externalId: string;
  kind: string;
  origin: string | null;
  name: string;
  displayName: string | null;
  scopeId: string | null;
  sourceRefs: SnapshotSourceRef[];
  metadata: Record<string, unknown>;
};

export type FullSnapshotNormalizedAssociation = {
  associationKind: string | null;
  associationCardinality: string | null;
  sourceLowerBound: string | null;
  sourceUpperBound: string | null;
  targetLowerBound: string | null;
  targetUpperBound: string | null;
  bidirectional: boolean | null;
  evidenceRelationshipIds: string[];
  owningSideEntityId: string | null;
  owningSideMemberId: string | null;
  inverseSideEntityId: string | null;
  inverseSideMemberId: string | null;
};

export type FullSnapshotRelationship = {
  externalId: string;
  kind: string;
  fromEntityId: string;
  toEntityId: string;
  label: string | null;
  sourceRefs: SnapshotSourceRef[];
  normalizedAssociation?: FullSnapshotNormalizedAssociation | null;
  metadata: Record<string, unknown>;
};

export type FullSnapshotEntityAssociationRelationship = {
  relationshipId: string;
  canonicalRelationshipId: string | null;
  relationshipKind: string | null;
  relationshipType: string | null;
  framework: string | null;
  browserViewKind: string | null;
  architectureViewKinds: string[];
  sourceEntityId: string;
  sourceEntityName: string | null;
  targetEntityId: string;
  targetEntityName: string | null;
  label: string | null;
  associationKind: string | null;
  associationCardinality: string | null;
  sourceLowerBound: string | null;
  sourceUpperBound: string | null;
  targetLowerBound: string | null;
  targetUpperBound: string | null;
  bidirectional: boolean | null;
  owningSideEntityId: string | null;
  owningSideMemberId: string | null;
  inverseSideEntityId: string | null;
  inverseSideMemberId: string | null;
  evidenceRelationshipIds: string[];
  evidenceRelationshipCount: number | null;
  recommendedForArchitectureViews: boolean | null;
  canonicalForEntityViews: boolean | null;
  rawRelationshipEvidenceRetained: boolean | null;
  jpaAssociationHandling: string | null;
};

export type FullSnapshotRelationshipCatalog = {
  id: string;
  title: string | null;
  description: string | null;
  relationshipCatalogKind: string | null;
  browserViewKind: string | null;
  framework: string | null;
  frameworks: string[];
  architectureViewKinds: string[];
  available: boolean | null;
  relationshipCount: number | null;
  associationCardinalities: string[];
  associationKinds: string[];
  recommendedForArchitectureViews: boolean | null;
  canonicalForEntityViews: boolean | null;
  retainsRawRelationshipEvidence: boolean | null;
};

export type FullSnapshotJavaBrowserView = {
  id: string;
  title: string | null;
  description: string | null;
  framework: string | null;
  architectureViewKind: string | null;
  typeDependencyView: string | null;
  moduleDependencyView: string | null;
  relationshipCatalogView: string | null;
  frameworkRelationships: string[];
  available: boolean | null;
  typeDependencyCount: number | null;
  moduleDependencyCount: number | null;
  relationshipCatalogCount: number | null;
  preferredDependencyView: string | null;
  browserViewKind: string | null;
  recommendedForArchitectureViews: boolean | null;
  relationshipKinds: string[];
  availableFrameworks: string[];
  availableArchitectureViewKinds: string[];
};

export type FullSnapshotDependencyViews = {
  entityAssociationRelationships: FullSnapshotEntityAssociationRelationship[];
  relationshipCatalogs: {
    entityAssociations: FullSnapshotRelationshipCatalog | null;
  };
  javaBrowserViews: {
    views: FullSnapshotJavaBrowserView[];
    availableViews: string[];
    defaultViewId: string | null;
  };
};

export type FullSnapshotViewpointAvailability = 'available' | 'partial' | 'unavailable';

export type FullSnapshotViewpoint = {
  id: string;
  title: string;
  description: string;
  availability: FullSnapshotViewpointAvailability;
  confidence: number;
  seedEntityIds: string[];
  seedRoleIds: string[];
  expandViaSemantics: string[];
  preferredDependencyViews: string[];
  evidenceSources: string[];
};

export type FullSnapshotDiagnostic = {
  externalId: string;
  severity: string;
  phase: string | null;
  code: string;
  message: string;
  fatal: boolean;
  filePath: string | null;
  scopeId: string | null;
  entityId: string | null;
  sourceRefs: SnapshotSourceRef[];
  metadata: Record<string, unknown>;
};

export type FullSnapshotPayload = {
  snapshot: SnapshotSummary;
  source: {
    repositoryId: string | null;
    acquisitionType: string | null;
    path: string | null;
    remoteUrl: string | null;
    branch: string | null;
    revision: string | null;
    acquiredAt: string | null;
  };
  run: {
    startedAt: string | null;
    completedAt: string | null;
    outcome: string | null;
    detectedTechnologies: string[];
  };
  completeness: {
    status: string | null;
    indexedFileCount: number;
    totalFileCount: number;
    degradedFileCount: number;
    omittedPaths: string[];
    notes: string[];
  };
  scopes: FullSnapshotScope[];
  entities: FullSnapshotEntity[];
  relationships: FullSnapshotRelationship[];
  dependencyViews?: FullSnapshotDependencyViews | null;
  viewpoints: FullSnapshotViewpoint[];
  diagnostics: FullSnapshotDiagnostic[];
  metadata: {
    metadata: Record<string, unknown>;
  };
  warnings: string[];
};

export type LayoutNode = {
  externalId: string;
  parentScopeId: string | null;
  kind: string;
  name: string;
  displayName: string | null;
  path: string;
  depth: number;
  directChildScopeCount: number;
  directEntityCount: number;
  descendantScopeCount: number;
  descendantEntityCount: number;
  directEntityKinds: KindCount[];
  children: LayoutNode[];
};

export type LayoutTree = {
  snapshot: SnapshotSummary;
  roots: LayoutNode[];
  summary: {
    scopeCount: number;
    entityCount: number;
    relationshipCount: number;
    maxDepth: number;
    scopeKinds: KindCount[];
    entityKinds: KindCount[];
  };
};

export type LayoutEntity = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  origin: string | null;
  scopeId: string | null;
  sourceRefCount: number;
  summary: string | null;
};

export type LayoutScopeDetail = {
  snapshot: SnapshotSummary;
  scope: {
    externalId: string;
    parentScopeId: string | null;
    kind: string;
    name: string;
    displayName: string | null;
    path: string;
    depth: number;
    directChildScopeCount: number;
    directEntityCount: number;
    descendantScopeCount: number;
    descendantEntityCount: number;
    directEntityKinds: KindCount[];
  };
  breadcrumb: Array<{
    externalId: string;
    kind: string;
    name: string;
    displayName: string | null;
    path: string;
  }>;
  childScopes: LayoutNode[];
  entities: LayoutEntity[];
  entityKinds: KindCount[];
};
