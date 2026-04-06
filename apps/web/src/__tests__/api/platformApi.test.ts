import { createPlatformApi } from "../../api/platformApi";

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


  test("readSourceView posts selected-object source requests to the source-view endpoint", async () => {
    const fetchJson = jest.fn(async () => ({ path: 'src/BrowserView.tsx' })) as unknown as <T>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;
    const api = createPlatformApi({ fetchJson, fetchNoContent: jest.fn(async () => undefined) });

    await api.readSourceView('ws-1', {
      snapshotId: 'snap-1',
      selectedObjectType: 'ENTITY',
      selectedObjectId: 'entity:browser',
    });

    expect(fetchJson).toHaveBeenCalledWith('/api/workspaces/ws-1/source-view/read', {
      method: 'POST',
      body: JSON.stringify({
        snapshotId: 'snap-1',
        selectedObjectType: 'ENTITY',
        selectedObjectId: 'entity:browser',
      }),
    });
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

  test("saved canvas endpoints use the expected backend routes", async () => {
    const fetchJson = jest.fn(async () => ({ id: "canvas-1" })) as unknown as <T>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;
    const fetchNoContent = jest.fn(async () => undefined);
    const api = createPlatformApi({ fetchJson, fetchNoContent });

    await api.listSavedCanvases("ws-1", "snap-1");
    await api.getSavedCanvas("ws-1", "snap-1", "canvas-1");
    await api.createSavedCanvas("ws-1", "snap-1", {
      name: "Orders canvas",
      document: { canvasId: "canvas-1" } as never,
    });
    await api.updateSavedCanvas("ws-1", "snap-1", "canvas-1", {
      name: "Orders canvas",
      document: { canvasId: "canvas-1" } as never,
      expectedBackendVersion: "3",
    });
    await api.duplicateSavedCanvas("ws-1", "snap-1", "canvas-1");
    await api.deleteSavedCanvas("ws-1", "snap-1", "canvas-1", "3");

    expect(fetchJson).toHaveBeenNthCalledWith(1,
      "/api/workspaces/ws-1/snapshots/snap-1/saved-canvases",
      { method: "GET" },
    );
    expect(fetchJson).toHaveBeenNthCalledWith(2,
      "/api/workspaces/ws-1/snapshots/snap-1/saved-canvases/canvas-1",
      { method: "GET" },
    );
    expect(fetchJson).toHaveBeenNthCalledWith(3,
      "/api/workspaces/ws-1/snapshots/snap-1/saved-canvases",
      { method: "POST", body: JSON.stringify({ name: "Orders canvas", document: { canvasId: "canvas-1" } }) },
    );
    expect(fetchJson).toHaveBeenNthCalledWith(4,
      "/api/workspaces/ws-1/snapshots/snap-1/saved-canvases/canvas-1",
      { method: "PUT", body: JSON.stringify({ name: "Orders canvas", document: { canvasId: "canvas-1" }, expectedBackendVersion: "3" }) },
    );
    expect(fetchJson).toHaveBeenNthCalledWith(5,
      "/api/workspaces/ws-1/snapshots/snap-1/saved-canvases/canvas-1/duplicate",
      { method: "POST", body: JSON.stringify({}) },
    );
    expect(fetchNoContent).toHaveBeenCalledWith(
      "/api/workspaces/ws-1/snapshots/snap-1/saved-canvases/canvas-1?expectedBackendVersion=3",
      { method: "DELETE" },
    );
  });

});
