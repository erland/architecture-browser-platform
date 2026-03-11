export function summarizeOperationsHeadline(summary: {
  repositoryCount: number;
  runCount: number;
  snapshotCount: number;
  failedRunCount: number;
  failedSnapshotCount: number;
}) {
  return `${summary.repositoryCount} repositories · ${summary.runCount} runs · ${summary.snapshotCount} snapshots · ${summary.failedRunCount} failed runs · ${summary.failedSnapshotCount} problematic snapshots`;
}

export function normalizeRetentionForm(input: {
  keepSnapshotsPerRepository: string;
  keepRunsPerRepository: string;
}, defaults: { keepSnapshotsPerRepository: number; keepRunsPerRepository: number }) {
  const keepSnapshotsPerRepository = Math.max(1, Number.parseInt(input.keepSnapshotsPerRepository || `${defaults.keepSnapshotsPerRepository}`, 10) || defaults.keepSnapshotsPerRepository);
  const keepRunsPerRepository = Math.max(1, Number.parseInt(input.keepRunsPerRepository || `${defaults.keepRunsPerRepository}`, 10) || defaults.keepRunsPerRepository);
  return { keepSnapshotsPerRepository, keepRunsPerRepository };
}
