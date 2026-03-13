import type { FullSnapshotPayload, SnapshotSummary } from "../appModel";
import {
  buildBrowserSnapshotIndex,
  clearBrowserSnapshotIndex,
  getDependencyNeighborhood,
  getEntityFacts,
  getOrBuildBrowserSnapshotIndex,
  getScopeFacts,
  getScopeTreeRoots,
  searchBrowserSnapshotIndex,
} from "../browserSnapshotIndex";

const snapshotSummary: SnapshotSummary = {
  id: "snap-local-1",
  workspaceId: "ws-1",
  repositoryRegistrationId: "repo-1",
  repositoryKey: "platform",
  repositoryName: "Architecture Browser Platform",
  runId: "run-1",
  snapshotKey: "platform-main-001",
  status: "READY",
  completenessStatus: "COMPLETE",
  derivedRunOutcome: "SUCCESS",
  schemaVersion: "1.0.0",
  indexerVersion: "0.1.0",
  sourceRevision: "abc123",
  sourceBranch: "main",
  importedAt: "2026-03-13T00:00:00Z",
  scopeCount: 3,
  entityCount: 3,
  relationshipCount: 2,
  diagnosticCount: 1,
  indexedFileCount: 5,
  totalFileCount: 5,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: {
      repositoryId: "repo-1",
      acquisitionType: "GIT",
      path: null,
      remoteUrl: "https://example.org/platform.git",
      branch: "main",
      revision: "abc123",
      acquiredAt: "2026-03-13T00:00:00Z",
    },
    run: {
      startedAt: "2026-03-13T00:00:00Z",
      completedAt: "2026-03-13T00:01:00Z",
      outcome: "SUCCESS",
      detectedTechnologies: ["java", "react"],
    },
    completeness: {
      status: "COMPLETE",
      indexedFileCount: 5,
      totalFileCount: 5,
      degradedFileCount: 0,
      omittedPaths: [],
      notes: [],
    },
    scopes: [
      {
        externalId: "scope:repo",
        kind: "REPOSITORY",
        name: "platform",
        displayName: "Platform",
        parentScopeId: null,
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:web",
        kind: "MODULE",
        name: "apps/web",
        displayName: "Web App",
        parentScopeId: "scope:repo",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:api",
        kind: "MODULE",
        name: "apps/api",
        displayName: "API",
        parentScopeId: "scope:repo",
        sourceRefs: [],
        metadata: {},
      },
    ],
    entities: [
      {
        externalId: "entity:browser-view",
        kind: "COMPONENT",
        origin: "react",
        name: "BrowserView",
        displayName: "BrowserView",
        scopeId: "scope:web",
        sourceRefs: [{ path: "apps/web/src/views/BrowserView.tsx", startLine: 1, endLine: 120, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:use-browser-explorer",
        kind: "HOOK",
        origin: "react",
        name: "useBrowserExplorer",
        displayName: "useBrowserExplorer",
        scopeId: "scope:web",
        sourceRefs: [{ path: "apps/web/src/hooks/useBrowserExplorer.ts", startLine: 1, endLine: 220, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:snapshot-layout-resource",
        kind: "RESOURCE",
        origin: "java",
        name: "SnapshotLayoutResource",
        displayName: "SnapshotLayoutResource",
        scopeId: "scope:api",
        sourceRefs: [{ path: "apps/api/src/main/java/.../SnapshotLayoutResource.java", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: {},
      },
    ],
    relationships: [
      {
        externalId: "rel:view-hook",
        kind: "USES",
        fromEntityId: "entity:browser-view",
        toEntityId: "entity:use-browser-explorer",
        label: "uses",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "rel:hook-resource",
        kind: "CALLS",
        fromEntityId: "entity:use-browser-explorer",
        toEntityId: "entity:snapshot-layout-resource",
        label: "calls",
        sourceRefs: [],
        metadata: {},
      },
    ],
    diagnostics: [
      {
        externalId: "diag:1",
        severity: "WARN",
        phase: "IMPORT",
        code: "PARTIAL_INDEX",
        message: "Indexer reported partial coverage for one module.",
        fatal: false,
        filePath: "apps/web/src/hooks/useBrowserExplorer.ts",
        scopeId: "scope:web",
        entityId: "entity:use-browser-explorer",
        sourceRefs: [],
        metadata: {},
      },
    ],
    metadata: {
      metadata: {},
    },
    warnings: [],
  };
}

describe("browserSnapshotIndex", () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test("builds a local tree index with scope hierarchy and direct entity counts", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const roots = getScopeTreeRoots(index);

    expect(roots).toHaveLength(1);
    expect(roots[0]?.scopeId).toBe("scope:repo");
    expect(roots[0]?.childScopeIds).toEqual(["scope:api", "scope:web"]);
    expect(roots[0]?.descendantEntityCount).toBe(3);
  });

  test("search finds local entities, scopes, relationships, and diagnostics without API calls", () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    const browserMatches = searchBrowserSnapshotIndex(index, "browserview");
    expect(browserMatches[0]?.kind).toBe("entity");
    expect(browserMatches[0]?.id).toBe("entity:browser-view");

    const relationshipMatches = searchBrowserSnapshotIndex(index, "calls");
    expect(relationshipMatches.some((match) => match.kind === "relationship" && match.id === "rel:hook-resource")).toBe(true);

    const diagnosticMatches = searchBrowserSnapshotIndex(index, "partial_index");
    expect(diagnosticMatches.some((match) => match.kind === "diagnostic")).toBe(true);
  });

  test("search can be limited to a scope subtree", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const results = searchBrowserSnapshotIndex(index, "snapshot", { scopeId: "scope:web" });

    expect(results.some((match) => match.id === "entity:snapshot-layout-resource")).toBe(false);
    expect(results.some((match) => match.id === "entity:use-browser-explorer")).toBe(true);
  });

  test("dependency neighborhood resolves inbound and outbound entities from local relationships", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const neighborhood = getDependencyNeighborhood(index, "entity:use-browser-explorer", "ALL");

    expect(neighborhood?.inboundEntityIds).toEqual(["entity:browser-view"]);
    expect(neighborhood?.outboundEntityIds).toEqual(["entity:snapshot-layout-resource"]);
    expect(neighborhood?.edges).toHaveLength(2);
  });

  test("entity and scope facts expose local relationships, diagnostics, and source refs", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const entityFacts = getEntityFacts(index, "entity:use-browser-explorer");
    const scopeFacts = getScopeFacts(index, "scope:web");

    expect(entityFacts?.outboundRelationships).toHaveLength(1);
    expect(entityFacts?.diagnostics[0]?.code).toBe("PARTIAL_INDEX");
    expect(entityFacts?.sourceRefs[0]?.path).toBe("apps/web/src/hooks/useBrowserExplorer.ts");
    expect(scopeFacts?.entityIds).toEqual(["entity:browser-view", "entity:use-browser-explorer"]);
    expect(scopeFacts?.diagnostics[0]?.externalId).toBe("diag:1");
  });

  test("memoizes a built index per snapshot id during the browser session", () => {
    const payload = createPayload();
    const first = getOrBuildBrowserSnapshotIndex(payload);
    const second = getOrBuildBrowserSnapshotIndex(payload);

    expect(second).toBe(first);
  });
});
