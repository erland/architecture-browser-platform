import {
  SAVED_CANVAS_DOCUMENT_SCHEMA_VERSION,
  createSavedCanvasDocument,
  createSavedCanvasItemReference,
  parseSavedCanvasJson,
  toSavedCanvasSnapshotRef,
} from "../saved-canvas";
import type { SnapshotSummary } from "../appModel.api";

const snapshot: SnapshotSummary = {
  id: "snapshot-1",
  workspaceId: "workspace-1",
  repositoryRegistrationId: "repo-reg-1",
  repositoryKey: "sample-repo",
  repositoryName: "Sample Repo",
  runId: "run-1",
  snapshotKey: "snap-001",
  status: "READY",
  completenessStatus: "COMPLETE",
  derivedRunOutcome: "SUCCESS",
  schemaVersion: "1.0.0",
  indexerVersion: "1.0.0",
  sourceRevision: "abc123",
  sourceBranch: "main",
  importedAt: "2026-03-24T10:00:00.000Z",
  scopeCount: 10,
  entityCount: 20,
  relationshipCount: 30,
  diagnosticCount: 0,
  indexedFileCount: 4,
  totalFileCount: 4,
  degradedFileCount: 0,
};

describe("savedCanvasModel", () => {
  it("represents a minimal canvas with one entity and position", () => {
    const document = createSavedCanvasDocument({
      canvasId: "canvas-1",
      name: "  Backend focus  ",
      originSnapshot: toSavedCanvasSnapshotRef(snapshot),
      nodes: [
        {
          canvasNodeId: "node-1",
          reference: createSavedCanvasItemReference({
            targetType: "ENTITY",
            stableKey: "entity:java:class:OrderService",
            originalSnapshotLocalId: "entity-123",
            fallback: {
              kind: "CLASS",
              name: "OrderService",
              path: "src/main/java/com/example/OrderService.java",
            },
          }),
          position: { x: 120, y: 240 },
          presentation: {
            pinned: true,
            hidden: false,
            collapsed: false,
          },
          annotationIds: [],
          metadata: {},
        },
      ],
    });

    expect(document.schemaVersion).toBe(SAVED_CANVAS_DOCUMENT_SCHEMA_VERSION);
    expect(document.name).toBe("Backend focus");
    expect(document.content.nodes).toHaveLength(1);
    expect(document.content.nodes[0].position).toEqual({ x: 120, y: 240 });
    expect(document.content.nodes[0].reference.stableKey).toBe("entity:java:class:OrderService");
    expect(document.content.nodes[0].reference.originalSnapshotLocalId).toBe("entity-123");
  });

  it("represents unsynchronized local state", () => {
    const document = createSavedCanvasDocument({
      canvasId: "canvas-2",
      name: "Offline work",
      originSnapshot: toSavedCanvasSnapshotRef(snapshot),
      syncState: "PENDING_SYNC",
      localVersion: 3,
      lastModifiedAt: "2026-03-24T12:00:00.000Z",
      lastSyncError: "Network unavailable",
    });

    expect(document.sync.state).toBe("PENDING_SYNC");
    expect(document.sync.localVersion).toBe(3);
    expect(document.sync.backendVersion).toBeNull();
    expect(document.sync.lastSyncError).toBe("Network unavailable");
  });

  it("represents the original snapshot reference and parses defensively", () => {
    const document = createSavedCanvasDocument({
      canvasId: "canvas-3",
      name: "Original snapshot",
      originSnapshot: toSavedCanvasSnapshotRef(snapshot),
    });

    const parsed = parseSavedCanvasJson(JSON.stringify(document));
    expect(parsed?.bindings.originSnapshot.snapshotId).toBe("snapshot-1");
    expect(parsed?.bindings.originSnapshot.snapshotKey).toBe("snap-001");
    expect(parsed?.bindings.currentTargetSnapshot?.snapshotId).toBe("snapshot-1");
    expect(parseSavedCanvasJson("not-json")).toBeNull();
    expect(parseSavedCanvasJson(JSON.stringify({ ...document, schemaVersion: "saved-canvas/v2" }))).toBeNull();
  });
});
