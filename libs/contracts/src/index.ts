export type RunOutcome = "SUCCESS" | "PARTIAL" | "FAILED";
export type ScopeKind = "REPOSITORY" | "MODULE" | "PACKAGE" | "COMPONENT" | "DIRECTORY" | "FILE";
export type EntityKind =
  | "CLASS"
  | "INTERFACE"
  | "FUNCTION"
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
export type RelationshipKind = "DEPENDS_ON" | "EXPOSES" | "CALLS" | "READS" | "WRITES" | "CONTAINS" | "USES";
export type DiagnosticSeverity = "INFO" | "WARNING" | "ERROR";
export type DiagnosticPhase = "ACQUISITION" | "SCAN" | "EXTRACTION" | "INTERPRETATION" | "PUBLICATION";
export type CompletenessStatus = "COMPLETE" | "PARTIAL" | "FAILED";

export type JsonObject = Record<string, unknown>;

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
  metadata: JsonObject;
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
  diagnostics: Diagnostic[];
  completeness: CompletenessMetadata;
  metadata: JsonObject;
}
