import { getBrowserSnapshotCache } from '../../api/snapshotCache';
import type { PreparedSnapshotCachePort } from './ports/preparedSnapshotCache';

export function getBrowserPreparedSnapshotCache(): PreparedSnapshotCachePort {
  return getBrowserSnapshotCache();
}
