import { FormEvent, useEffect, useMemo, useState } from "react";
import { summarizeDependencyKinds, toDependencyEntityOptions } from "./dependencyViewModel";
import { summarizeEntryKinds, toEntryPointItemOptions } from "./entryPointViewModel";

type ApiHealth = {
  status: string;
  service: string;
  version: string;
  time: string;
};

type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
type RepositoryStatus = "ACTIVE" | "ARCHIVED";
type RepositorySourceType = "LOCAL_PATH" | "GIT";
type TriggerType = "MANUAL" | "SCHEDULED" | "IMPORT_ONLY" | "SYSTEM";
type RunStatus = "REQUESTED" | "RUNNING" | "IMPORTING" | "COMPLETED" | "FAILED" | "CANCELED";
type RunOutcome = "SUCCESS" | "PARTIAL" | "FAILED" | null;
type StubRunResult = "SUCCESS" | "FAILURE";
type SnapshotStatus = "READY" | "FAILED";
type CompletenessStatus = "COMPLETE" | "PARTIAL" | "FAILED";

type Workspace = {
  id: string;
  workspaceKey: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  repositoryCount: number;
};

type Repository = {
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

type AuditEvent = {
  id: string;
  eventType: string;
  actorType: string;
  actorId: string | null;
  happenedAt: string;
  detailsJson: string | null;
  repositoryRegistrationId: string | null;
  runId: string | null;
};

type RunRecord = {
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

type SnapshotSummary = {
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

type KindCount = { key: string; count: number };
type NameCount = { externalId: string; name: string; count: number };
type DiagnosticSummary = {
  externalId: string;
  code: string;
  severity: string;
  message: string;
  filePath: string | null;
  entityId: string | null;
  scopeId: string | null;
};

type SnapshotOverview = {
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

type LayoutNode = {
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

type LayoutTree = {
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

type LayoutEntity = {
  externalId: string;
  kind: string;
  name: string;
  displayName: string | null;
  origin: string | null;
  scopeId: string | null;
  sourceRefCount: number;
  summary: string | null;
};

type LayoutScopeDetail = {
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

type DependencyDirection = "ALL" | "INBOUND" | "OUTBOUND";

type DependencyEntity = {
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

type DependencyRelationship = {
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

type DependencyView = {
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


type EntryCategory = "ALL" | "ENTRY_POINT" | "DATA" | "INTEGRATION";

type EntryPointItem = {
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

type EntryPointRelationship = {
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

type EntryPointView = {
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

type ApiError = {
  code: string;
  message: string;
  details: string[];
};

const initialHealth: ApiHealth = {
  status: "unknown",
  service: "architecture-browser-platform-api",
  version: "0.1.0",
  time: "",
};

const emptyWorkspaceForm = {
  workspaceKey: "",
  name: "",
  description: "",
};

const emptyRepositoryForm = {
  repositoryKey: "",
  name: "",
  sourceType: "LOCAL_PATH" as RepositorySourceType,
  localPath: "",
  remoteUrl: "",
  defaultBranch: "main",
  metadataJson: "",
};

const initialRunRequest = {
  triggerType: "MANUAL" as TriggerType,
  requestedSchemaVersion: "indexer-ir-v1",
  requestedIndexerVersion: "step4-stub",
  metadataJson: '{"requestedBy":"web-ui"}',
  requestedResult: "SUCCESS" as StubRunResult,
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    const details = payload?.details?.length ? ` ${payload.details.join(" ")}` : "";
    throw new Error(`${payload?.message ?? `Request failed with status ${response.status}`}.${details}`.trim());
  }

  return (await response.json()) as T;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function summarizeCounts(items: KindCount[]) {
  return items.slice(0, 4).map((item) => `${item.key} (${item.count})`).join(", ") || "—";
}

function containsScope(nodes: LayoutNode[], scopeId: string): boolean {
  return nodes.some((node) => node.externalId === scopeId || containsScope(node.children, scopeId));
}

function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  for (const node of nodes) {
    result.push(node, ...flattenLayout(node.children));
  }
  return result;
}

export function App() {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [snapshotOverview, setSnapshotOverview] = useState<SnapshotOverview | null>(null);
  const [layoutTree, setLayoutTree] = useState<LayoutTree | null>(null);
  const [selectedLayoutScopeId, setSelectedLayoutScopeId] = useState<string | null>(null);
  const [layoutScopeDetail, setLayoutScopeDetail] = useState<LayoutScopeDetail | null>(null);
  const [dependencyView, setDependencyView] = useState<DependencyView | null>(null);
  const [selectedDependencyScopeId, setSelectedDependencyScopeId] = useState<string>("");
  const [dependencyDirection, setDependencyDirection] = useState<DependencyDirection>("ALL");
  const [focusedDependencyEntityId, setFocusedDependencyEntityId] = useState<string>("");
  const [entryPointView, setEntryPointView] = useState<EntryPointView | null>(null);
  const [selectedEntryPointScopeId, setSelectedEntryPointScopeId] = useState<string>("");
  const [entryCategory, setEntryCategory] = useState<EntryCategory>("ALL");
  const [focusedEntryPointId, setFocusedEntryPointId] = useState<string>("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceForm, setWorkspaceForm] = useState(emptyWorkspaceForm);
  const [repositoryForm, setRepositoryForm] = useState(emptyRepositoryForm);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceEditor, setWorkspaceEditor] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [repositoryEditor, setRepositoryEditor] = useState<{ id: string | null; name: string; localPath: string; remoteUrl: string; defaultBranch: string; metadataJson: string }>({
    id: null,
    name: "",
    localPath: "",
    remoteUrl: "",
    defaultBranch: "main",
    metadataJson: "",
  });
  const [runRequestForm, setRunRequestForm] = useState(initialRunRequest);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const flattenedLayoutNodes = useMemo(() => flattenLayout(layoutTree?.roots ?? []), [layoutTree]);

  const dependencyEntityOptions = useMemo(() => toDependencyEntityOptions(dependencyView?.entities ?? []), [dependencyView]);
  const entryPointOptions = useMemo(() => toEntryPointItemOptions(entryPointView?.items ?? []), [entryPointView]);

  const latestRunByRepository = useMemo(() => {
    const result = new Map<string, RunRecord>();
    for (const run of recentRuns) {
      if (!result.has(run.repositoryRegistrationId)) {
        result.set(run.repositoryRegistrationId, run);
      }
    }
    return result;
  }, [recentRuns]);

  useEffect(() => {
    void loadHealth();
    void loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      setWorkspaceEditor({
        name: selectedWorkspace.name,
        description: selectedWorkspace.description ?? "",
      });
      void loadWorkspaceDetail(selectedWorkspace.id);
    } else {
      setRepositories([]);
      setAuditEvents([]);
      setRecentRuns([]);
      setSnapshots([]);
      setSelectedSnapshotId(null);
      setSnapshotOverview(null);
      setLayoutTree(null);
      setSelectedLayoutScopeId(null);
      setLayoutScopeDetail(null);
      setDependencyView(null);
      setSelectedDependencyScopeId("");
      setDependencyDirection("ALL");
      setFocusedDependencyEntityId("");
      setEntryPointView(null);
      setSelectedEntryPointScopeId("");
      setEntryCategory("ALL");
      setFocusedEntryPointId("");
      setWorkspaceEditor({ name: "", description: "" });
      setRepositoryEditor({ id: null, name: "", localPath: "", remoteUrl: "", defaultBranch: "main", metadataJson: "" });
    }
  }, [selectedWorkspaceId, selectedWorkspace]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadSnapshotOverview(selectedWorkspaceId, selectedSnapshotId);
      void loadLayoutTree(selectedWorkspaceId, selectedSnapshotId);
    } else {
      setSnapshotOverview(null);
      setLayoutTree(null);
      setSelectedLayoutScopeId(null);
      setLayoutScopeDetail(null);
      setDependencyView(null);
      setSelectedDependencyScopeId("");
      setFocusedDependencyEntityId("");
      setEntryPointView(null);
      setSelectedEntryPointScopeId("");
      setFocusedEntryPointId("");
    }
  }, [selectedWorkspaceId, selectedSnapshotId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && selectedLayoutScopeId) {
      void loadLayoutScopeDetail(selectedWorkspaceId, selectedSnapshotId, selectedLayoutScopeId);
    } else {
      setLayoutScopeDetail(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedLayoutScopeId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadDependencyView(selectedWorkspaceId, selectedSnapshotId, selectedDependencyScopeId || undefined, dependencyDirection, focusedDependencyEntityId || undefined);
    } else {
      setDependencyView(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedDependencyScopeId, dependencyDirection, focusedDependencyEntityId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId) {
      void loadEntryPointView(selectedWorkspaceId, selectedSnapshotId, selectedEntryPointScopeId || undefined, entryCategory, focusedEntryPointId || undefined);
    } else {
      setEntryPointView(null);
    }
  }, [selectedWorkspaceId, selectedSnapshotId, selectedEntryPointScopeId, entryCategory, focusedEntryPointId]);

  async function loadHealth() {
    try {
      const payload = await fetchJson<ApiHealth>("/api/health", { method: "GET" });
      setHealth(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadWorkspaces() {
    try {
      const payload = await fetchJson<Workspace[]>("/api/workspaces", { method: "GET" });
      setWorkspaces(payload);
      setSelectedWorkspaceId((current) => {
        if (current && payload.some((item) => item.id === current)) {
          return current;
        }
        return payload[0]?.id ?? null;
      });
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadWorkspaceDetail(workspaceId: string) {
    try {
      const [repositoryPayload, auditPayload, runPayload, snapshotPayload] = await Promise.all([
        fetchJson<Repository[]>(`/api/workspaces/${workspaceId}/repositories`, { method: "GET" }),
        fetchJson<AuditEvent[]>(`/api/workspaces/${workspaceId}/audit-events`, { method: "GET" }),
        fetchJson<RunRecord[]>(`/api/workspaces/${workspaceId}/runs/recent`, { method: "GET" }),
        fetchJson<SnapshotSummary[]>(`/api/workspaces/${workspaceId}/snapshots`, { method: "GET" }),
      ]);
      setRepositories(repositoryPayload);
      setAuditEvents(auditPayload);
      setRecentRuns(runPayload);
      setSnapshots(snapshotPayload);
      setSelectedSnapshotId((current) => current && snapshotPayload.some((item) => item.id === current) ? current : (snapshotPayload[0]?.id ?? null));
      setRepositoryEditor((current) => current.id ? current : {
        id: null,
        name: "",
        localPath: "",
        remoteUrl: "",
        defaultBranch: "main",
        metadataJson: "",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadSnapshotOverview(workspaceId: string, snapshotId: string) {
    try {
      const payload = await fetchJson<SnapshotOverview>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/overview`, { method: "GET" });
      setSnapshotOverview(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadLayoutTree(workspaceId: string, snapshotId: string) {
    try {
      const payload = await fetchJson<LayoutTree>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/layout/tree`, { method: "GET" });
      setLayoutTree(payload);
      const firstScope = payload.roots[0]?.externalId ?? null;
      setSelectedLayoutScopeId((current) => current && containsScope(payload.roots, current) ? current : firstScope);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadLayoutScopeDetail(workspaceId: string, snapshotId: string, scopeId: string) {
    try {
      const payload = await fetchJson<LayoutScopeDetail>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/layout/scopes/${encodeURIComponent(scopeId)}`, { method: "GET" });
      setLayoutScopeDetail(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadDependencyView(workspaceId: string, snapshotId: string, scopeId?: string, direction: DependencyDirection = "ALL", focusEntityId?: string) {
    try {
      const params = new URLSearchParams();
      if (scopeId) {
        params.set("scopeId", scopeId);
      }
      if (focusEntityId) {
        params.set("focusEntityId", focusEntityId);
      }
      params.set("direction", direction);
      const query = params.toString();
      const payload = await fetchJson<DependencyView>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/dependencies${query ? `?${query}` : ""}`, { method: "GET" });
      setDependencyView(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function loadEntryPointView(workspaceId: string, snapshotId: string, scopeId?: string, category: EntryCategory = "ALL", focusEntityId?: string) {
    try {
      const params = new URLSearchParams();
      if (scopeId) {
        params.set("scopeId", scopeId);
      }
      if (focusEntityId) {
        params.set("focusEntityId", focusEntityId);
      }
      params.set("category", category);
      const query = params.toString();
      const payload = await fetchJson<EntryPointView>(`/api/workspaces/${workspaceId}/snapshots/${snapshotId}/entry-points${query ? `?${query}` : ""}`, { method: "GET" });
      setEntryPointView(payload);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function handleCreateWorkspace(event: FormEvent) {
    event.preventDefault();
    setBusyMessage("Creating workspace…");
    try {
      const created = await fetchJson<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(workspaceForm),
      });
      setWorkspaceForm(emptyWorkspaceForm);
      await loadWorkspaces();
      setSelectedWorkspaceId(created.id);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Updating workspace…");
    try {
      const updated = await fetchJson<Workspace>(`/api/workspaces/${selectedWorkspaceId}`, {
        method: "PUT",
        body: JSON.stringify(workspaceEditor),
      });
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
      await loadWorkspaceDetail(selectedWorkspaceId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveWorkspace() {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Archiving workspace…");
    try {
      const updated = await fetchJson<Workspace>(`/api/workspaces/${selectedWorkspaceId}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleCreateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Creating repository registration…");
    try {
      await fetchJson<Repository>(`/api/workspaces/${selectedWorkspaceId}/repositories`, {
        method: "POST",
        body: JSON.stringify(repositoryForm),
      });
      setRepositoryForm(emptyRepositoryForm);
      await loadWorkspaces();
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateRepository(event: FormEvent) {
    event.preventDefault();
    if (!selectedWorkspaceId || !repositoryEditor.id) {
      return;
    }
    setBusyMessage("Updating repository registration…");
    try {
      await fetchJson<Repository>(`/api/workspaces/${selectedWorkspaceId}/repositories/${repositoryEditor.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: repositoryEditor.name,
          localPath: repositoryEditor.localPath,
          remoteUrl: repositoryEditor.remoteUrl,
          defaultBranch: repositoryEditor.defaultBranch,
          metadataJson: repositoryEditor.metadataJson,
        }),
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleArchiveRepository(repositoryId: string) {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage("Archiving repository registration…");
    try {
      await fetchJson<Repository>(`/api/workspaces/${selectedWorkspaceId}/repositories/${repositoryId}/archive`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      await loadWorkspaces();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleRequestRun(repository: Repository, requestedResult: StubRunResult) {
    if (!selectedWorkspaceId) {
      return;
    }
    setBusyMessage(`Requesting ${requestedResult.toLowerCase()} run for ${repository.name}…`);
    try {
      await fetchJson<RunRecord>(`/api/workspaces/${selectedWorkspaceId}/repositories/${repository.id}/runs`, {
        method: "POST",
        body: JSON.stringify({
          ...runRequestForm,
          requestedResult,
        }),
      });
      await loadWorkspaceDetail(selectedWorkspaceId);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyMessage(null);
    }
  }

  function selectRepositoryForEdit(repository: Repository) {
    setRepositoryEditor({
      id: repository.id,
      name: repository.name,
      localPath: repository.localPath ?? "",
      remoteUrl: repository.remoteUrl ?? "",
      defaultBranch: repository.defaultBranch ?? "",
      metadataJson: repository.metadataJson ?? "",
    });
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Architecture browser workspace</h1>
        <p className="lead">
          Step 9 extends the snapshot browser with entry-point and data/integration views so architects can inspect endpoints, startup points, data stores, channels,
          and external systems with scope filters, detail panels, and cross-links back to owners and source context.
        </p>
      </section>

      <section className="grid grid--top">
        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div><dt>Status</dt><dd>{health.status}</dd></div>
            <div><dt>Service</dt><dd>{health.service}</dd></div>
            <div><dt>Version</dt><dd>{health.version}</dd></div>
            <div><dt>Time</dt><dd>{health.time || "—"}</dd></div>
          </dl>
          {busyMessage ? <p className="notice">{busyMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <h2>Create workspace</h2>
          <form className="form" onSubmit={handleCreateWorkspace}>
            <label>
              <span>Workspace key</span>
              <input value={workspaceForm.workspaceKey} onChange={(event) => setWorkspaceForm((current) => ({ ...current, workspaceKey: event.target.value }))} placeholder="customs-core" />
            </label>
            <label>
              <span>Name</span>
              <input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Swedish Customs Core" />
            </label>
            <label>
              <span>Description</span>
              <textarea value={workspaceForm.description} onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Architecture review workspace for initial MVP repositories." />
            </label>
            <button type="submit">Create workspace</button>
          </form>
        </article>
      </section>

      <section className="workspace-layout">
        <article className="card sidebar">
          <div className="section-heading">
            <h2>Workspaces</h2>
            <span className="badge">{workspaces.length}</span>
          </div>
          <div className="stack">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className={`list-item ${workspace.id === selectedWorkspaceId ? "list-item--active" : ""}`}
                onClick={() => setSelectedWorkspaceId(workspace.id)}
              >
                <strong>{workspace.name}</strong>
                <span>{workspace.workspaceKey}</span>
                <span>{workspace.status} · {workspace.repositoryCount} repos</span>
              </button>
            ))}
            {!workspaces.length ? <p className="muted">No workspaces created yet.</p> : null}
          </div>
        </article>

        <div className="content-stack">
          <article className="card">
            <div className="section-heading">
              <h2>Selected workspace</h2>
              {selectedWorkspace ? <span className="badge badge--status">{selectedWorkspace.status}</span> : null}
            </div>
            {selectedWorkspace ? (
              <form className="form" onSubmit={handleUpdateWorkspace}>
                <label>
                  <span>Name</span>
                  <input value={workspaceEditor.name} onChange={(event) => setWorkspaceEditor((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  <span>Description</span>
                  <textarea value={workspaceEditor.description} onChange={(event) => setWorkspaceEditor((current) => ({ ...current, description: event.target.value }))} />
                </label>
                <div className="actions">
                  <button type="submit">Save workspace</button>
                  <button type="button" className="button-secondary" onClick={() => void handleArchiveWorkspace()}>Archive workspace</button>
                </div>
              </form>
            ) : (
              <p className="muted">Select a workspace to manage repositories, runs, snapshots, and audit history.</p>
            )}
          </article>

          <article className="card">
            <div className="section-heading">
              <h2>Repository registrations</h2>
              <span className="badge">{repositories.length}</span>
            </div>
            {selectedWorkspace ? (
              <>
                <div className="split-grid">
                  <form className="form" onSubmit={handleCreateRepository}>
                    <h3>Create</h3>
                    <label><span>Repository key</span><input value={repositoryForm.repositoryKey} onChange={(event) => setRepositoryForm((current) => ({ ...current, repositoryKey: event.target.value }))} placeholder="backend-api" /></label>
                    <label><span>Name</span><input value={repositoryForm.name} onChange={(event) => setRepositoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Backend API" /></label>
                    <label>
                      <span>Source type</span>
                      <select value={repositoryForm.sourceType} onChange={(event) => setRepositoryForm((current) => ({ ...current, sourceType: event.target.value as RepositorySourceType }))}>
                        <option value="LOCAL_PATH">LOCAL_PATH</option>
                        <option value="GIT">GIT</option>
                      </select>
                    </label>
                    <label><span>Local path</span><input value={repositoryForm.localPath} onChange={(event) => setRepositoryForm((current) => ({ ...current, localPath: event.target.value }))} placeholder="/repos/backend-api" /></label>
                    <label><span>Remote URL</span><input value={repositoryForm.remoteUrl} onChange={(event) => setRepositoryForm((current) => ({ ...current, remoteUrl: event.target.value }))} placeholder="https://github.com/erland/backend-api" /></label>
                    <label><span>Default branch</span><input value={repositoryForm.defaultBranch} onChange={(event) => setRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))} /></label>
                    <label><span>Metadata JSON</span><textarea value={repositoryForm.metadataJson} onChange={(event) => setRepositoryForm((current) => ({ ...current, metadataJson: event.target.value }))} placeholder='{"owner":"architecture"}' /></label>
                    <button type="submit">Create repository</button>
                  </form>

                  <form className="form" onSubmit={handleUpdateRepository}>
                    <h3>Edit selected</h3>
                    {repositoryEditor.id ? (
                      <>
                        <label><span>Name</span><input value={repositoryEditor.name} onChange={(event) => setRepositoryEditor((current) => ({ ...current, name: event.target.value }))} /></label>
                        <label><span>Local path</span><input value={repositoryEditor.localPath} onChange={(event) => setRepositoryEditor((current) => ({ ...current, localPath: event.target.value }))} /></label>
                        <label><span>Remote URL</span><input value={repositoryEditor.remoteUrl} onChange={(event) => setRepositoryEditor((current) => ({ ...current, remoteUrl: event.target.value }))} /></label>
                        <label><span>Default branch</span><input value={repositoryEditor.defaultBranch} onChange={(event) => setRepositoryEditor((current) => ({ ...current, defaultBranch: event.target.value }))} /></label>
                        <label><span>Metadata JSON</span><textarea value={repositoryEditor.metadataJson} onChange={(event) => setRepositoryEditor((current) => ({ ...current, metadataJson: event.target.value }))} /></label>
                        <button type="submit">Save repository</button>
                      </>
                    ) : <p className="muted">Pick a repository from the list below to edit it.</p>}
                  </form>
                </div>

                <div className="card card--nested">
                  <div className="section-heading">
                    <h3>Stub run request defaults</h3>
                    <span className="badge">Step 4</span>
                  </div>
                  <div className="split-grid split-grid--compact">
                    <label><span>Trigger type</span><select value={runRequestForm.triggerType} onChange={(event) => setRunRequestForm((current) => ({ ...current, triggerType: event.target.value as TriggerType }))}><option value="MANUAL">MANUAL</option><option value="SCHEDULED">SCHEDULED</option><option value="IMPORT_ONLY">IMPORT_ONLY</option><option value="SYSTEM">SYSTEM</option></select></label>
                    <label><span>Schema version</span><input value={runRequestForm.requestedSchemaVersion} onChange={(event) => setRunRequestForm((current) => ({ ...current, requestedSchemaVersion: event.target.value }))} /></label>
                    <label><span>Indexer version</span><input value={runRequestForm.requestedIndexerVersion} onChange={(event) => setRunRequestForm((current) => ({ ...current, requestedIndexerVersion: event.target.value }))} /></label>
                    <label><span>Metadata JSON</span><textarea value={runRequestForm.metadataJson} onChange={(event) => setRunRequestForm((current) => ({ ...current, metadataJson: event.target.value }))} /></label>
                  </div>
                </div>
              </>
            ) : <p className="muted">Select a workspace to manage repository registrations.</p>}

            <div className="table-list">
              {repositories.map((repository) => {
                const latestRun = latestRunByRepository.get(repository.id);
                return (
                  <div key={repository.id} className="table-row table-row--stacked">
                    <div>
                      <strong>{repository.name}</strong>
                      <p>{repository.repositoryKey} · {repository.sourceType} · {repository.status}</p>
                      {latestRun ? <p>Latest run: {latestRun.status}{latestRun.outcome ? ` · ${latestRun.outcome}` : ""}{latestRun.completedAt ? ` · ${formatDateTime(latestRun.completedAt)}` : ""}</p> : <p>No runs requested yet.</p>}
                    </div>
                    <div className="actions actions--inline actions--wrap">
                      <button type="button" className="button-secondary" onClick={() => selectRepositoryForEdit(repository)}>Edit</button>
                      <button type="button" className="button-secondary" onClick={() => void handleRequestRun(repository, "SUCCESS")}>Run success</button>
                      <button type="button" className="button-secondary" onClick={() => void handleRequestRun(repository, "FAILURE")}>Run failure</button>
                      <button type="button" className="button-secondary" onClick={() => void handleArchiveRepository(repository.id)}>Archive</button>
                    </div>
                  </div>
                );
              })}
              {!repositories.length && selectedWorkspace ? <p className="muted">No repositories registered yet.</p> : null}
            </div>
          </article>

          <article className="card">
            <div className="section-heading">
              <h2>Snapshot catalog</h2>
              <span className="badge">{snapshots.length}</span>
            </div>
            {selectedWorkspace ? (
              <div className="split-grid split-grid--wide">
                <div className="stack stack--compact">
                  {snapshots.map((snapshot) => (
                    <button key={snapshot.id} type="button" className={`list-item ${snapshot.id === selectedSnapshotId ? "list-item--active" : ""}`} onClick={() => setSelectedSnapshotId(snapshot.id)}>
                      <strong>{snapshot.repositoryName ?? snapshot.repositoryKey ?? snapshot.repositoryRegistrationId}</strong>
                      <span>{snapshot.snapshotKey}</span>
                      <span>{snapshot.completenessStatus} · {snapshot.importedAt ? formatDateTime(snapshot.importedAt) : "—"}</span>
                      <span>{snapshot.entityCount} entities · {snapshot.relationshipCount} relationships · {snapshot.diagnosticCount} diagnostics</span>
                    </button>
                  ))}
                  {!snapshots.length ? <p className="muted">No snapshots imported yet.</p> : null}
                </div>

                <div className="stack stack--compact">
                  {selectedSnapshot && snapshotOverview ? (
                    <>
                      <div className="card card--nested">
                        <div className="section-heading">
                          <h3>Overview</h3>
                          <span className={`badge ${selectedSnapshot.completenessStatus === "PARTIAL" ? "badge--warning" : "badge--status"}`}>{selectedSnapshot.completenessStatus}</span>
                        </div>
                        <dl className="kv kv--compact">
                          <div><dt>Repository</dt><dd>{selectedSnapshot.repositoryName ?? selectedSnapshot.repositoryKey ?? "—"}</dd></div>
                          <div><dt>Imported</dt><dd>{formatDateTime(selectedSnapshot.importedAt)}</dd></div>
                          <div><dt>Revision</dt><dd>{snapshotOverview.source.revision ?? "—"}</dd></div>
                          <div><dt>Branch</dt><dd>{snapshotOverview.source.branch ?? "—"}</dd></div>
                          <div><dt>Schema / Indexer</dt><dd>{selectedSnapshot.schemaVersion} / {selectedSnapshot.indexerVersion}</dd></div>
                          <div><dt>Run outcome</dt><dd>{selectedSnapshot.derivedRunOutcome}</dd></div>
                          <div><dt>Technologies</dt><dd>{snapshotOverview.run.detectedTechnologies.join(", ") || "—"}</dd></div>
                          <div><dt>Files</dt><dd>{snapshotOverview.completeness.indexedFileCount}/{snapshotOverview.completeness.totalFileCount} indexed · {snapshotOverview.completeness.degradedFileCount} degraded</dd></div>
                        </dl>
                        {snapshotOverview.warnings.length ? (
                          <div className="stack stack--compact top-gap">
                            {snapshotOverview.warnings.map((warning) => <p key={warning} className="warning">{warning}</p>)}
                          </div>
                        ) : null}
                      </div>

                      <div className="split-grid split-grid--compact">
                        <div className="card card--nested"><h3>Scope kinds</h3><p>{summarizeCounts(snapshotOverview.scopeKinds)}</p></div>
                        <div className="card card--nested"><h3>Entity kinds</h3><p>{summarizeCounts(snapshotOverview.entityKinds)}</p></div>
                        <div className="card card--nested"><h3>Relationship kinds</h3><p>{summarizeCounts(snapshotOverview.relationshipKinds)}</p></div>
                        <div className="card card--nested"><h3>Diagnostics</h3><p>{summarizeCounts(snapshotOverview.diagnosticCodes)}</p></div>
                      </div>

                      <div className="card card--nested">
                        <div className="section-heading"><h3>Top scopes</h3><span className="badge">{snapshotOverview.topScopes.length}</span></div>
                        <div className="stack stack--compact">
                          {snapshotOverview.topScopes.map((scope) => <div key={scope.externalId} className="summary-row"><strong>{scope.name}</strong><span>{scope.count} facts</span></div>)}
                          {!snapshotOverview.topScopes.length ? <p className="muted">No scope breakdown available.</p> : null}
                        </div>
                      </div>

                      <div className="card card--nested">
                        <div className="section-heading"><h3>Layout explorer</h3><span className="badge">Step 7</span></div>
                        {layoutTree ? (
                          <div className="split-grid split-grid--wide">
                            <div className="stack stack--compact">
                              <div className="card card--nested">
                                <h4>Tree</h4>
                                <div className="stack stack--compact">
                                  {flattenedLayoutNodes.map((node) => (
                                    <button
                                      key={node.externalId}
                                      type="button"
                                      className={`list-item ${node.externalId === selectedLayoutScopeId ? "list-item--active" : ""}`}
                                      style={{ paddingLeft: `${12 + node.depth * 16}px` }}
                                      onClick={() => setSelectedLayoutScopeId(node.externalId)}
                                    >
                                      <strong>{node.displayName ?? node.name}</strong>
                                      <span>{node.kind} · {node.directChildScopeCount} child scopes · {node.directEntityCount} direct entities</span>
                                      <span>{node.descendantScopeCount} nested scopes · {node.descendantEntityCount} entities in subtree</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="split-grid split-grid--compact">
                                <div className="card card--nested"><h4>Scope kinds</h4><p>{summarizeCounts(layoutTree.summary.scopeKinds)}</p></div>
                                <div className="card card--nested"><h4>Entity kinds</h4><p>{summarizeCounts(layoutTree.summary.entityKinds)}</p></div>
                              </div>
                            </div>

                            <div className="stack stack--compact">
                              {layoutScopeDetail ? (
                                <>
                                  <div className="card card--nested">
                                    <div className="section-heading">
                                      <h4>{layoutScopeDetail.scope.displayName ?? layoutScopeDetail.scope.name}</h4>
                                      <span className="badge">{layoutScopeDetail.scope.kind}</span>
                                    </div>
                                    <dl className="kv kv--compact">
                                      <div><dt>Path</dt><dd>{layoutScopeDetail.scope.path}</dd></div>
                                      <div><dt>Depth</dt><dd>{layoutScopeDetail.scope.depth}</dd></div>
                                      <div><dt>Direct child scopes</dt><dd>{layoutScopeDetail.scope.directChildScopeCount}</dd></div>
                                      <div><dt>Direct entities</dt><dd>{layoutScopeDetail.scope.directEntityCount}</dd></div>
                                      <div><dt>Nested scopes</dt><dd>{layoutScopeDetail.scope.descendantScopeCount}</dd></div>
                                      <div><dt>Entities in subtree</dt><dd>{layoutScopeDetail.scope.descendantEntityCount}</dd></div>
                                    </dl>
                                    <p className="muted top-gap">{layoutScopeDetail.breadcrumb.map((item) => item.displayName ?? item.name).join(" / ")}</p>
                                  </div>

                                  <div className="split-grid split-grid--compact">
                                    <div className="card card--nested"><h4>Direct entity badges</h4><p>{summarizeCounts(layoutScopeDetail.entityKinds)}</p></div>
                                    <div className="card card--nested"><h4>Child scopes</h4><p>{layoutScopeDetail.childScopes.length || "—"}</p></div>
                                  </div>

                                  <div className="card card--nested">
                                    <div className="section-heading"><h4>Child scopes</h4><span className="badge">{layoutScopeDetail.childScopes.length}</span></div>
                                    <div className="stack stack--compact">
                                      {layoutScopeDetail.childScopes.map((scope) => (
                                        <button key={scope.externalId} type="button" className="list-item" onClick={() => setSelectedLayoutScopeId(scope.externalId)}>
                                          <strong>{scope.displayName ?? scope.name}</strong>
                                          <span>{scope.kind} · {scope.directChildScopeCount} child scopes · {scope.directEntityCount} direct entities</span>
                                        </button>
                                      ))}
                                      {!layoutScopeDetail.childScopes.length ? <p className="muted">No lower-level scopes under this node.</p> : null}
                                    </div>
                                  </div>

                                  <div className="card card--nested">
                                    <div className="section-heading"><h4>Direct entities</h4><span className="badge">{layoutScopeDetail.entities.length}</span></div>
                                    <div className="stack stack--compact">
                                      {layoutScopeDetail.entities.map((entity) => (
                                        <div key={entity.externalId} className="run-item">
                                          <strong>{entity.displayName ?? entity.name}</strong>
                                          <span>{entity.kind}{entity.origin ? ` · ${entity.origin}` : ""}</span>
                                          <span>{entity.sourceRefCount} source references</span>
                                          <span>{entity.summary ?? "—"}</span>
                                        </div>
                                      ))}
                                      {!layoutScopeDetail.entities.length ? <p className="muted">No direct entities under this scope.</p> : null}
                                    </div>
                                  </div>
                                </>
                              ) : <p className="muted">Select a scope to inspect its drill-down view.</p>}
                            </div>
                          </div>
                        ) : <p className="muted">Layout explorer will appear when a snapshot is available.</p>}
                      </div>

                      <div className="card card--nested">
                        <div className="section-heading"><h3>Dependency and relationship view</h3><span className="badge">Step 8</span></div>
                        <div className="split-grid split-grid--compact">
                          <label>
                            <span>Scope focus</span>
                            <select value={selectedDependencyScopeId} onChange={(event) => { setSelectedDependencyScopeId(event.target.value); setFocusedDependencyEntityId(""); }}>
                              <option value="">All scopes</option>
                              {flattenedLayoutNodes.map((node) => (
                                <option key={node.externalId} value={node.externalId}>
                                  {`${" ".repeat(node.depth * 2)}${node.displayName ?? node.name}`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>Direction</span>
                            <select value={dependencyDirection} onChange={(event) => setDependencyDirection(event.target.value as DependencyDirection)}>
                              <option value="ALL">All</option>
                              <option value="INBOUND">Inbound</option>
                              <option value="OUTBOUND">Outbound</option>
                            </select>
                          </label>
                          <label>
                            <span>Entity focus</span>
                            <select value={focusedDependencyEntityId} onChange={(event) => setFocusedDependencyEntityId(event.target.value)}>
                              <option value="">No focused entity</option>
                              {dependencyEntityOptions.map((entity) => (
                                <option key={entity.externalId} value={entity.externalId}>
                                  {entity.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {dependencyView ? (
                          <div className="stack stack--compact">
                            <div className="split-grid split-grid--compact">
                              <div className="card card--nested"><h4>Scope entities</h4><p>{dependencyView.summary.scopeEntityCount}</p></div>
                              <div className="card card--nested"><h4>Visible entities</h4><p>{dependencyView.summary.visibleEntityCount}</p></div>
                              <div className="card card--nested"><h4>Relationships</h4><p>{dependencyView.summary.visibleRelationshipCount}</p></div>
                              <div className="card card--nested"><h4>Kinds</h4><p>{summarizeDependencyKinds(dependencyView.relationships)}</p></div>
                            </div>

                            <div className="split-grid split-grid--compact">
                              <div className="card card--nested"><h4>Internal</h4><p>{dependencyView.summary.internalRelationshipCount}</p></div>
                              <div className="card card--nested"><h4>Inbound</h4><p>{dependencyView.summary.inboundRelationshipCount}</p></div>
                              <div className="card card--nested"><h4>Outbound</h4><p>{dependencyView.summary.outboundRelationshipCount}</p></div>
                              <div className="card card--nested"><h4>Scope</h4><p>{dependencyView.scope.path}</p></div>
                            </div>

                            {dependencyView.focus ? (
                              <div className="card card--nested">
                                <div className="section-heading">
                                  <h4>Focused entity</h4>
                                  <span className="badge">{dependencyView.focus.entity.kind}</span>
                                </div>
                                <p><strong>{dependencyView.focus.entity.displayName ?? dependencyView.focus.entity.name}</strong></p>
                                <p className="muted">{dependencyView.focus.entity.scopePath}</p>
                                <p>{dependencyView.focus.inboundRelationshipCount} inbound · {dependencyView.focus.outboundRelationshipCount} outbound</p>
                              </div>
                            ) : null}

                            <div className="card card--nested">
                              <div className="section-heading"><h4>Visible entities</h4><span className="badge">{dependencyView.entities.length}</span></div>
                              <div className="stack stack--compact">
                                {dependencyView.entities.map((entity) => (
                                  <button key={entity.externalId} type="button" className={`list-item ${entity.externalId === focusedDependencyEntityId ? "list-item--active" : ""}`} onClick={() => setFocusedDependencyEntityId((current) => current === entity.externalId ? "" : entity.externalId)}>
                                    <strong>{entity.displayName ?? entity.name}</strong>
                                    <span>{entity.kind} · {entity.inScope ? "in scope" : "external neighbor"}</span>
                                    <span>{entity.inboundCount} inbound · {entity.outboundCount} outbound</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="card card--nested">
                              <div className="section-heading"><h4>Relationship graph</h4><span className="badge">{dependencyView.relationships.length}</span></div>
                              <div className="stack stack--compact">
                                {dependencyView.relationships.map((relationship) => (
                                  <div key={relationship.externalId} className="run-item">
                                    <strong>{relationship.fromDisplayName}</strong>
                                    <span>{relationship.fromKind} · {relationship.fromInScope ? "scope" : "external"}</span>
                                    <span>↓ {relationship.kind} {relationship.crossesScopeBoundary ? "· boundary" : "· internal"}</span>
                                    <strong>{relationship.toDisplayName}</strong>
                                    <span>{relationship.toKind} · {relationship.toInScope ? "scope" : "external"}</span>
                                    <span>{relationship.fromScopePath} → {relationship.toScopePath}</span>
                                  </div>
                                ))}
                                {!dependencyView.relationships.length ? <p className="muted">No relationships match the current filter.</p> : null}
                              </div>
                            </div>
                          </div>
                        ) : <p className="muted">Dependency view will appear when a snapshot is available.</p>}
                      </div>


                      <div className="card card--nested">
                        <div className="section-heading"><h3>Entry points and data/integration surfaces</h3><span className="badge">Step 9</span></div>
                        <div className="split-grid split-grid--compact">
                          <label>
                            <span>Scope filter</span>
                            <select value={selectedEntryPointScopeId} onChange={(event) => setSelectedEntryPointScopeId(event.target.value)}>
                              <option value="">Repository-wide</option>
                              {flattenedLayoutNodes.map((node) => (
                                <option key={node.externalId} value={node.externalId}>
                                  {`${"  ".repeat(node.depth)}${node.displayName ?? node.name}`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>Category</span>
                            <select value={entryCategory} onChange={(event) => setEntryCategory(event.target.value as EntryCategory)}>
                              <option value="ALL">All</option>
                              <option value="ENTRY_POINT">Entry points</option>
                              <option value="DATA">Data stores/adapters</option>
                              <option value="INTEGRATION">Channels/external systems</option>
                            </select>
                          </label>
                          <label>
                            <span>Detail focus</span>
                            <select value={focusedEntryPointId} onChange={(event) => setFocusedEntryPointId(event.target.value)}>
                              <option value="">No focused item</option>
                              {entryPointOptions.map((item) => (
                                <option key={item.externalId} value={item.externalId}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {entryPointView ? (
                          <div className="stack stack--compact">
                            <div className="split-grid split-grid--compact">
                              <div className="card card--nested"><h4>Visible items</h4><p>{entryPointView.summary.visibleItemCount}</p></div>
                              <div className="card card--nested"><h4>Entry points</h4><p>{entryPointView.summary.entryPointCount}</p></div>
                              <div className="card card--nested"><h4>Data</h4><p>{entryPointView.summary.dataCount}</p></div>
                              <div className="card card--nested"><h4>Integrations</h4><p>{entryPointView.summary.integrationCount}</p></div>
                            </div>
                            <div className="split-grid split-grid--compact">
                              <div className="card card--nested"><h4>Relevant inventory</h4><p>{entryPointView.summary.totalRelevantItemCount}</p></div>
                              <div className="card card--nested"><h4>Linked relationships</h4><p>{entryPointView.summary.relationshipCount}</p></div>
                              <div className="card card--nested"><h4>Visible kinds</h4><p>{summarizeEntryKinds(entryPointView.items)}</p></div>
                              <div className="card card--nested"><h4>Scope</h4><p>{entryPointView.scope.path}</p></div>
                            </div>

                            {entryPointView.focus ? (
                              <div className="card card--nested">
                                <div className="section-heading">
                                  <h4>Focused detail</h4>
                                  <span className="badge">{entryPointView.focus.item.kind}</span>
                                </div>
                                <p><strong>{entryPointView.focus.item.displayName ?? entryPointView.focus.item.name}</strong></p>
                                <p className="muted">{entryPointView.focus.item.scopePath}</p>
                                <p>{entryPointView.focus.item.inboundRelationshipCount} inbound · {entryPointView.focus.item.outboundRelationshipCount} outbound · {entryPointView.focus.item.sourceRefCount} source refs</p>
                                <p>{entryPointView.focus.item.sourcePath ?? "No source path"}</p>
                                {entryPointView.focus.item.sourceSnippet ? <code>{entryPointView.focus.item.sourceSnippet}</code> : null}
                              </div>
                            ) : null}

                            <div className="card card--nested">
                              <div className="section-heading"><h4>Visible items</h4><span className="badge">{entryPointView.items.length}</span></div>
                              <div className="stack stack--compact">
                                {entryPointView.items.map((item) => (
                                  <button key={item.externalId} type="button" className={`list-item ${item.externalId === focusedEntryPointId ? "list-item--active" : ""}`} onClick={() => setFocusedEntryPointId((current) => current === item.externalId ? "" : item.externalId)}>
                                    <strong>{item.displayName ?? item.name}</strong>
                                    <span>{item.kind} · {item.scopePath}</span>
                                    <span>{item.inboundRelationshipCount} inbound · {item.outboundRelationshipCount} outbound · {summarizeCounts(item.relatedKinds)}</span>
                                  </button>
                                ))}
                                {!entryPointView.items.length ? <p className="muted">No items match the current filter.</p> : null}
                              </div>
                            </div>

                            {entryPointView.focus ? (
                              <div className="split-grid split-grid--compact">
                                <div className="card card--nested">
                                  <div className="section-heading"><h4>Inbound relationships</h4><span className="badge">{entryPointView.focus.inboundRelationships.length}</span></div>
                                  <div className="stack stack--compact">
                                    {entryPointView.focus.inboundRelationships.map((relationship) => (
                                      <div key={relationship.externalId} className="audit-item">
                                        <strong>{relationship.otherDisplayName}</strong>
                                        <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                                        <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="card card--nested">
                                  <div className="section-heading"><h4>Outbound relationships</h4><span className="badge">{entryPointView.focus.outboundRelationships.length}</span></div>
                                  <div className="stack stack--compact">
                                    {entryPointView.focus.outboundRelationships.map((relationship) => (
                                      <div key={relationship.externalId} className="audit-item">
                                        <strong>{relationship.otherDisplayName}</strong>
                                        <span>{relationship.otherKind} · {relationship.otherScopePath}</span>
                                        <span>{relationship.kind}{relationship.label ? ` · ${relationship.label}` : ""}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : <p className="muted">Entry-point and integration view will appear when a snapshot is available.</p>}
                      </div>

                      <div className="card card--nested">
                        <div className="section-heading"><h3>Recent diagnostics</h3><span className="badge">{snapshotOverview.recentDiagnostics.length}</span></div>
                        <div className="stack stack--compact">
                          {snapshotOverview.recentDiagnostics.map((diagnostic) => (
                            <div key={diagnostic.externalId} className="audit-item">
                              <strong>{diagnostic.code}</strong>
                              <span>{diagnostic.severity}</span>
                              <span>{diagnostic.message}</span>
                              <span>{diagnostic.filePath ?? diagnostic.scopeId ?? diagnostic.entityId ?? "—"}</span>
                            </div>
                          ))}
                          {!snapshotOverview.recentDiagnostics.length ? <p className="muted">No diagnostics recorded for this snapshot.</p> : null}
                        </div>
                      </div>
                    </>
                  ) : <p className="muted">Select a snapshot to inspect its overview.</p>}
                </div>
              </div>
            ) : <p className="muted">Select a workspace to browse imported snapshots.</p>}
          </article>

          <article className="card">
            <div className="section-heading"><h2>Current and recent runs</h2><span className="badge">{recentRuns.length}</span></div>
            <div className="stack stack--compact">
              {recentRuns.map((run) => (
                <div key={run.id} className="run-item">
                  <div className="section-heading section-heading--compact">
                    <strong>{run.repositoryName ?? run.repositoryKey ?? run.repositoryRegistrationId}</strong>
                    <span className={`badge ${run.status === "FAILED" ? "badge--danger" : "badge--status"}`}>{run.status}</span>
                  </div>
                  <span>{run.triggerType}{run.outcome ? ` · ${run.outcome}` : ""}</span>
                  <span>Requested {formatDateTime(run.requestedAt)}</span>
                  <span>Started {formatDateTime(run.startedAt)}</span>
                  <span>Completed {formatDateTime(run.completedAt)}</span>
                  <span>Schema {run.schemaVersion ?? "—"} · Indexer {run.indexerVersion ?? "—"}</span>
                  {run.errorSummary ? <code>{run.errorSummary}</code> : null}
                </div>
              ))}
              {!recentRuns.length && selectedWorkspace ? <p className="muted">No runs have been requested yet.</p> : null}
            </div>
          </article>

          <article className="card">
            <div className="section-heading"><h2>Audit trail</h2><span className="badge">{auditEvents.length}</span></div>
            <div className="stack">
              {auditEvents.map((event) => (
                <div key={event.id} className="audit-item">
                  <strong>{event.eventType}</strong>
                  <span>{new Date(event.happenedAt).toLocaleString()}</span>
                  <span>{event.actorType}{event.actorId ? ` · ${event.actorId}` : ""}{event.runId ? ` · run ${event.runId}` : ""}</span>
                  {event.detailsJson ? <code>{event.detailsJson}</code> : null}
                </div>
              ))}
              {!auditEvents.length && selectedWorkspace ? <p className="muted">No audit entries yet.</p> : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
