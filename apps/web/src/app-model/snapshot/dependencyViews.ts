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
