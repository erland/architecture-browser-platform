import type { FullSnapshotPayload, SnapshotSummary } from '../app-model';
import { platformApi } from '../api/platformApi';
import type { PreparedSnapshotCachePort } from '../browser-snapshot';

export async function fetchAndCachePreparedSnapshotRecord(options: {
  cache: PreparedSnapshotCachePort;
  snapshot: SnapshotSummary;
  fetchFullSnapshotPayload?: (workspaceId: string, snapshotId: string) => Promise<FullSnapshotPayload>;
}) {
  const { cache, snapshot, fetchFullSnapshotPayload } = options;
  const fetchPayload = fetchFullSnapshotPayload ?? ((workspaceId: string, snapshotId: string) =>
    platformApi.getFullSnapshotPayload<FullSnapshotPayload>(workspaceId, snapshotId));

  const payload = await fetchPayload(snapshot.workspaceId, snapshot.id);
  return cache.putSnapshot({
    workspaceId: snapshot.workspaceId,
    repositoryId: snapshot.repositoryRegistrationId,
    snapshotKey: snapshot.snapshotKey,
    cacheVersion: cache.buildCacheVersion(payload.snapshot),
    payload,
  });
}
