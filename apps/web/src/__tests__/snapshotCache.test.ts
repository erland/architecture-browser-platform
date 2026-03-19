import type { FullSnapshotPayload, SnapshotSummary } from "../appModel";
import { createSnapshotCache, InMemorySnapshotCacheStorage } from "../snapshotCache";

const snapshotSummary: SnapshotSummary = {
  id: "snap-1",
  workspaceId: "ws-1",
  repositoryRegistrationId: "repo-1",
  repositoryKey: "platform",
  repositoryName: "Platform",
  runId: "run-1",
  snapshotKey: "snapshot-001",
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
    source: {
      repositoryId: "repo-1",
      acquisitionType: "LOCAL_PATH",
      path: "/tmp/platform",
      remoteUrl: null,
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
      indexedFileCount: 1,
      totalFileCount: 1,
      degradedFileCount: 0,
      omittedPaths: [],
      notes: [],
    },
    scopes: [],
    entities: [],
    relationships: [],
    viewpoints: [],
    diagnostics: [],
    metadata: {
      metadata: {},
    },
    warnings: [],
  };
}

describe("snapshotCache", () => {
  test("putSnapshot stores a full snapshot payload by snapshot id", async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());

    await cache.putSnapshot({
      workspaceId: "ws-1",
      repositoryId: "repo-1",
      snapshotKey: "snapshot-001",
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    const stored = await cache.getSnapshot("snap-1");
    expect(stored?.snapshotId).toBe("snap-1");
    expect(stored?.payload.snapshot.snapshotKey).toBe("snapshot-001");
    expect(await cache.hasSnapshot("snap-1")).toBe(true);
  });

  test("isSnapshotCurrent compares the derived cache version against snapshot metadata", async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());

    const stored = await cache.putSnapshot({
      workspaceId: "ws-1",
      repositoryId: "repo-1",
      snapshotKey: "snapshot-001",
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });

    expect(cache.isSnapshotCurrent(snapshotSummary, stored)).toBe(true);
    expect(
      cache.isSnapshotCurrent(
        { ...snapshotSummary, importedAt: "2026-03-13T00:05:00Z" },
        stored,
      ),
    ).toBe(false);
  });

  test("clearObsoleteSnapshots removes cached snapshots that are no longer active", async () => {
    const cache = createSnapshotCache(new InMemorySnapshotCacheStorage());

    await cache.putSnapshot({
      workspaceId: "ws-1",
      repositoryId: "repo-1",
      snapshotKey: "snapshot-001",
      cacheVersion: cache.buildCacheVersion(snapshotSummary),
      payload: createPayload(),
    });
    await cache.putSnapshot({
      workspaceId: "ws-1",
      repositoryId: "repo-2",
      snapshotKey: "snapshot-002",
      cacheVersion: "custom-version",
      payload: {
        ...createPayload(),
        snapshot: { ...snapshotSummary, id: "snap-2", repositoryRegistrationId: "repo-2", snapshotKey: "snapshot-002" },
      },
    });

    const removedCount = await cache.clearObsoleteSnapshots(["snap-2"]);

    expect(removedCount).toBe(1);
    expect(await cache.hasSnapshot("snap-1")).toBe(false);
    expect(await cache.hasSnapshot("snap-2")).toBe(true);
  });
});
