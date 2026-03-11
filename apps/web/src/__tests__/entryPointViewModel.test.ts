import { summarizeEntryKinds, toEntryPointItemOptions } from "../entryPointViewModel";

describe("entryPointViewModel", () => {
  test("toEntryPointItemOptions keeps labels stable and sorted", () => {
    expect(toEntryPointItemOptions([
      { externalId: "b", displayName: null, name: "orders-db", kind: "DATASTORE", inboundRelationshipCount: 2, outboundRelationshipCount: 0 },
      { externalId: "a", displayName: "GET /demo", name: "Demo endpoint", kind: "ENDPOINT", inboundRelationshipCount: 1, outboundRelationshipCount: 1 },
    ])).toEqual([
      { externalId: "a", label: "GET /demo · ENDPOINT", kind: "ENDPOINT", inboundRelationshipCount: 1, outboundRelationshipCount: 1 },
      { externalId: "b", label: "orders-db · DATASTORE", kind: "DATASTORE", inboundRelationshipCount: 2, outboundRelationshipCount: 0 },
    ]);
  });

  test("summarizeEntryKinds returns stable grouped summary", () => {
    expect(summarizeEntryKinds([
      { kind: "ENDPOINT" },
      { kind: "SERVICE" },
      { kind: "ENDPOINT" },
    ])).toBe("ENDPOINT (2), SERVICE (1)");
  });
});
