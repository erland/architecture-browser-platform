import { nextDirection, summarizeDependencyKinds, toDependencyEntityOptions } from "../dependencyViewModel";

describe("dependencyViewModel", () => {
  test("toDependencyEntityOptions keeps in-scope entities first and marks external neighbors", () => {
    const options = toDependencyEntityOptions([
      { externalId: "b", displayName: "External service", name: "External service", inScope: false, inboundCount: 1, outboundCount: 0 },
      { externalId: "a", displayName: "Backend module", name: "Backend module", inScope: true, inboundCount: 0, outboundCount: 2 },
    ]);

    expect(options).toEqual([
      { externalId: "a", label: "Backend module", inScope: true, inboundCount: 0, outboundCount: 2 },
      { externalId: "b", label: "External service (external)", inScope: false, inboundCount: 1, outboundCount: 0 },
    ]);
  });

  test("summarizeDependencyKinds returns stable top-kind summary", () => {
    expect(
      summarizeDependencyKinds([
        { externalId: "1", kind: "CALLS", directionCategory: "INBOUND" },
        { externalId: "2", kind: "CALLS", directionCategory: "INTERNAL" },
        { externalId: "3", kind: "EXPOSES", directionCategory: "INTERNAL" },
      ]),
    ).toBe("CALLS (2), EXPOSES (1)");
  });

  test("nextDirection cycles across supported filters", () => {
    expect(nextDirection("ALL")).toBe("INBOUND");
    expect(nextDirection("INBOUND")).toBe("OUTBOUND");
    expect(nextDirection("OUTBOUND")).toBe("ALL");
  });
});
