import type { FullSnapshotPayload, SnapshotSummary } from "../../app-model";
import { getOrBuildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from "../../browser-snapshot";
import { createSnapshotCache, InMemorySnapshotCacheStorage } from "../../api/snapshot-cache";

const snapshotSummary: SnapshotSummary = {
  id: "snap-prep-1",
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
  scopeCount: 1,
  entityCount: 1,
  relationshipCount: 0,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: "repo-1", acquisitionType: "GIT", path: null, remoteUrl: null, branch: "main", revision: "abc123", acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: "SUCCESS", detectedTechnologies: [] },
    completeness: { status: "COMPLETE", indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [{ externalId: "scope:repo", kind: "REPOSITORY", name: "platform", displayName: "Platform", parentScopeId: null, sourceRefs: [], metadata: {} }],
    entities: [{ externalId: "entity:browser", kind: "COMPONENT", origin: "react", name: "BrowserView", displayName: "BrowserView", scopeId: "scope:repo", sourceRefs: [], metadata: {} }],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe("browser preparation primitives", () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test("current snapshot cache can be promoted into a ready local browser index", async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());
    await cache.putSnapshot({
      workspaceId: "ws-1",
      repositoryId: "repo-1",
      snapshotKey: snapshotSummary.snapshotKey,
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    const cached = await cache.getSnapshot(snapshotSummary.id);
    expect(cache.isSnapshotCurrent(snapshotSummary, cached)).toBe(true);

    const index = getOrBuildBrowserSnapshotIndex(cached!.payload);
    expect(index.payload.snapshot.id).toBe(snapshotSummary.id);
    expect(index.entitiesById.get("entity:browser")?.name).toBe("BrowserView");
  });
});
