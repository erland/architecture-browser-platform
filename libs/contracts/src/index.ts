export type RunOutcome = "SUCCESS" | "PARTIAL" | "FAILED";
export type ScopeKind = "REPOSITORY" | "MODULE" | "PACKAGE" | "COMPONENT" | "DIRECTORY" | "FILE";
export type EntityKind =
  | "CLASS"
  | "INTERFACE"
  | "FUNCTION"
  | "FIELD"
  | "MODULE"
  | "ENDPOINT"
  | "SERVICE"
  | "PERSISTENCE_ADAPTER"
  | "UI_MODULE"
  | "STARTUP_POINT"
  | "DATASTORE"
  | "EXTERNAL_SYSTEM"
  | "CONFIG_ARTIFACT";
export type EntityOrigin = "OBSERVED" | "INFERRED";
export type RelationshipKind = "DEPENDS_ON" | "EXTENDS" | "IMPLEMENTS" | "EXPOSES" | "CALLS" | "READS" | "WRITES" | "CONTAINS" | "USES";
export type DiagnosticSeverity = "INFO" | "WARNING" | "ERROR";
export type DiagnosticPhase = "ACQUISITION" | "SCAN" | "EXTRACTION" | "INTERPRETATION" | "PUBLICATION";
export type CompletenessStatus = "COMPLETE" | "PARTIAL" | "FAILED";

export type JsonObject = Record<string, unknown>;

export const PLATFORM_IMPORT_VERSION = "2026-04-jpa-normalized-associations-step1" as const;
export const SUPPORTED_INDEXER_SCHEMA_VERSIONS = ["1.0.0", "1.3.0", "1.4.0"] as const;

export interface SourceReference {
  path: string;
  startLine: number | null;
  endLine: number | null;
  snippet: string | null;
  metadata: JsonObject;
}

export interface RunMetadata {
  startedAt: string;
  completedAt: string;
  outcome: RunOutcome;
  detectedTechnologies: string[];
  metadata: JsonObject;
}

export interface RepositorySource {
  repositoryId: string;
  acquisitionType: string;
  path: string | null;
  remoteUrl: string | null;
  branch: string | null;
  revision: string | null;
  acquiredAt: string;
  metadata: JsonObject;
}

export interface LogicalScope {
  id: string;
  kind: ScopeKind;
  name: string;
  displayName: string;
  parentScopeId: string | null;
  sourceRefs: SourceReference[];
  metadata: JsonObject;
}

export interface ArchitectureEntity {
  id: string;
  kind: EntityKind;
  origin: EntityOrigin;
  name: string;
  displayName: string;
  scopeId: string;
  sourceRefs: SourceReference[];
  metadata: JsonObject;
}

export interface ArchitectureRelationship {
  id: string;
  kind: RelationshipKind;
  fromEntityId: string;
  toEntityId: string;
  label: string | null;
  sourceRefs: SourceReference[];
  normalizedAssociation?: NormalizedAssociation | null;
  metadata: JsonObject;
}

export interface NormalizedAssociation {
  associationKind?: string;
  associationCardinality?: string;
  sourceLowerBound?: string;
  sourceUpperBound?: string;
  targetLowerBound?: string;
  targetUpperBound?: string;
  bidirectional?: boolean;
  evidenceRelationshipIds?: string[];
  owningSideEntityId?: string;
  owningSideMemberId?: string;
  inverseSideEntityId?: string;
  inverseSideMemberId?: string;
}

export interface EntityAssociationRelationshipCatalogEntry {
  relationshipId: string;
  canonicalRelationshipId?: string | null;
  relationshipKind?: string | null;
  relationshipType?: string | null;
  framework?: string | null;
  browserViewKind?: string | null;
  architectureViewKinds?: string[];
  sourceEntityId: string;
  sourceEntityName?: string | null;
  targetEntityId: string;
  targetEntityName?: string | null;
  label?: string | null;
  associationKind?: string | null;
  associationCardinality?: string | null;
  sourceLowerBound?: string | null;
  sourceUpperBound?: string | null;
  targetLowerBound?: string | null;
  targetUpperBound?: string | null;
  bidirectional?: boolean | null;
  owningSideEntityId?: string | null;
  owningSideMemberId?: string | null;
  inverseSideEntityId?: string | null;
  inverseSideMemberId?: string | null;
  evidenceRelationshipIds?: string[];
  evidenceRelationshipCount?: number | null;
  recommendedForArchitectureViews?: boolean | null;
  canonicalForEntityViews?: boolean | null;
  rawRelationshipEvidenceRetained?: boolean | null;
  jpaAssociationHandling?: string | null;
}

export interface RelationshipCatalogDescriptor {
  id: string;
  title?: string | null;
  description?: string | null;
  relationshipCatalogKind?: string | null;
  browserViewKind?: string | null;
  framework?: string | null;
  frameworks?: string[];
  architectureViewKinds?: string[];
  available?: boolean | null;
  relationshipCount?: number | null;
  associationCardinalities?: string[];
  associationKinds?: string[];
  recommendedForArchitectureViews?: boolean | null;
  canonicalForEntityViews?: boolean | null;
  retainsRawRelationshipEvidence?: boolean | null;
}

export interface JavaBrowserViewDescriptor {
  id: string;
  title?: string | null;
  description?: string | null;
  framework?: string | null;
  architectureViewKind?: string | null;
  typeDependencyView?: string | null;
  moduleDependencyView?: string | null;
  relationshipCatalogView?: string | null;
  frameworkRelationships?: string[];
  available?: boolean | null;
  typeDependencyCount?: number | null;
  moduleDependencyCount?: number | null;
  relationshipCatalogCount?: number | null;
  preferredDependencyView?: string | null;
  browserViewKind?: string | null;
  recommendedForArchitectureViews?: boolean | null;
  relationshipKinds?: string[];
  availableFrameworks?: string[];
  availableArchitectureViewKinds?: string[];
}

export interface DependencyViews {
  entityAssociationRelationships?: EntityAssociationRelationshipCatalogEntry[];
  relationshipCatalogs?: {
    entityAssociations?: RelationshipCatalogDescriptor | null;
  };
  javaBrowserViews?: {
    views?: JavaBrowserViewDescriptor[];
    availableViews?: string[];
    defaultViewId?: string | null;
  };
}

export type ViewpointAvailability = "available" | "partial" | "unavailable";

export interface ArchitectureViewpoint {
  id: string;
  title: string;
  description: string;
  availability: ViewpointAvailability;
  confidence: number;
  seedEntityIds?: string[];
  seedRoleIds?: string[];
  expandViaSemantics?: string[];
  preferredDependencyViews?: string[];
  evidenceSources?: string[];
}

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  phase: DiagnosticPhase;
  code: string;
  message: string;
  fatal: boolean;
  filePath: string | null;
  scopeId: string | null;
  entityId: string | null;
  sourceRefs: SourceReference[];
  metadata: JsonObject;
}

export interface CompletenessMetadata {
  status: CompletenessStatus;
  indexedFileCount: number;
  totalFileCount: number;
  degradedFileCount: number;
  omittedPaths: string[];
  notes: string[];
}

export interface ArchitectureIndexDocument {
  schemaVersion: string;
  indexerVersion: string;
  runMetadata: RunMetadata;
  source: RepositorySource;
  scopes: LogicalScope[];
  entities: ArchitectureEntity[];
  relationships: ArchitectureRelationship[];
  dependencyViews?: DependencyViews | null;
  viewpoints?: ArchitectureViewpoint[];
  diagnostics: Diagnostic[];
  completeness: CompletenessMetadata;
  metadata: JsonObject;
}

export type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
export type RepositorySourceType = "LOCAL_PATH" | "GIT";
export type RepositoryStatus = "ACTIVE" | "ARCHIVED";
export type PlatformRunStatus = "REQUESTED" | "RUNNING" | "IMPORTING" | "COMPLETED" | "FAILED" | "CANCELED";
export type TriggerType = "MANUAL" | "SCHEDULED" | "IMPORT_ONLY" | "SYSTEM";
export type SnapshotStatus = "DRAFT" | "READY" | "FAILED";
export type OverlayKind = "TAG_SET" | "HEATMAP" | "ANNOTATION" | "HIGHLIGHT";
export type AuditActorType = "USER" | "SYSTEM" | "API_CLIENT";
export type ImportedFactType = "SCOPE" | "ENTITY" | "RELATIONSHIP" | "DIAGNOSTIC";

export interface WorkspaceRecord {
  id: string;
  workspaceKey: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryRegistrationRecord {
  id: string;
  workspaceId: string;
  repositoryKey: string;
  name: string;
  sourceType: RepositorySourceType;
  localPath: string | null;
  remoteUrl: string | null;
  defaultBranch: string | null;
  status: RepositoryStatus;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndexRunRecord {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  triggerType: TriggerType;
  status: PlatformRunStatus;
  outcome: RunOutcome | null;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  schemaVersion: string | null;
  indexerVersion: string | null;
  errorSummary: string | null;
  metadataJson: string;
}

export interface SnapshotRecord {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  runId: string | null;
  snapshotKey: string;
  status: SnapshotStatus;
  completenessStatus: CompletenessStatus;
  schemaVersion: string;
  indexerVersion: string;
  sourceRepositoryId: string | null;
  sourceRevision: string | null;
  sourceBranch: string | null;
  importedAt: string;
  scopeCount: number;
  entityCount: number;
  relationshipCount: number;
  diagnosticCount: number;
  indexedFileCount: number;
  totalFileCount: number;
  degradedFileCount: number;
  rawPayloadJson: string;
  metadataJson: string;
}

export interface ImportedFactRecord {
  id: string;
  snapshotId: string;
  factType: ImportedFactType;
  externalId: string;
  factKind: string;
  name: string;
  displayName: string | null;
  scopeExternalId: string | null;
  fromExternalId: string | null;
  toExternalId: string | null;
  summary: string | null;
  payloadJson: string;
}

export interface OverlayRecord {
  id: string;
  workspaceId: string;
  snapshotId: string | null;
  kind: OverlayKind;
  name: string;
  definitionJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedViewRecord {
  id: string;
  workspaceId: string;
  snapshotId: string | null;
  name: string;
  viewType: string;
  queryJson: string | null;
  layoutJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEventRecord {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string | null;
  runId: string | null;
  snapshotId: string | null;
  eventType: string;
  actorType: AuditActorType;
  actorId: string | null;
  happenedAt: string;
  detailsJson: string;
}

export interface FullSnapshotSourceRef {
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  snippet: string | null;
  metadata: JsonObject;
}

export interface FullSnapshotScope {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  parentScopeId: string | null;
  sourceRefs: FullSnapshotSourceRef[];
  metadata: JsonObject;
}

export interface FullSnapshotEntity {
  externalId: string;
  kind: string;
  origin: string | null;
  name: string;
  displayName: string | null;
  scopeId: string | null;
  sourceRefs: FullSnapshotSourceRef[];
  metadata: JsonObject;
}

export interface FullSnapshotRelationship {
  externalId: string;
  kind: string;
  fromEntityId: string;
  toEntityId: string;
  label: string | null;
  sourceRefs: FullSnapshotSourceRef[];
  metadata: JsonObject;
}

export interface FullSnapshotDiagnostic {
  externalId: string;
  severity: string;
  phase: string | null;
  code: string;
  message: string;
  fatal: boolean;
  filePath: string | null;
  scopeId: string | null;
  entityId: string | null;
  sourceRefs: FullSnapshotSourceRef[];
  metadata: JsonObject;
}

export interface FullSnapshotViewpoint {
  id: string;
  title: string;
  description: string;
  availability: ViewpointAvailability;
  confidence: number;
  seedEntityIds: string[];
  seedRoleIds: string[];
  expandViaSemantics: string[];
  preferredDependencyViews: string[];
  evidenceSources: string[];
}

export interface FullSnapshotPayload {
  snapshot: {
    id: string;
    workspaceId: string;
    repositoryRegistrationId: string;
    repositoryKey: string | null;
    repositoryName: string | null;
    runId: string | null;
    snapshotKey: string;
    status: SnapshotStatus;
    completenessStatus: CompletenessStatus;
    derivedRunOutcome: RunOutcome;
    schemaVersion: string;
    indexerVersion: string;
    sourceRevision: string | null;
    sourceBranch: string | null;
    importedAt: string;
    scopeCount: number;
    entityCount: number;
    relationshipCount: number;
    diagnosticCount: number;
    indexedFileCount: number;
    totalFileCount: number;
    degradedFileCount: number;
  };
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
  viewpoints: FullSnapshotViewpoint[];
  diagnostics: FullSnapshotDiagnostic[];
  metadata: {
    metadata: JsonObject;
  };
  warnings: string[];
}
