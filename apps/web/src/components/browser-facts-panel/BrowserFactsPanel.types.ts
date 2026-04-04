import type { FullSnapshotDiagnostic, FullSnapshotRelationship, SnapshotSourceRef } from '../../app-model';
import type { BrowserEntityFacts, BrowserScopeFacts } from '../../browser-snapshot';

export type BrowserFactsPanelScopeSummary = {
  id: string;
  kind: string;
  name: string;
  path: string;
};

export type BrowserFactsPanelEntitySummary = {
  id: string;
  kind: string;
  name: string;
  scopeId: string | null;
};

export type BrowserFactsPanelEntityGroup = {
  kind: string;
  count: number;
  entityIds: string[];
  sampleEntityIds: string[];
};

export type BrowserFactsPanelScopeBridge = {
  parentScope: BrowserFactsPanelScopeSummary | null;
  childScopes: BrowserFactsPanelScopeSummary[];
  primaryEntities: BrowserFactsPanelEntitySummary[];
  directEntities: BrowserFactsPanelEntitySummary[];
  subtreeEntities: BrowserFactsPanelEntitySummary[];
  directEntityGroups: BrowserFactsPanelEntityGroup[];
  subtreeEntityGroups: BrowserFactsPanelEntityGroup[];
};

export type BrowserFactsPanelViewpointExplanation = {
  viewpointId: string;
  title: string;
  description: string;
  availability: string;
  confidenceLabel: string;
  confidenceBand: string;
  variantLabel: string;
  scopeModeLabel: string;
  scopeLabel: string;
  seedRoleIds: string[];
  expandViaSemantics: string[];
  preferredDependencyViews: string[];
  evidenceSources: string[];
  seedEntities: BrowserFactsPanelEntitySummary[];
  entityCount: number;
  relationshipCount: number;
  recommendedLayout: string;
};

export type BrowserFactsPanelRelationshipMetadataEntry = {
  key: string;
  label: string;
  value: string;
};

export type BrowserFactsPanelRelationshipMetadata = {
  normalized: BrowserFactsPanelRelationshipMetadataEntry[];
  evidence: BrowserFactsPanelRelationshipMetadataEntry[];
};

export type BrowserFactsPanelModel = {
  title: string;
  subtitle: string;
  mode: 'overview' | 'scope' | 'entity' | 'relationship';
  badges: string[];
  summary: string[];
  diagnostics: FullSnapshotDiagnostic[];
  sourceRefs: SnapshotSourceRef[];
  relationship: FullSnapshotRelationship | null;
  relationshipMetadata: BrowserFactsPanelRelationshipMetadata | null;
  scopeFacts: BrowserScopeFacts | null;
  entityFacts: BrowserEntityFacts | null;
  scopeBridge: BrowserFactsPanelScopeBridge | null;
  viewpointExplanation: BrowserFactsPanelViewpointExplanation | null;
};


export type BrowserFactsPanelMetric = {
  value: string;
  label: string;
};

export type BrowserFactsPanelActionsModel = {
  addEntityAction: { entityId: string; label: string } | null;
  pinEntityAction: { entityId: string; label: string } | null;
  canIsolateSelection: boolean;
  canRemoveSelection: boolean;
};

export type BrowserFactsPanelHeaderModel = {
  title: string;
  subtitle: string;
  badges: string[];
  summary: string[];
  actions: BrowserFactsPanelActionsModel;
};

export type BrowserFactsPanelViewpointSectionModel = {
  title: string;
  viewpointId: string;
  description: string;
  scopeModeLabel: string;
  scopeLabel: string;
  recommendedLayout: string;
  metrics: BrowserFactsPanelMetric[];
  seedEntities: BrowserFactsPanelEntitySummary[];
  seedRoleIds: string[];
  expandViaSemantics: string[];
  preferredDependencyViews: string[];
  evidenceSources: string[];
};

export type BrowserFactsPanelScopeSectionModel = {
  scopeFacts: BrowserScopeFacts;
  bridge: BrowserFactsPanelScopeBridge;
  summary: string[];
  metrics: BrowserFactsPanelMetric[];
};

export type BrowserFactsPanelEntitySectionModel = {
  entityFacts: BrowserEntityFacts;
  inboundRelationships: FullSnapshotRelationship[];
  outboundRelationships: FullSnapshotRelationship[];
  scopeId: string | null;
  summary: string[];
  metrics: BrowserFactsPanelMetric[];
};

export type BrowserFactsPanelRelationshipConnectedEntity = {
  id: string;
  label: string;
  kind: string;
};

export type BrowserFactsPanelRelationshipSectionModel = {
  relationship: FullSnapshotRelationship;
  connectedEntities: BrowserFactsPanelRelationshipConnectedEntity[];
  metadata: BrowserFactsPanelRelationshipMetadata | null;
};

export type BrowserFactsPanelDiagnosticsSectionModel = {
  diagnostics: FullSnapshotDiagnostic[];
};

export type BrowserFactsPanelSourceRefsSectionModel = {
  sourceRefs: SnapshotSourceRef[];
};

export type BrowserFactsPanelPresentationModel = {
  model: BrowserFactsPanelModel;
  header: BrowserFactsPanelHeaderModel;
  viewpoint: BrowserFactsPanelViewpointSectionModel | null;
  scope: BrowserFactsPanelScopeSectionModel | null;
  entity: BrowserFactsPanelEntitySectionModel | null;
  relationship: BrowserFactsPanelRelationshipSectionModel | null;
  diagnostics: BrowserFactsPanelDiagnosticsSectionModel;
  sourceRefs: BrowserFactsPanelSourceRefsSectionModel;
};
