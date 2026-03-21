import type { FullSnapshotDiagnostic, FullSnapshotRelationship, SnapshotSourceRef } from '../appModel';
import type { BrowserEntityFacts, BrowserScopeFacts } from '../browserSnapshotIndex';

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
