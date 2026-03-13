import type { FullSnapshotPayload, SnapshotSummary } from "../appModel";
import {
  buildBrowserSnapshotIndex,
  clearBrowserSnapshotIndex,
  getChildScopes,
  getContainedEntitiesForEntity,
  getContainingScopesForEntity,
  getDependencyNeighborhood,
  getDirectEntitiesForScope,
  getDirectEntitiesForScopeByKind,
  getEntityFacts,
  getOrBuildBrowserSnapshotIndex,
  getPrimaryEntitiesForScope,
  getScopeFacts,
  getScopeTreeRoots,
  getSubtreeEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
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
  scopeCount: 7,
  entityCount: 8,
  relationshipCount: 4,
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
        externalId: "scope:src",
        kind: "DIRECTORY",
        name: "src",
        displayName: "src",
        parentScopeId: "scope:repo",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:file-browser",
        kind: "FILE",
        name: "src/BrowserView.tsx",
        displayName: "src/BrowserView.tsx",
        parentScopeId: "scope:src",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:file-hook",
        kind: "FILE",
        name: "src/useBrowserExplorer.ts",
        displayName: "src/useBrowserExplorer.ts",
        parentScopeId: "scope:src",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:pkg",
        kind: "PACKAGE",
        name: "info.isaksson.erland.platform.browser",
        displayName: "info.isaksson.erland.platform.browser",
        parentScopeId: "scope:repo",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:web-module",
        kind: "MODULE",
        name: "apps/web",
        displayName: "Web App",
        parentScopeId: "scope:repo",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "scope:api-module",
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
        externalId: "entity:file-browser-module",
        kind: "MODULE",
        origin: "react",
        name: "BrowserViewModule",
        displayName: "BrowserViewModule",
        scopeId: "scope:file-browser",
        sourceRefs: [{ path: "apps/web/src/views/BrowserView.tsx", startLine: 1, endLine: 120, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:file-hook-module",
        kind: "MODULE",
        origin: "react",
        name: "useBrowserExplorerModule",
        displayName: "useBrowserExplorerModule",
        scopeId: "scope:file-hook",
        sourceRefs: [{ path: "apps/web/src/hooks/useBrowserExplorer.ts", startLine: 1, endLine: 220, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:browser-view",
        kind: "COMPONENT",
        origin: "react",
        name: "BrowserView",
        displayName: "BrowserView",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/views/BrowserView.tsx", startLine: 1, endLine: 120, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:use-browser-explorer",
        kind: "HOOK",
        origin: "react",
        name: "useBrowserExplorer",
        displayName: "useBrowserExplorer",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/hooks/useBrowserExplorer.ts", startLine: 1, endLine: 220, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:pkg-browser",
        kind: "PACKAGE",
        origin: "java",
        name: "info.isaksson.erland.platform.browser",
        displayName: "platform.browser",
        scopeId: "scope:pkg",
        sourceRefs: [{ path: "apps/api/src/main/java/info/isaksson/erland/platform/browser/package-info.java", startLine: 1, endLine: 5, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:web-root-module",
        kind: "MODULE",
        origin: "react",
        name: "WebRootModule",
        displayName: "WebRootModule",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/main.tsx", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:snapshot-layout-resource",
        kind: "RESOURCE",
        origin: "java",
        name: "SnapshotLayoutResource",
        displayName: "SnapshotLayoutResource",
        scopeId: "scope:api-module",
        sourceRefs: [{ path: "apps/api/src/main/java/.../SnapshotLayoutResource.java", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: {},
      },
      {
        externalId: "entity:inner-function",
        kind: "FUNCTION",
        origin: "react",
        name: "handleScopeSelection",
        displayName: "handleScopeSelection",
        scopeId: "scope:file-browser",
        sourceRefs: [{ path: "apps/web/src/views/BrowserView.tsx", startLine: 30, endLine: 60, snippet: null, metadata: {} }],
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
      {
        externalId: "rel:file-module-contains-function",
        kind: "CONTAINS",
        fromEntityId: "entity:file-browser-module",
        toEntityId: "entity:inner-function",
        label: "contains",
        sourceRefs: [],
        metadata: {},
      },
      {
        externalId: "rel:web-module-contains-view",
        kind: "CONTAINS",
        fromEntityId: "entity:web-root-module",
        toEntityId: "entity:browser-view",
        label: "contains",
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
        scopeId: "scope:web-module",
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
    expect(roots[0]?.childScopeIds).toEqual(["scope:api-module", "scope:web-module", "scope:pkg", "scope:src"]);
    expect(roots[0]?.descendantEntityCount).toBe(8);
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
    const results = searchBrowserSnapshotIndex(index, "snapshot", { scopeId: "scope:web-module" });

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
    const scopeFacts = getScopeFacts(index, "scope:web-module");

    expect(entityFacts?.outboundRelationships).toHaveLength(1);
    expect(entityFacts?.diagnostics[0]?.code).toBe("PARTIAL_INDEX");
    expect(entityFacts?.sourceRefs[0]?.path).toBe("apps/web/src/hooks/useBrowserExplorer.ts");
    expect(scopeFacts?.entityIds).toEqual(["entity:browser-view", "entity:use-browser-explorer", "entity:web-root-module"]);
    expect(scopeFacts?.diagnostics[0]?.externalId).toBe("diag:1");
  });

  test("adds explicit direct, subtree, child-scope, containment, and containing-scope lookups", () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getDirectEntitiesForScope(index, "scope:file-browser").map((entity) => entity.externalId)).toEqual([
      "entity:file-browser-module",
      "entity:inner-function",
    ]);
    expect(getSubtreeEntitiesForScope(index, "scope:src").map((entity) => entity.externalId)).toEqual([
      "entity:file-browser-module",
      "entity:inner-function",
      "entity:file-hook-module",
    ]);
    expect(getChildScopes(index, "scope:src").map((scope) => scope.externalId)).toEqual([
      "scope:file-browser",
      "scope:file-hook",
    ]);
    expect(getContainingScopesForEntity(index, "entity:file-browser-module").map((scope) => scope.externalId)).toEqual([
      "scope:file-browser",
      "scope:src",
      "scope:repo",
    ]);
    expect(getContainedEntitiesForEntity(index, "entity:file-browser-module").map((entity) => entity.externalId)).toEqual([
      "entity:inner-function",
    ]);
  });

  test("filters direct and subtree entities by kind", () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getDirectEntitiesForScopeByKind(index, "scope:file-browser", ["MODULE"]).map((entity) => entity.externalId)).toEqual([
      "entity:file-browser-module",
    ]);
    expect(getSubtreeEntitiesForScopeByKind(index, "scope:src", ["MODULE"]).map((entity) => entity.externalId)).toEqual([
      "entity:file-browser-module",
      "entity:file-hook-module",
    ]);
  });

  test("resolves primary entities for FILE, DIRECTORY, PACKAGE, and MODULE scopes via centralized policy", () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getPrimaryEntitiesForScope(index, "scope:file-browser").map((entity) => entity.externalId)).toEqual([
      "entity:file-browser-module",
    ]);
    expect(getPrimaryEntitiesForScope(index, "scope:src").map((entity) => entity.externalId)).toEqual([
      "entity:file-browser-module",
      "entity:file-hook-module",
    ]);
    expect(getPrimaryEntitiesForScope(index, "scope:pkg").map((entity) => entity.externalId)).toEqual([
      "entity:pkg-browser",
    ]);
    expect(getPrimaryEntitiesForScope(index, "scope:web-module").map((entity) => entity.externalId)).toEqual([
      "entity:web-root-module",
    ]);
  });

  test("memoizes a built index per snapshot id during the browser session", () => {
    const payload = createPayload();
    const first = getOrBuildBrowserSnapshotIndex(payload);
    const second = getOrBuildBrowserSnapshotIndex(payload);

    expect(second).toBe(first);
  });
});
