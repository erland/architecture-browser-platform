import { createPlatformApi } from "../platformApi";

describe("platformApi", () => {
  test("getFullSnapshotPayload uses the dedicated one-shot snapshot endpoint", async () => {
    const fetchJson = jest.fn(async () => ({ scopes: [], viewpoints: [] })) as unknown as <T>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;
    const api = createPlatformApi({ fetchJson, fetchNoContent: jest.fn(async () => undefined) });

    await api.getFullSnapshotPayload("ws-1", "snap-1");

    expect(fetchJson).toHaveBeenCalledWith(
      "/api/workspaces/ws-1/snapshots/snap-1/full",
      { method: "GET" },
    );
  });

  test("createWorkspace posts the workspace form to the expected endpoint", async () => {
    const fetchJson = jest.fn(async () => ({ id: "ws-1" })) as unknown as <T>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;
    const api = createPlatformApi({ fetchJson, fetchNoContent: jest.fn(async () => undefined) });

    await api.createWorkspace({
      workspaceKey: "customs-core",
      name: "Swedish Customs Core",
      description: "Architecture workspace",
    });

    expect(fetchJson).toHaveBeenCalledWith("/api/workspaces", {
      method: "POST",
      body: JSON.stringify({
        workspaceKey: "customs-core",
        name: "Swedish Customs Core",
        description: "Architecture workspace",
      }),
    });
  });

  test("createRepository sends the selected repository registration payload", async () => {
    const fetchJson = jest.fn(async () => ({ id: "repo-1" })) as unknown as <T>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;
    const api = createPlatformApi({ fetchJson, fetchNoContent: jest.fn(async () => undefined) });

    await api.createRepository("ws-1", {
      repositoryKey: "browser-platform",
      name: "Architecture Browser Platform",
      sourceType: "GIT",
      localPath: "",
      remoteUrl: "https://example.com/platform.git",
      defaultBranch: "main",
      metadataJson: '{"team":"ea"}',
    });

    expect(fetchJson).toHaveBeenCalledWith("/api/workspaces/ws-1/repositories", {
      method: "POST",
      body: JSON.stringify({
        repositoryKey: "browser-platform",
        name: "Architecture Browser Platform",
        sourceType: "GIT",
        localPath: "",
        remoteUrl: "https://example.com/platform.git",
        defaultBranch: "main",
        metadataJson: '{"team":"ea"}',
      }),
    });
  });

  test("requestRun includes the requested result override in the request body", async () => {
    const fetchJson = jest.fn(async () => ({ id: "run-1" })) as unknown as <T>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;
    const api = createPlatformApi({ fetchJson, fetchNoContent: jest.fn(async () => undefined) });

    await api.requestRun("ws-1", "repo-1", {
      triggerType: "MANUAL",
      requestedSchemaVersion: "indexer-ir-v1",
      requestedIndexerVersion: "step4-stub",
      metadataJson: '{"requestedBy":"web-ui"}',
      requestedResult: "FAILURE",
    });

    expect(fetchJson).toHaveBeenCalledWith("/api/workspaces/ws-1/repositories/repo-1/runs", {
      method: "POST",
      body: JSON.stringify({
        triggerType: "MANUAL",
        requestedSchemaVersion: "indexer-ir-v1",
        requestedIndexerVersion: "step4-stub",
        metadataJson: '{"requestedBy":"web-ui"}',
        requestedResult: "FAILURE",
      }),
    });
  });
});
