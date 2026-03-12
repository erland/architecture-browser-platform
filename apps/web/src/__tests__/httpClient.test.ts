import { createHttpClient, readErrorMessage } from "../httpClient";

describe("httpClient", () => {
  test("fetchJson sends JSON content type and parses payload", async () => {
    const fetchMock = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toEqual({ "Content-Type": "application/json" });
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = createHttpClient(fetchMock);
    await expect(client.fetchJson<{ status: string }>("/api/health")).resolves.toEqual({ status: "ok" });
  });

  test("fetchNoContent resolves on successful empty response", async () => {
    const fetchMock = jest.fn(async () => new Response(null, { status: 204 }));
    const client = createHttpClient(fetchMock);

    await expect(client.fetchNoContent("/api/workspaces/1/snapshots/2/overlays/3", { method: "DELETE" })).resolves.toBeUndefined();
  });

  test("readErrorMessage includes server details when present", async () => {
    const response = new Response(JSON.stringify({ message: "Validation failed", details: ["workspaceKey is required", "name is required"] }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

    await expect(readErrorMessage(response)).resolves.toBe("Validation failed. workspaceKey is required name is required");
  });

  test("fetchJson falls back to status-based error when body is not JSON", async () => {
    const fetchMock = jest.fn(async () => new Response("boom", { status: 503 }));
    const client = createHttpClient(fetchMock);

    await expect(client.fetchJson("/api/workspaces")).rejects.toThrow("Request failed with status 503.");
  });
});
