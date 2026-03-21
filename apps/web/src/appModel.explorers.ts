import type { KindCount, SnapshotSummary } from './appModel.api';

export type DependencyDirection = "ALL" | "INBOUND" | "OUTBOUND";

export type DependencyEntity = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  origin: string | null;
  scopeId: string | null;
  scopePath: string;
  inScope: boolean;
  sourceRefCount: number;
  summary: string | null;
  inboundCount: number;
  outboundCount: number;
};

export type DependencyRelationship = {
  externalId: string;
  kind: string;
  label: string;
  summary: string | null;
  fromEntityId: string;
  fromDisplayName: string;
  fromKind: string;
  fromScopePath: string;
  fromInScope: boolean;
  toEntityId: string;
  toDisplayName: string;
  toKind: string;
  toScopePath: string;
  toInScope: boolean;
  directionCategory: string;
  crossesScopeBoundary: boolean;
};

export type DependencyView = {
  snapshot: SnapshotSummary;
  scope: {
    externalId: string | null;
    kind: string;
    name: string;
    displayName: string;
    path: string;
    repositoryWide: boolean;
  };
  direction: DependencyDirection;
  relationshipKinds: KindCount[];
  summary: {
    scopeEntityCount: number;
    visibleEntityCount: number;
    visibleRelationshipCount: number;
    internalRelationshipCount: number;
    inboundRelationshipCount: number;
    outboundRelationshipCount: number;
  };
  entities: DependencyEntity[];
  relationships: DependencyRelationship[];
  focus: {
    entity: DependencyEntity;
    inboundRelationshipCount: number;
    outboundRelationshipCount: number;
    inboundRelationships: DependencyRelationship[];
    outboundRelationships: DependencyRelationship[];
  } | null;
};

export type EntryCategory = "ALL" | "ENTRY_POINT" | "DATA" | "INTEGRATION";

export type EntryPointItem = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  origin: string | null;
  scopeId: string | null;
  scopePath: string;
  inScope: boolean;
  sourceRefCount: number;
  sourcePath: string | null;
  sourceSnippet: string | null;
  summary: string | null;
  inboundRelationshipCount: number;
  outboundRelationshipCount: number;
  relatedKinds: KindCount[];
};

export type EntryPointRelationship = {
  externalId: string;
  kind: string;
  label: string;
  summary: string | null;
  direction: string;
  otherEntityId: string;
  otherDisplayName: string;
  otherKind: string;
  otherScopePath: string;
};

export type EntryPointView = {
  snapshot: SnapshotSummary;
  scope: {
    externalId: string | null;
    kind: string;
    name: string;
    displayName: string;
    path: string;
    repositoryWide: boolean;
  };
  category: EntryCategory;
  summary: {
    totalRelevantItemCount: number;
    visibleItemCount: number;
    entryPointCount: number;
    dataCount: number;
    integrationCount: number;
    relationshipCount: number;
  };
  visibleKinds: KindCount[];
  items: EntryPointItem[];
  focus: {
    item: EntryPointItem;
    inboundRelationships: EntryPointRelationship[];
    outboundRelationships: EntryPointRelationship[];
  } | null;
};

export type SearchResult = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  origin: string | null;
  scopeId: string | null;
  scopePath: string;
  sourcePath: string | null;
  sourceSnippet: string | null;
  sourceRefCount: number;
  summary: string | null;
  inboundRelationshipCount: number;
  outboundRelationshipCount: number;
  matchReasons: string[];
};

export type SearchView = {
  snapshot: SnapshotSummary;
  query: string;
  scope: {
    externalId: string | null;
    kind: string;
    name: string;
    displayName: string;
    path: string;
    repositoryWide: boolean;
  };
  summary: {
    searchableEntityCount: number;
    visibleResultCount: number;
    totalMatchCount: number;
    limit: number;
    queryBlank: boolean;
  };
  visibleKinds: KindCount[];
  results: SearchResult[];
};

export type EntityDetailRelationship = {
  externalId: string;
  kind: string;
  label: string | null;
  summary: string | null;
  direction: string;
  otherEntityId: string;
  otherDisplayName: string;
  otherKind: string;
  otherScopePath: string;
};

export type EntitySourceRef = {
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  snippet: string | null;
  metadataJson: string | null;
};

export type EntityDetail = {
  snapshot: SnapshotSummary;
  entity: {
    externalId: string;
    kind: string;
    name: string;
    displayName: string | null;
    origin: string | null;
    scopeId: string | null;
    scopePath: string;
    sourceRefCount: number;
    summary: string | null;
    inboundRelationshipCount: number;
    outboundRelationshipCount: number;
  };
  scope: {
    externalId: string | null;
    kind: string;
    name: string;
    displayName: string;
    path: string;
    repositoryWide: boolean;
  };
  relatedKinds: KindCount[];
  sourceRefs: EntitySourceRef[];
  inboundRelationships: EntityDetailRelationship[];
  outboundRelationships: EntityDetailRelationship[];
  metadataJson: string | null;
};
