import { normalizeRetentionForm, summarizeOperationsHeadline } from "../operationsViewModel";

describe("operationsViewModel", () => {
  it("builds a stable operations headline", () => {
    expect(summarizeOperationsHeadline({
      repositoryCount: 2,
      runCount: 5,
      snapshotCount: 3,
      failedRunCount: 1,
      failedSnapshotCount: 2,
    })).toBe("2 repositories · 5 runs · 3 snapshots · 1 failed runs · 2 problematic snapshots");
  });

  it("normalizes retention inputs without allowing values below one", () => {
    expect(normalizeRetentionForm({ keepSnapshotsPerRepository: "0", keepRunsPerRepository: "" }, {
      keepSnapshotsPerRepository: 2,
      keepRunsPerRepository: 5,
    })).toEqual({ keepSnapshotsPerRepository: 2, keepRunsPerRepository: 5 });
  });
});
