import type { SnapshotSummary } from './appModel.api';

export type OverlayKind = "TAG_SET" | "HEATMAP" | "ANNOTATION" | "HIGHLIGHT";

export type OverlayRecord = {
  id: string;
  workspaceId: string;
  snapshotId: string | null;
  name: string;
  kind: OverlayKind;
  targetEntityCount: number;
  targetScopeCount: number;
  note: string | null;
  definitionJson: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedViewRecord = {
  id: string;
  workspaceId: string;
  snapshotId: string | null;
  name: string;
  viewType: string;
  queryJson: string | null;
  layoutJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomizationOverview = {
  snapshot: SnapshotSummary;
  overlays: OverlayRecord[];
  savedViews: SavedViewRecord[];
};

export type ComparisonScopeChange = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string;
  path: string;
};

export type ComparisonEntityChange = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string;
  scopePath: string;
};

export type ComparisonRelationshipChange = {
  externalId: string;
  kind: string;
  label: string;
  fromEntityId: string;
  fromDisplayName: string;
  fromScopePath: string;
  toEntityId: string;
  toDisplayName: string;
  toScopePath: string;
};

export type SnapshotComparison = {
  baseSnapshot: SnapshotSummary;
  targetSnapshot: SnapshotSummary;
  summary: {
    addedScopeCount: number;
    removedScopeCount: number;
    addedEntityCount: number;
    removedEntityCount: number;
    addedRelationshipCount: number;
    removedRelationshipCount: number;
    addedEntryPointCount: number;
    removedEntryPointCount: number;
    changedIntegrationAndPersistenceCount: number;
  };
  addedScopes: ComparisonScopeChange[];
  removedScopes: ComparisonScopeChange[];
  addedEntities: ComparisonEntityChange[];
  removedEntities: ComparisonEntityChange[];
  addedEntryPoints: ComparisonEntityChange[];
  removedEntryPoints: ComparisonEntityChange[];
  changedIntegrationAndPersistence: ComparisonEntityChange[];
  addedDependencies: ComparisonRelationshipChange[];
  removedDependencies: ComparisonRelationshipChange[];
};
