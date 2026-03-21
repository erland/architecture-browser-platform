export function toSnapshotExplorerErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}
