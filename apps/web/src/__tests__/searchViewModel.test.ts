import { summarizeMatchReasons, toSearchResultOptions } from "../searchViewModel";

describe("searchViewModel", () => {
  it("sorts duplicate names by scope path so results stay disambiguated", () => {
    const options = toSearchResultOptions([
      {
        externalId: "b",
        displayName: "OrderService",
        name: "OrderService",
        scopePath: "repo / web",
        kind: "SERVICE",
      },
      {
        externalId: "a",
        displayName: "OrderService",
        name: "OrderService",
        scopePath: "repo / backend",
        kind: "SERVICE",
      },
    ]);

    expect(options.map((option) => option.externalId)).toEqual(["a", "b"]);
    expect(options[0].label).toBe("OrderService · repo / backend");
  });

  it("summarizes match reasons defensively", () => {
    expect(summarizeMatchReasons(["exact name", "source path"])).toBe("exact name, source path");
    expect(summarizeMatchReasons([])).toBe("—");
  });
});
