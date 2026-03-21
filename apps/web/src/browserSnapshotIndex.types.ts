import type {
  FullSnapshotDiagnostic,
  FullSnapshotEntity,
  FullSnapshotPayload,
  FullSnapshotRelationship,
  FullSnapshotScope,
  FullSnapshotViewpoint,
  SnapshotSourceRef,
} from './appModel';

export type BrowserNodeKind = 'scope' | 'entity';
export type BrowserSearchResultKind = BrowserNodeKind | 'relationship' | 'diagnostic';
export type BrowserDependencyDirection = 'ALL' | 'INBOUND' | 'OUTBOUND';
export type BrowserTreeMode = 'filesystem' | 'package' | 'advanced';
export type BrowserViewpointScopeMode = 'selected-scope' | 'selected-subtree' | 'whole-snapshot';
export type BrowserViewpointVariant = 'default' | 'show-writers' | 'show-readers' | 'show-upstream-callers' | 'show-entity-relations';

export type BrowserScopeTreeNode = {
  scopeId: string;
  parentScopeId: string | null;
  name: string;
  displayName: string;
  kind: string;
  depth: number;
  path: string;
  childScopeIds: string[];
  directEntityIds: string[];
  descendantScopeCount: number;
  descendantEntityCount: number;
};

export type BrowserSearchResult = {
  kind: BrowserSearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  scopeId: string | null;
  score: number;
};

export type BrowserDependencyEdge = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  kind: string;
  label: string | null;
};

export type BrowserDependencyNeighborhood = {
  focusEntity: FullSnapshotEntity;
  inboundEntityIds: string[];
  outboundEntityIds: string[];
  relatedEntityIds: string[];
  edges: BrowserDependencyEdge[];
};

export type BrowserResolvedViewpointGraph = {
  viewpoint: FullSnapshotViewpoint;
  scopeMode: BrowserViewpointScopeMode;
  selectedScopeId: string | null;
  seedEntityIds: string[];
  entityIds: string[];
  relationshipIds: string[];
  preferredDependencyViews: string[];
  recommendedLayout: 'generic' | 'request-flow' | 'api-surface' | 'persistence-model' | 'integration-map' | 'module-dependencies' | 'ui-navigation' | 'persistence-writers' | 'persistence-readers' | 'upstream-callers';
  variant?: BrowserViewpointVariant;
};

export type BrowserScopeFacts = {
  scope: FullSnapshotScope;
  path: string;
  childScopeIds: string[];
  entityIds: string[];
  descendantScopeCount: number;
  descendantEntityCount: number;
  diagnostics: FullSnapshotDiagnostic[];
  sourceRefs: SnapshotSourceRef[];
};

export type BrowserEntityFacts = {
  entity: FullSnapshotEntity;
  scope: FullSnapshotScope | null;
  path: string | null;
  inboundRelationships: FullSnapshotRelationship[];
  outboundRelationships: FullSnapshotRelationship[];
  diagnostics: FullSnapshotDiagnostic[];
  sourceRefs: SnapshotSourceRef[];
};

export type BrowserSearchDocument = {
  kind: BrowserSearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  scopeId: string | null;
  normalizedText: string;
};

export type BrowserSnapshotIndex = {
  snapshotId: string;
  builtAt: string;
  payload: FullSnapshotPayload;
  viewpointsById: Map<string, FullSnapshotViewpoint>;
  entityIdsByArchitecturalRole: Map<string, string[]>;
  relationshipIdsByArchitecturalSemantic: Map<string, string[]>;
  scopesById: Map<string, FullSnapshotScope>;
  entitiesById: Map<string, FullSnapshotEntity>;
  relationshipsById: Map<string, FullSnapshotRelationship>;
  diagnosticsById: Map<string, FullSnapshotDiagnostic>;
  childScopeIdsByParentId: Map<string | null, string[]>;
  entityIdsByScopeId: Map<string | null, string[]>;
  subtreeEntityIdsByScopeId: Map<string, string[]>;
  containingScopeIdsByEntityId: Map<string, string[]>;
  containedEntityIdsByEntityId: Map<string, string[]>;
  containerEntityIdsByEntityId: Map<string, string[]>;
  inboundRelationshipIdsByEntityId: Map<string, string[]>;
  outboundRelationshipIdsByEntityId: Map<string, string[]>;
  diagnosticIdsByScopeId: Map<string, string[]>;
  diagnosticIdsByEntityId: Map<string, string[]>;
  scopePathById: Map<string, string>;
  descendantStatsByScopeId: Map<string, { scopeCount: number; entityCount: number }>;
  scopeNodesByParentId: Map<string | null, BrowserScopeTreeNode[]>;
  scopeTree: BrowserScopeTreeNode[];
  searchableDocuments: BrowserSearchDocument[];
};
