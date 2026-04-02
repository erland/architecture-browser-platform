import type { FullSnapshotPayload, SnapshotSummary } from "../../app-model";
import {
  buildBrowserSnapshotIndex,
  buildViewpointGraph,
  clearBrowserSnapshotIndex,
  getChildScopes,
  getContainedEntitiesForEntity,
  getContainingEntitiesForEntity,
  getContainingScopesForEntity,
  getDependencyNeighborhood,
  getDirectEntitiesForScope,
  getDirectEntitiesForScopeByKind,
  getEntityFacts,
  getOrBuildBrowserSnapshotIndex,
  getAvailableViewpoints,
  getPrimaryEntitiesForScope,
  getScopeFacts,
  getScopeTreeRoots,
  getSubtreeEntitiesForScope,
  getSubtreeEntitiesForScopeByKind,
  getViewpointById,
  resolveViewpointExpansionRelationships,
  resolveViewpointSeedEntityIds,
  searchBrowserSnapshotIndex,
} from "../../browser-snapshot";

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
  entityCount: 15,
  relationshipCount: 11,
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
        metadata: { architecturalRoles: ["ui-page"] },
      },
      {
        externalId: "entity:use-browser-explorer",
        kind: "HOOK",
        origin: "react",
        name: "useBrowserExplorer",
        displayName: "useBrowserExplorer",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/hooks/useBrowserExplorer.ts", startLine: 1, endLine: 220, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["application-service"] },
      },
      {
        externalId: "entity:pkg-browser",
        kind: "PACKAGE",
        origin: "java",
        name: "info.isaksson.erland.platform.browser",
        displayName: "platform.browser",
        scopeId: "scope:pkg",
        sourceRefs: [{ path: "apps/api/src/main/java/info/isaksson/erland/platform/browser/package-info.java", startLine: 1, endLine: 5, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["persistent-entity"] },
      },
      {
        externalId: "entity:web-root-module",
        kind: "MODULE",
        origin: "react",
        name: "WebRootModule",
        displayName: "WebRootModule",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/main.tsx", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["api-entrypoint"] },
      },
      {
        externalId: "entity:snapshot-layout-resource",
        kind: "RESOURCE",
        origin: "java",
        name: "SnapshotLayoutResource",
        displayName: "SnapshotLayoutResource",
        scopeId: "scope:api-module",
        sourceRefs: [{ path: "apps/api/src/main/java/.../SnapshotLayoutResource.java", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["application-service"] },
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
      {
        externalId: "entity:external-sync-adapter",
        kind: "COMPONENT",
        origin: "java",
        name: "ExternalSyncAdapter",
        displayName: "ExternalSyncAdapter",
        scopeId: "scope:api-module",
        sourceRefs: [{ path: "apps/api/src/main/java/.../ExternalSyncAdapter.java", startLine: 1, endLine: 120, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["integration-adapter"] },
      },
      {
        externalId: "entity:crm-system",
        kind: "SYSTEM",
        origin: "external",
        name: "CrmSystem",
        displayName: "CRM System",
        scopeId: "scope:api-module",
        sourceRefs: [],
        metadata: { architecturalRoles: ["external-dependency"] },
      },
      {
        externalId: "entity:web-app-module",
        kind: "MODULE",
        origin: "react",
        name: "WebAppModule",
        displayName: "Web App Module",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/package.json", startLine: 1, endLine: 40, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["module-boundary"] },
      },
      {
        externalId: "entity:api-app-module",
        kind: "MODULE",
        origin: "java",
        name: "ApiAppModule",
        displayName: "API App Module",
        scopeId: "scope:api-module",
        sourceRefs: [{ path: "apps/api/pom.xml", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["module-boundary"] },
      },
      {
        externalId: "entity:app-shell",
        kind: "COMPONENT",
        origin: "react",
        name: "AppShell",
        displayName: "App Shell",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/App.tsx", startLine: 1, endLine: 120, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["ui-layout"] },
      },
      {
        externalId: "entity:dashboard-page",
        kind: "COMPONENT",
        origin: "react",
        name: "DashboardPage",
        displayName: "Dashboard Page",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/views/DashboardPage.tsx", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["ui-page"] },
      },
      {
        externalId: "entity:settings-page",
        kind: "COMPONENT",
        origin: "react",
        name: "SettingsPage",
        displayName: "Settings Page",
        scopeId: "scope:web-module",
        sourceRefs: [{ path: "apps/web/src/views/SettingsPage.tsx", startLine: 1, endLine: 80, snippet: null, metadata: {} }],
        metadata: { architecturalRoles: ["ui-page", "ui-navigation-node"] },
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
        metadata: { architecturalSemantics: ["serves-request"] },
      },
      {
        externalId: "rel:hook-resource",
        kind: "CALLS",
        fromEntityId: "entity:use-browser-explorer",
        toEntityId: "entity:snapshot-layout-resource",
        label: "calls",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["accesses-persistence"] },
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
        metadata: { architecturalSemantics: ["serves-request"] },
      },
      {
        externalId: "rel:resource-adapter",
        kind: "CALLS",
        fromEntityId: "entity:snapshot-layout-resource",
        toEntityId: "entity:external-sync-adapter",
        label: "invokes adapter",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["invokes-use-case"] },
      },
      {
        externalId: "rel:adapter-external",
        kind: "CALLS",
        fromEntityId: "entity:external-sync-adapter",
        toEntityId: "entity:crm-system",
        label: "syncs to",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["calls-external-system"] },
      },
      {
        externalId: "rel:web-api-module",
        kind: "DEPENDS_ON",
        fromEntityId: "entity:web-app-module",
        toEntityId: "entity:api-app-module",
        label: "depends on module",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["depends-on-module"] },
      },
      {
        externalId: "rel:app-shell-dashboard",
        kind: "CONTAINS",
        fromEntityId: "entity:app-shell",
        toEntityId: "entity:dashboard-page",
        label: "contains route",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["contains-route"] },
      },
      {
        externalId: "rel:dashboard-settings",
        kind: "NAVIGATES_TO",
        fromEntityId: "entity:dashboard-page",
        toEntityId: "entity:settings-page",
        label: "navigates to settings",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["navigates-to"] },
      },
      {
        externalId: "rel:settings-dashboard",
        kind: "REDIRECTS_TO",
        fromEntityId: "entity:settings-page",
        toEntityId: "entity:dashboard-page",
        label: "redirects to dashboard",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["redirects-to"] },
      },
      {
        externalId: "rel:app-shell-guards-settings",
        kind: "GUARDS",
        fromEntityId: "entity:app-shell",
        toEntityId: "entity:settings-page",
        label: "guards route",
        sourceRefs: [],
        metadata: { architecturalSemantics: ["guards-route"] },
      },
    ],
    viewpoints: [
      {
        id: "request-handling",
        title: "Request handling",
        description: "Highlights entrypoints and service flows.",
        availability: "available",
        confidence: 0.95,
        seedEntityIds: [],
        seedRoleIds: ["api-entrypoint", "application-service"],
        expandViaSemantics: ["serves-request", "invokes-use-case"],
        preferredDependencyViews: ["java:type-dependencies"],
        evidenceSources: ["fixture"],
      },
      {
        id: "api-surface",
        title: "API surface",
        description: "Highlights API entrypoints and their immediate collaborators.",
        availability: "available",
        confidence: 0.91,
        seedEntityIds: [],
        seedRoleIds: ["api-entrypoint"],
        expandViaSemantics: ["serves-request", "invokes-use-case"],
        preferredDependencyViews: ["java:type-dependencies"],
        evidenceSources: ["fixture"],
      },
      {
        id: "persistence-model",
        title: "Persistence model",
        description: "Highlights persisted entities and access paths.",
        availability: "partial",
        confidence: 0.74,
        seedEntityIds: ["entity:pkg-browser"],
        seedRoleIds: ["persistent-entity"],
        expandViaSemantics: ["accesses-persistence"],
        preferredDependencyViews: ["java:type-dependencies"],
        evidenceSources: ["fixture"],
      },
      {
        id: "integration-map",
        title: "Integration map",
        description: "Highlights integration adapters.",
        availability: "available",
        confidence: 0.79,
        seedEntityIds: [],
        seedRoleIds: ["integration-adapter"],
        expandViaSemantics: ["calls-external-system"],
        preferredDependencyViews: [],
        evidenceSources: ["fixture"],
      },
      {
        id: "module-dependencies",
        title: "Module dependencies",
        description: "Highlights module boundaries and dependency edges.",
        availability: "available",
        confidence: 0.83,
        seedEntityIds: [],
        seedRoleIds: ["module-boundary"],
        expandViaSemantics: ["depends-on-module"],
        preferredDependencyViews: ["default"],
        evidenceSources: ["fixture"],
      },
      {
        id: "ui-navigation",
        title: "UI navigation",
        description: "Highlights layouts, pages, and route/navigation flows.",
        availability: "available",
        confidence: 0.87,
        seedEntityIds: [],
        seedRoleIds: ["ui-layout", "ui-page", "ui-navigation-node"],
        expandViaSemantics: ["contains-route", "navigates-to", "redirects-to", "guards-route"],
        preferredDependencyViews: ["default"],
        evidenceSources: ["fixture"],
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
    expect(roots[0]?.descendantEntityCount).toBe(15);
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
    expect(scopeFacts?.entityIds).toEqual(["entity:app-shell", "entity:browser-view", "entity:dashboard-page", "entity:settings-page", "entity:use-browser-explorer", "entity:web-app-module", "entity:web-root-module"]);
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
      "entity:web-app-module",
      "entity:web-root-module",
    ]);
  });


  test("indexes viewpoints, architectural roles, and semantics for browser-side lookup", () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getAvailableViewpoints(index).map((viewpoint) => viewpoint.id)).toEqual([
      "api-surface",
      "integration-map",
      "module-dependencies",
      "persistence-model",
      "request-handling",
      "ui-navigation",
    ]);
    expect(getAvailableViewpoints(index, { includePartial: false }).map((viewpoint) => viewpoint.id)).toEqual([
      "api-surface",
      "integration-map",
      "module-dependencies",
      "request-handling",
      "ui-navigation",
    ]);
    expect(getViewpointById(index, "request-handling")?.seedRoleIds).toEqual(["api-entrypoint", "application-service"]);
    expect(index.entityIdsByArchitecturalRole.get("application-service")).toEqual([
      "entity:use-browser-explorer",
      "entity:snapshot-layout-resource",
    ]);
    expect(index.relationshipIdsByArchitecturalSemantic.get("accesses-persistence")).toEqual(["rel:hook-resource"]);
    expect(index.relationshipIdsByArchitecturalSemantic.get("serves-request")).toEqual(["rel:view-hook", "rel:web-module-contains-view"]);
  });

  test("resolves viewpoint seed entities across whole snapshot, selected scope, and subtree modes", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const requestHandling = getViewpointById(index, "request-handling");
    expect(requestHandling).not.toBeNull();

    expect(resolveViewpointSeedEntityIds(index, requestHandling!, { scopeMode: "whole-snapshot" })).toEqual([
      "entity:snapshot-layout-resource",
      "entity:use-browser-explorer",
      "entity:web-root-module",
    ]);
    expect(resolveViewpointSeedEntityIds(index, requestHandling!, { scopeMode: "selected-scope", selectedScopeId: "scope:web-module" })).toEqual([
      "entity:use-browser-explorer",
      "entity:web-root-module",
    ]);
    expect(resolveViewpointSeedEntityIds(index, requestHandling!, { scopeMode: "selected-subtree", selectedScopeId: "scope:src" })).toEqual([]);
  });

  test("expands viewpoint relationships by architectural semantics and builds a deterministic graph", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const persistenceModel = getViewpointById(index, "persistence-model");
    expect(persistenceModel).not.toBeNull();

    const seedEntityIds = resolveViewpointSeedEntityIds(index, persistenceModel!, { scopeMode: "whole-snapshot" });
    expect(seedEntityIds).toEqual(["entity:pkg-browser"]);

    const expansionRelationships = resolveViewpointExpansionRelationships(index, persistenceModel!, seedEntityIds);
    expect(expansionRelationships.map((relationship) => relationship.externalId)).toEqual(["rel:hook-resource"]);

    const graph = buildViewpointGraph(index, persistenceModel!, { scopeMode: "whole-snapshot" });
    expect(graph.seedEntityIds).toEqual(["entity:pkg-browser"]);
    expect(graph.entityIds).toEqual([
      "entity:pkg-browser",
      "entity:snapshot-layout-resource",
      "entity:use-browser-explorer",
    ]);
    expect(graph.relationshipIds).toEqual(["rel:hook-resource"]);
    expect(graph.preferredDependencyViews).toEqual(["java:type-dependencies"]);
    expect(graph.recommendedLayout).toBe("persistence-model");
  });

  test("persistence-model prioritizes persistent structures and their immediate access paths", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const persistenceModel = getViewpointById(index, "persistence-model");
    expect(persistenceModel).not.toBeNull();

    const graph = buildViewpointGraph(index, persistenceModel!, { scopeMode: "whole-snapshot" });
    expect(graph.entityIds[0]).toBe("entity:pkg-browser");
    expect(graph.relationshipIds).toEqual(["rel:hook-resource"]);
  });


  test("api-surface keeps entrypoints plus immediate request neighbors without pulling deeper persistence flows", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const apiSurface = getViewpointById(index, "api-surface");
    expect(apiSurface).not.toBeNull();

    const graph = buildViewpointGraph(index, apiSurface!, { scopeMode: "whole-snapshot" });
    expect(graph.recommendedLayout).toBe("api-surface");
    expect(graph.seedEntityIds).toEqual(["entity:web-root-module"]);
    expect(graph.relationshipIds).toEqual(["rel:web-module-contains-view"]);
    expect(graph.entityIds).toEqual([
      "entity:web-root-module",
      "entity:browser-view",
    ]);
    expect(graph.entityIds).not.toContain("entity:use-browser-explorer");
    expect(graph.entityIds).not.toContain("entity:snapshot-layout-resource");
  });

  test("integration-map keeps adapters, external dependencies, and immediate upstream callers in a readable layout", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const integrationMap = getViewpointById(index, "integration-map");

    expect(integrationMap).not.toBeNull();
    const graph = buildViewpointGraph(index, integrationMap!, { scopeMode: "whole-snapshot" });

    expect(graph.recommendedLayout).toBe("integration-map");
    expect(graph.seedEntityIds).toEqual(["entity:external-sync-adapter"]);
    expect(graph.entityIds).toEqual(["entity:snapshot-layout-resource", "entity:external-sync-adapter", "entity:crm-system"]);
    expect(graph.relationshipIds).toEqual(["rel:resource-adapter", "rel:adapter-external"]);
  });

  test("module-dependencies keeps module boundaries and dependency edges in a structural layout", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const moduleDependencies = getViewpointById(index, "module-dependencies");

    expect(moduleDependencies).not.toBeNull();
    const graph = buildViewpointGraph(index, moduleDependencies!, { scopeMode: "whole-snapshot" });

    expect(graph.recommendedLayout).toBe("module-dependencies");
    expect(graph.seedEntityIds).toEqual(["entity:api-app-module", "entity:web-app-module"]);
    expect(graph.entityIds).toEqual(["entity:api-app-module", "entity:web-app-module"]);
    expect(graph.relationshipIds).toEqual(["rel:web-api-module"]);
  });


  test("ui-navigation keeps layouts, pages, and route semantics in a frontend navigation layout", () => {
    const index = buildBrowserSnapshotIndex(snapshotSummary, createPayload());
    const uiNavigation = getViewpointById(index, "ui-navigation");

    expect(uiNavigation).toBeDefined();

    const graph = buildViewpointGraph(index, uiNavigation!, { scopeMode: "whole-snapshot" });

    expect(graph.seedEntityIds).toEqual(["entity:app-shell", "entity:dashboard-page", "entity:settings-page"]);
    expect(graph.entityIds).toEqual(["entity:app-shell", "entity:dashboard-page", "entity:settings-page"]);
    expect(graph.relationshipIds).toEqual(["rel:app-shell-dashboard", "rel:app-shell-guards-settings", "rel:dashboard-settings", "rel:settings-dashboard"]);
    expect(graph.recommendedLayout).toBe("ui-navigation");
  });

  test("request-handling stays stable across scope modes and prioritizes request flow roles", () => {
    const index = buildBrowserSnapshotIndex(createPayload());
    const requestHandling = getViewpointById(index, "request-handling");
    expect(requestHandling).not.toBeNull();

    const wholeGraph = buildViewpointGraph(index, requestHandling!, { scopeMode: "whole-snapshot" });
    expect(wholeGraph.recommendedLayout).toBe("request-flow");
    expect(wholeGraph.seedEntityIds).toEqual([
      "entity:web-root-module",
      "entity:use-browser-explorer",
      "entity:snapshot-layout-resource",
    ]);
    expect(wholeGraph.relationshipIds).toEqual(["rel:web-module-contains-view", "rel:view-hook"]);
    expect(wholeGraph.entityIds.slice(0, 2)).toEqual([
      "entity:web-root-module",
      "entity:use-browser-explorer",
    ]);

    const scopedGraph = buildViewpointGraph(index, requestHandling!, { scopeMode: "selected-scope", selectedScopeId: "scope:web-module" });
    expect(scopedGraph.entityIds).toEqual([
      "entity:web-root-module",
      "entity:use-browser-explorer",
      "entity:browser-view",
    ]);

    const subtreeGraph = buildViewpointGraph(index, requestHandling!, { scopeMode: "selected-subtree", selectedScopeId: "scope:repo" });
    expect(subtreeGraph.entityIds).toEqual(wholeGraph.entityIds);
  });

  test("memoizes a built index per snapshot id during the browser session", () => {
    const payload = createPayload();
    const first = getOrBuildBrowserSnapshotIndex(payload);
    const second = getOrBuildBrowserSnapshotIndex(payload);

    expect(second).toBe(first);
  });
  test("resolves containing entities for a contained child entity", () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getContainingEntitiesForEntity(index, "entity:inner-function").map((entity) => entity.externalId)).toEqual(["entity:file-browser-module"]);
  });


});
