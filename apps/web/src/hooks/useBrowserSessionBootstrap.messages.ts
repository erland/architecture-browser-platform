export function toBrowserSessionBootstrapErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

export function buildBrowserSessionReadyMessage(snapshotKey: string) {
  return `Browser session ready for snapshot ${snapshotKey}.`;
}

export function buildBrowserSessionLoadingMessage(snapshotKey: string) {
  return `Loading prepared Browser session for snapshot ${snapshotKey}…`;
}

export function buildPreparedSnapshotUnavailableMessage(snapshotKey: string) {
  return `Snapshot ${snapshotKey} is not available locally and cannot be prepared right now.`;
}

export function buildPreparedSnapshotFetchFailureMessage(snapshotKey: string, caught: unknown) {
  return `Failed to prepare snapshot ${snapshotKey} for Browser use. ${toBrowserSessionBootstrapErrorMessage(caught)}`;
}
