export function summarizeComparisonHeadline(summary: {
  addedEntityCount: number;
  removedEntityCount: number;
  addedRelationshipCount: number;
  removedRelationshipCount: number;
}) {
  return `${summary.addedEntityCount} added entities · ${summary.removedEntityCount} removed entities · ${summary.addedRelationshipCount} added relationships · ${summary.removedRelationshipCount} removed relationships`;
}

export function comparisonSnapshotOptions<T extends { id: string; snapshotKey: string; importedAt: string }>(snapshots: T[], selectedSnapshotId: string | null) {
  return snapshots
    .filter((snapshot) => snapshot.id !== selectedSnapshotId)
    .sort((left, right) => right.importedAt.localeCompare(left.importedAt))
    .map((snapshot) => ({ value: snapshot.id, label: `${snapshot.snapshotKey} · ${snapshot.importedAt}` }));
}
