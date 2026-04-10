import { browserSessionLifecycleAdapter } from '../adapters/browser-session-impl/browserSessionAdapter';
import { getBrowserSnapshotCache } from '../../api/snapshot-cache/runtime';
import type { SavedCanvasSnapshotCachePort } from './ports/snapshotCache';

export function getBrowserSavedCanvasSnapshotCache(): SavedCanvasSnapshotCachePort {
  return getBrowserSnapshotCache();
}

import type { SavedCanvasBrowserSessionLifecyclePort } from './browser-state/browserSessionPort';

export function getSavedCanvasBrowserSessionLifecycle(): SavedCanvasBrowserSessionLifecyclePort {
  return browserSessionLifecycleAdapter;
}
