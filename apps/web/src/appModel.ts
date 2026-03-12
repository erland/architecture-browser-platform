export type ApiHealth = {
  status: string;
  service: string;
  version: string;
  time: string;
};

export type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
export type RepositoryStatus = "ACTIVE" | "ARCHIVED";
export type RepositorySourceType = "LOCAL_PATH" | "GIT";
export type TriggerType = "MANUAL" | "SCHEDULED" | "IMPORT_ONLY" | "SYSTEM";
export type RunStatus = "REQUESTED" | "RUNNING" | "IMPORTING" | "COMPLETED" | "FAILED" | "CANCELED";
export type RunOutcome = "SUCCESS" | "PARTIAL" | "FAILED" | null;
export type StubRunResult = "SUCCESS" | "FAILURE";
export type SnapshotStatus = "READY" | "FAILED";
export type CompletenessStatus = "COMPLETE" | "PARTIAL" | "FAILED";

export type Workspace = {
  id: string;
  workspaceKey: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  repositoryCount: number;
};

export type Repository = {
  id: string;
  workspaceId: string;
  repositoryKey: string;
  name: string;
  sourceType: RepositorySourceType;
  localPath: string | null;
  remoteUrl: string | null;
  defaultBranch: string | null;
  status: RepositoryStatus;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditEvent = {
  id: string;
  eventType: string;
  actorType: string;
  actorId: string | null;
  happenedAt: string;
  detailsJson: string | null;
  repositoryRegistrationId: string | null;
  runId: string | null;
};

export type RunRecord = {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  triggerType: TriggerType;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  schemaVersion: string | null;
  indexerVersion: string | null;
  errorSummary: string | null;
  metadataJson: string | null;
};

export type SnapshotSummary = {
  id: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  runId: string | null;
  snapshotKey: string;
  status: SnapshotStatus;
  completenessStatus: CompletenessStatus;
  derivedRunOutcome: Exclude<RunOutcome, null>;
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

export type KindCount = { key: string; count: number };
export type NameCount = { externalId: string; name: string; count: number };
export type DiagnosticSummary = {
  externalId: string;
  code: string;
  severity: string;
  message: string;
  filePath: string | null;
  entityId: string | null;
  scopeId: string | null;
};

export type SnapshotOverview = {
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
    status: string;
    indexedFileCount: number;
    totalFileCount: number;
    degradedFileCount: number;
    omittedPaths: string[];
    notes: string[];
  };
  scopeKinds: KindCount[];
  entityKinds: KindCount[];
  relationshipKinds: KindCount[];
  diagnosticCodes: KindCount[];
  topScopes: NameCount[];
  recentDiagnostics: DiagnosticSummary[];
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



export type OperationsRepositoryRow = {
  id: string;
  repositoryKey: string;
  name: string;
  status: RepositoryStatus;
  snapshotCount: number;
  runCount: number;
  latestSnapshotId: string | null;
  latestSnapshotImportedAt: string | null;
  latestRunId: string | null;
  latestRunStatus: RunStatus | null;
  latestRunOutcome: RunOutcome;
  latestRunRequestedAt: string | null;
};

export type OperationsRunRow = {
  id: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  completedAt: string | null;
  errorSummary: string | null;
  retainedBySnapshot: boolean;
};

export type OperationsDiagnostic = {
  externalId: string;
  severity: string | null;
  phase: string | null;
  code: string;
  message: string;
  fatal: boolean;
  filePath: string | null;
  entityId: string | null;
  scopeId: string | null;
};

export type FailedSnapshotRow = {
  id: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  snapshotKey: string;
  status: SnapshotStatus;
  completenessStatus: string;
  importedAt: string;
  diagnosticCount: number;
  diagnostics: OperationsDiagnostic[];
  warnings: string[];
};

export type RetentionDefaults = {
  keepSnapshotsPerRepository: number;
  keepRunsPerRepository: number;
};

export type RetentionSnapshotCandidate = {
  snapshotId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  snapshotKey: string;
  importedAt: string;
  entityCount: number;
  relationshipCount: number;
  diagnosticCount: number;
};

export type RetentionRunCandidate = {
  runId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  status: RunStatus;
  outcome: RunOutcome;
  requestedAt: string;
  retainedBySnapshot: boolean;
  errorSummary: string | null;
};

export type RetentionPreview = {
  workspaceId: string;
  keepSnapshotsPerRepository: number;
  keepRunsPerRepository: number;
  snapshotDeleteCount: number;
  runDeleteCount: number;
  snapshotsToDelete: RetentionSnapshotCandidate[];
  runsToDelete: RetentionRunCandidate[];
  generatedAt: string;
  dryRun: boolean;
};

export type OperationsOverview = {
  workspaceId: string;
  health: ApiHealth;
  summary: {
    repositoryCount: number;
    activeRepositoryCount: number;
    runCount: number;
    failedRunCount: number;
    snapshotCount: number;
    failedSnapshotCount: number;
    auditEventCount: number;
  };
  repositories: OperationsRepositoryRow[];
  recentRuns: OperationsRunRow[];
  failedRuns: OperationsRunRow[];
  failedSnapshots: FailedSnapshotRow[];
  retentionDefaults: RetentionDefaults;
  generatedAt: string;
};

export const initialOperationsOverview: OperationsOverview | null = null;
export const initialRetentionPreview: RetentionPreview | null = null;

export const initialHealth: ApiHealth = {
  status: "unknown",
  service: "architecture-browser-platform-api",
  version: "0.1.0",
  time: "",
};

export const emptyWorkspaceForm = {
  workspaceKey: "",
  name: "",
  description: "",
};

export const emptyRepositoryForm = {
  repositoryKey: "",
  name: "",
  sourceType: "LOCAL_PATH" as RepositorySourceType,
  localPath: "",
  remoteUrl: "",
  defaultBranch: "main",
  metadataJson: "",
};

export const initialRunRequest = {
  triggerType: "MANUAL" as TriggerType,
  requestedSchemaVersion: "indexer-ir-v1",
  requestedIndexerVersion: "step4-stub",
  metadataJson: '{"requestedBy":"web-ui"}',
  requestedResult: "SUCCESS" as StubRunResult,
};

export function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

export function summarizeCounts(items: KindCount[]) {
  return items.slice(0, 4).map((item) => `${item.key} (${item.count})`).join(", ") || "—";
}

export function containsScope(nodes: LayoutNode[], scopeId: string): boolean {
  return nodes.some((node) => node.externalId === scopeId || containsScope(node.children, scopeId));
}

export function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  for (const node of nodes) {
    result.push(node, ...flattenLayout(node.children));
  }
  return result;
}

