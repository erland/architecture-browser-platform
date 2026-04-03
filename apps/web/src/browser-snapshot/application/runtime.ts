import { getBrowserSnapshotCache } from '../../api/snapshotCache';
import type { PreparedSnapshotCacheReadPort } from './ports/preparedSnapshotCache';

export function getBrowserPreparedSnapshotCache(): PreparedSnapshotCacheReadPort {
  return getBrowserSnapshotCache();
}
