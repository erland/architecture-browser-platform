/**
 * Application-layer helpers for prepared snapshot access and selection.
 *
 * This layer owns browser-facing prepared-snapshot workflows so controllers and
 * hooks do not depend directly on transport/cache implementation details.
 */

export { findPreferredPreparedSnapshotId, loadPreparedSnapshotRecordForSummary } from './preparedSnapshots';
export { getBrowserPreparedSnapshotCache } from './runtime';
export type { PreparedSnapshotCacheReadPort, PreparedSnapshotCacheRecord } from './ports/preparedSnapshotCache';
