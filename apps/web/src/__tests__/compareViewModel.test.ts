import { comparisonSnapshotOptions, summarizeComparisonHeadline } from "../compareViewModel";

describe("compareViewModel", () => {
  it("builds a stable summary headline", () => {
    expect(summarizeComparisonHeadline({
      addedEntityCount: 3,
      removedEntityCount: 1,
      addedRelationshipCount: 2,
      removedRelationshipCount: 1,
    })).toBe("3 added entities · 1 removed entities · 2 added relationships · 1 removed relationships");
  });

  it("excludes the active snapshot from comparison choices", () => {
    const options = comparisonSnapshotOptions([
      { id: "a", snapshotKey: "a1", importedAt: "2026-03-10T10:00:00Z" },
      { id: "b", snapshotKey: "b1", importedAt: "2026-03-11T10:00:00Z" },
    ], "a");
    expect(options).toEqual([{ value: "b", label: "b1 · 2026-03-11T10:00:00Z" }]);
  });
});
