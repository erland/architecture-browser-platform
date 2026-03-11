import { buildSavedViewRequest, parseSavedViewJson, toSavedViewStateLabel } from "../savedViewModel";

describe("savedViewModel", () => {
  it("builds a stable saved-view payload from current filters", () => {
    const payload = buildSavedViewRequest("  Backend focus  ", {
      selectedSearchScopeId: "scope:package:backend",
      searchQuery: "OrderService",
      selectedLayoutScopeId: "scope:package:backend",
      selectedDependencyScopeId: "scope:module:backend",
      dependencyDirection: "INBOUND",
    });

    expect(payload.name).toBe("Backend focus");
    expect(payload.viewType).toBe("SNAPSHOT_BROWSER");
    expect(payload.queryState.searchQuery).toBe("OrderService");
    expect(payload.layoutState.dependencyDirection).toBe("INBOUND");
  });

  it("parses saved-view json defensively", () => {
    expect(parseSavedViewJson<{ searchQuery: string }>("{\"searchQuery\":\"orders\"}")?.searchQuery).toBe("orders");
    expect(parseSavedViewJson("not-json")).toBeNull();
    expect(toSavedViewStateLabel("Backend focus", "SNAPSHOT_BROWSER", "abc123")).toBe("Backend focus · SNAPSHOT_BROWSER · abc123");
  });
});
