import { getBrowserSnapshotCache } from '../../api/snapshot-cache/runtime';
import type { PreparedSnapshotCachePort } from './ports/preparedSnapshotCache';

export function getBrowserPreparedSnapshotCache(): PreparedSnapshotCachePort {
  return getBrowserSnapshotCache();
}
