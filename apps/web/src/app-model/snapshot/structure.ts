import type { SnapshotSourceRef } from './shared';

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
